"""Conversation context management: token counting and summarization."""

import logging
from typing import Optional

from anthropic import AsyncAnthropic
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.message import Message
from src.services.chat.chunking_service import count_tokens

logger = logging.getLogger(__name__)

_anthropic_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def get_conversation_context(db: Session, conversation: Conversation) -> list[dict]:
    """Build the message history for Claude, respecting token limits."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    if not messages:
        return []

    result = []
    for msg in messages:
        result.append(
            {
                "role": msg.role,
                "content": msg.content,
            }
        )

    return result


def _count_context_tokens(messages: list[dict]) -> int:
    """Estimate total tokens in conversation history."""
    total = 0
    for msg in messages:
        total += count_tokens(msg.get("content", ""))
    return total


async def summarize_if_needed(db: Session, conversation: Conversation) -> None:
    """Summarize earlier messages if context exceeds token limit."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    if len(messages) < 6:
        return

    # Count tokens in message history
    total_tokens = sum(count_tokens(m.content) for m in messages)

    if total_tokens <= settings.chat_context_token_limit:
        return

    # Summarize all but the last 4 messages
    messages_to_summarize = messages[:-4]
    if not messages_to_summarize:
        return

    summary_input = "\n".join(f"{m.role}: {m.content}" for m in messages_to_summarize)

    try:
        client = _get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Summarize the following conversation in 2-3 concise sentences, "
                        "capturing the key points discussed, positions taken, and any "
                        "important claims or citations mentioned:\n\n"
                        f"{summary_input}"
                    ),
                }
            ],
        )
        summary = response.content[0].text

        conversation.context_summary = summary
        db.commit()

        logger.info(
            f"Summarized conversation {conversation.id}: "
            f"{total_tokens} tokens → summary of {len(messages_to_summarize)} messages"
        )
    except Exception as e:
        logger.error(f"Failed to summarize conversation {conversation.id}: {e}")
