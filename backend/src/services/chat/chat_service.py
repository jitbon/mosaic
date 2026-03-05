"""Chat orchestration service: RAG retrieval → prompt building → Claude streaming."""

import json
import logging
import re
from collections.abc import AsyncGenerator
from typing import Optional

from anthropic import AsyncAnthropic
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.story import Story
from src.services.chat.context_manager import (
    get_conversation_context,
    summarize_if_needed,
)
from src.services.chat.persona_service import build_system_prompt
from src.services.chat.rag_service import format_rag_context, retrieve_chunks
from src.services.chat.reaction_context import build_reaction_context

logger = logging.getLogger(__name__)

_anthropic_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _format_sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


_ABUSE_REDIRECT_PHRASES = [
    "let's focus on the news",
    "let's get back to",
    "i'd prefer to discuss",
    "i can't engage with",
    "let's return to discussing",
    "i'm not able to respond to",
    "that's outside what i can discuss",
    "i need to redirect",
]


def _is_abuse_redirect(response_text: str) -> bool:
    """Detect if the AI response is a redirection due to abusive input."""
    lower = response_text.lower()
    return any(phrase in lower for phrase in _ABUSE_REDIRECT_PHRASES)


def _extract_citations(response_text: str, chunks: list[dict]) -> list[dict]:
    """Extract [N] citation references from response and resolve to article metadata."""
    refs = set(re.findall(r"\[(\d+)\]", response_text))
    citations = []

    for ref_str in sorted(refs):
        ref_idx = int(ref_str)
        if 1 <= ref_idx <= len(chunks):
            chunk = chunks[ref_idx - 1]
            meta = chunk.get("metadata", {})
            citations.append(
                {
                    "index": ref_idx,
                    "source_name": meta.get("source_name", "Unknown"),
                    "article_title": meta.get("article_title", "Untitled"),
                    "article_url": meta.get("article_url", ""),
                    "bias_label": chunk.get("bias_label", ""),
                    "quoted_text": chunk.get("content", "")[:200],
                }
            )

    return citations


def _get_or_create_conversation(
    db: Session, story_id: int, perspective: str, conversation_id: Optional[int]
) -> tuple[Optional[Conversation], bool, Optional[str]]:
    """Resolve or create a conversation. Returns (conversation, is_new, error_sse)."""
    if conversation_id:
        conversation = (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
        if not conversation:
            return (
                None,
                False,
                _format_sse(
                    {
                        "type": "error",
                        "code": "not_found",
                        "message": "Conversation not found",
                    }
                ),
            )
        if conversation.is_ended:
            return (
                None,
                False,
                _format_sse(
                    {
                        "type": "ended",
                        "reason": "abuse_threshold",
                        "message": "This conversation was ended due to repeated policy violations. You can start a new conversation.",
                    }
                ),
            )
        return conversation, False, None

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.story_id == story_id,
            Conversation.perspective == perspective,
            Conversation.is_ended.is_(False),
        )
        .first()
    )
    if conversation:
        return conversation, False, None

    conversation = Conversation(story_id=story_id, perspective=perspective)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation, True, None


def _handle_abuse_check(
    db: Session, conversation: Conversation, full_response: str
) -> Optional[str]:
    """Check for abuse redirection. Returns an SSE event string if conversation should end."""
    if _is_abuse_redirect(full_response):
        conversation.abuse_redirect_count = (conversation.abuse_redirect_count or 0) + 1
        if conversation.abuse_redirect_count >= settings.chat_abuse_redirect_limit:
            conversation.is_ended = True
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
            )
            db.add(assistant_msg)
            db.commit()
            return _format_sse(
                {
                    "type": "ended",
                    "reason": "abuse_threshold",
                    "message": "This conversation has been ended due to repeated policy violations.",
                }
            )
        db.commit()
    elif conversation.abuse_redirect_count:
        conversation.abuse_redirect_count = 0
        db.commit()
    return None


async def stream_chat_response(
    db: Session,
    story_id: int,
    user_message: str,
    perspective: str,
    conversation_id: Optional[int] = None,
) -> AsyncGenerator[str, None]:
    """Orchestrate a chat response: retrieve context, build prompt, stream from Claude."""

    # 1. Validate story
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        yield _format_sse(
            {"type": "error", "code": "not_found", "message": "Story not found"}
        )
        return

    # 2. Get or create conversation
    conversation, is_new, error_event = _get_or_create_conversation(
        db, story_id, perspective, conversation_id
    )
    if error_event:
        yield error_event
        return

    if is_new:
        yield _format_sse(
            {"type": "conversation_start", "conversation_id": conversation.id}
        )

    # 3. Save user message
    user_msg = Message(
        conversation_id=conversation.id, role="user", content=user_message
    )
    db.add(user_msg)
    db.commit()

    # 4. Check if context needs summarization
    had_summary = conversation.context_summary is not None
    await summarize_if_needed(db, conversation)
    if conversation.context_summary and not had_summary:
        yield _format_sse({"type": "context_summarized"})

    # 5. Retrieve RAG chunks and build prompt
    query_text = f"{story.headline}. {user_message}"
    chunks = retrieve_chunks(db, story_id, perspective, query_text)
    rag_context = format_rag_context(chunks, perspective)
    system_prompt = build_system_prompt(
        perspective=perspective,
        story_headline=story.headline,
        rag_context=rag_context,
        context_summary=conversation.context_summary,
    )
    messages = get_conversation_context(db, conversation)

    # 5b. Inject reaction context if any reactions exist
    reaction_block = build_reaction_context(db, conversation.id)
    if reaction_block and messages:
        # Prepend reaction feedback to the last user message
        last_user_idx = next(
            (
                i
                for i in range(len(messages) - 1, -1, -1)
                if messages[i]["role"] == "user"
            ),
            None,
        )
        if last_user_idx is not None:
            messages = list(messages)
            messages[last_user_idx] = {
                **messages[last_user_idx],
                "content": reaction_block + "\n\n" + messages[last_user_idx]["content"],
            }

    # 6. Stream from Claude
    client = _get_client()
    full_response = ""

    try:
        async with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                full_response += text
                yield _format_sse({"type": "token", "text": text})
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        yield _format_sse({"type": "error", "code": "llm_error", "message": str(e)})
        return

    # 7. Parse citations
    citations_data = _extract_citations(full_response, chunks)
    if citations_data:
        yield _format_sse({"type": "citation", "citations": citations_data})

    # 8. Check for abuse redirection
    ended_event = _handle_abuse_check(db, conversation, full_response)
    if ended_event:
        yield ended_event
        return

    # 9. Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=full_response,
        citations=citations_data if citations_data else None,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    yield _format_sse({"type": "done", "message_id": assistant_msg.id})
