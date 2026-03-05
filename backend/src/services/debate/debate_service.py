"""Debate orchestration: create debates, generate rounds, stream SSE events."""

import json
import logging
import re
from collections.abc import AsyncGenerator
from typing import Optional

from anthropic import AsyncAnthropic
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.debate import Debate
from src.models.debate_turn import DebateTurn
from src.models.story import Story
from src.services.chat.chat_service import _is_abuse_redirect
from src.services.chat.chunking_service import count_tokens
from src.services.chat.persona_service import PERSPECTIVE_LABELS, build_system_prompt
from src.services.chat.rag_service import (
    format_rag_context,
    retrieve_chunks,
)
from src.services.debate.summary_service import extract_summary, strip_summary_marker
from src.services.debate.turn_manager import (
    ROLE_TO_PERSPECTIVE,
    get_round_roles,
)

logger = logging.getLogger(__name__)

_anthropic_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _format_sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


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


def create_debate(db: Session, story_id: int, personas: list[str]) -> Debate:
    """Create a new debate record."""
    debate = Debate(story_id=story_id, personas=personas)
    db.add(debate)
    db.commit()
    db.refresh(debate)
    return debate


def get_debate(db: Session, debate_id: int) -> Optional[Debate]:
    """Get a debate by ID."""
    return db.query(Debate).filter(Debate.id == debate_id).first()


def _get_next_turn_number(db: Session, debate_id: int) -> int:
    """Get the next sequential turn number for a debate."""
    last_turn = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate_id)
        .order_by(DebateTurn.turn_number.desc())
        .first()
    )
    return (last_turn.turn_number + 1) if last_turn else 0


def _build_debate_history(db: Session, debate: Debate) -> list[dict]:
    """Build the debate history as Claude messages for context."""
    turns = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate.id)
        .order_by(DebateTurn.turn_number.asc())
        .all()
    )
    messages = []
    for turn in turns:
        if turn.role == "moderator":
            messages.append(
                {
                    "role": "user",
                    "content": f"[MODERATOR]: {turn.content}",
                }
            )
        else:
            perspective = ROLE_TO_PERSPECTIVE.get(turn.role, turn.role)
            label = PERSPECTIVE_LABELS.get(perspective, perspective)
            messages.append(
                {
                    "role": "assistant",
                    "content": f"[{label.upper()} PERSPECTIVE]: {turn.content}",
                }
            )
    return messages


def _build_debate_system_prompt(
    perspective: str,
    story_headline: str,
    rag_context: str,
    debate: Debate,
    is_first_turn: bool,
) -> str:
    """Build system prompt for a debate persona turn."""
    base_prompt = build_system_prompt(
        perspective=perspective,
        story_headline=story_headline,
        rag_context=rag_context,
        context_summary=debate.context_summary,
    )

    debate_rules = [
        "",
        "DEBATE MODE RULES:",
        "",
        "You are in a structured debate with other AI personas representing different perspectives.",
        "Each persona takes turns presenting arguments on the current news story.",
        "",
        "8. DEBATE ENGAGEMENT: Directly address and respond to points made by other personas. "
        "Do not argue in isolation — reference specific arguments from other perspectives and "
        "explain why you agree, disagree, or see it differently.",
        "",
        "9. STEEL-MAN OPPONENTS: When disagreeing with another persona, first acknowledge "
        "the strongest version of their argument before presenting your counter-argument.",
        "",
        "10. TURN LENGTH: Keep your response to 2-4 paragraphs. Be substantive but concise.",
        "",
        "11. SUMMARY: End your response with [SUMMARY: A 1-2 sentence summary of your key argument]",
    ]

    if is_first_turn:
        debate_rules.append(
            "",
        )
        debate_rules.append(
            "This is the OPENING of the debate. Present your perspective's position on the story. "
            "Clearly state your main argument and supporting evidence from the sources."
        )

    return base_prompt + "\n".join(debate_rules)


def check_abuse_and_store_interjection(
    db: Session, debate: Debate, message: str, directed_at: Optional[str] = None
) -> tuple[DebateTurn, bool]:
    """Store a moderator interjection. Returns (turn, debate_ended).

    Checks for abusive content via abuse redirect detection on the next
    persona response. For now, we track interjections and let the persona
    system prompt handle redirection.
    """
    turn_number = _get_next_turn_number(db, debate.id)
    turn = DebateTurn(
        debate_id=debate.id,
        turn_number=turn_number,
        role="moderator",
        content=message,
        summary=None,
        citations=None,
        round_number=debate.current_round,
    )
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return turn, False


def _handle_debate_abuse_check(
    db: Session, debate: Debate, response_text: str
) -> Optional[str]:
    """Check if the persona response indicates abuse redirection.

    Returns an SSE 'ended' event string if the debate should end, else None.
    """
    if _is_abuse_redirect(response_text):
        debate.abuse_redirect_count = (debate.abuse_redirect_count or 0) + 1
        if debate.abuse_redirect_count >= settings.chat_abuse_redirect_limit:
            debate.status = "completed"
            db.commit()
            return _format_sse(
                {
                    "type": "ended",
                    "reason": "abuse_threshold",
                    "message": "This debate has been ended due to repeated policy violations.",
                }
            )
        db.commit()
    elif debate.abuse_redirect_count:
        debate.abuse_redirect_count = 0
        db.commit()
    return None


# Keep backward compatibility
def store_interjection(
    db: Session, debate: Debate, message: str, directed_at: Optional[str] = None
) -> DebateTurn:
    """Store a moderator interjection as a debate turn."""
    turn, _ = check_abuse_and_store_interjection(db, debate, message, directed_at)
    return turn


async def _summarize_debate_if_needed(db: Session, debate: Debate) -> None:
    """Summarize earlier debate turns when context exceeds token limit."""
    turns = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate.id)
        .order_by(DebateTurn.turn_number.asc())
        .all()
    )

    if len(turns) < 6:
        return

    total_tokens = sum(count_tokens(t.content or "") for t in turns)
    if total_tokens <= settings.debate_context_token_limit:
        return

    # Summarize all but the last 4 turns
    turns_to_summarize = turns[:-4]
    if not turns_to_summarize:
        return

    summary_input = "\n".join(
        f"{PERSPECTIVE_LABELS.get(ROLE_TO_PERSPECTIVE.get(t.role, t.role), t.role)}: {t.content}"
        for t in turns_to_summarize
    )

    try:
        client = _get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Summarize the following debate exchange in 3-4 concise sentences, "
                        "capturing each persona's key arguments, positions taken, and any "
                        "important evidence or citations referenced:\n\n"
                        f"{summary_input}"
                    ),
                }
            ],
        )
        debate.context_summary = response.content[0].text
        db.commit()
        logger.info(
            f"Summarized debate {debate.id}: {total_tokens} tokens → "
            f"summary of {len(turns_to_summarize)} turns"
        )
    except Exception as e:
        logger.error(f"Failed to summarize debate {debate.id}: {e}")


async def stream_debate_round(db: Session, debate: Debate) -> AsyncGenerator[str, None]:
    """Stream a full debate round — each persona speaks once in rotation."""
    story = db.query(Story).filter(Story.id == debate.story_id).first()
    if not story:
        yield _format_sse(
            {"type": "error", "code": "not_found", "message": "Story not found"}
        )
        return

    if debate.status != "active":
        yield _format_sse(
            {"type": "error", "code": "conflict", "message": "Debate is not active"}
        )
        return

    round_number = debate.current_round + 1
    roles = get_round_roles(debate.personas)
    is_first_round = debate.current_round == 0

    yield _format_sse({"type": "round_start", "round_number": round_number})

    for role_idx, role in enumerate(roles):
        perspective = ROLE_TO_PERSPECTIVE[role]
        turn_number = _get_next_turn_number(db, debate.id)
        is_first_turn = is_first_round and role_idx == 0

        yield _format_sse(
            {
                "type": "turn_start",
                "role": role,
                "turn_number": turn_number,
            }
        )

        # Retrieve RAG chunks for this perspective
        query_text = story.headline
        chunks = retrieve_chunks(db, debate.story_id, perspective, query_text)
        rag_context = format_rag_context(chunks, perspective)

        # Build system prompt
        system_prompt = _build_debate_system_prompt(
            perspective=perspective,
            story_headline=story.headline,
            rag_context=rag_context,
            debate=debate,
            is_first_turn=is_first_turn,
        )

        # Build message history from previous turns
        messages = _build_debate_history(db, debate)

        # Add a user message to prompt this persona's turn
        if messages:
            # Claude requires alternating user/assistant. Add a user prompt.
            turn_prompt = (
                f"Now it's your turn as the {PERSPECTIVE_LABELS.get(perspective, perspective)} persona. "
                "Respond to the previous arguments and present your perspective."
            )
            messages.append({"role": "user", "content": turn_prompt})
        else:
            messages.append(
                {
                    "role": "user",
                    "content": f"Begin the debate. Present the {PERSPECTIVE_LABELS.get(perspective, perspective)} "
                    "perspective on this news story.",
                }
            )

        # Stream from Claude
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
            logger.error(f"Claude API error during debate turn: {e}")
            yield _format_sse({"type": "error", "code": "llm_error", "message": str(e)})
            return

        # Check for abuse redirection in the response
        abuse_event = _handle_debate_abuse_check(db, debate, full_response)
        if abuse_event:
            yield abuse_event
            return

        # Extract summary and clean response
        summary = extract_summary(full_response)
        clean_content = strip_summary_marker(full_response)

        # Extract citations
        citations_data = _extract_citations(clean_content, chunks)
        if citations_data:
            yield _format_sse({"type": "citation", "citations": citations_data})

        # Store the turn
        turn = DebateTurn(
            debate_id=debate.id,
            turn_number=turn_number,
            role=role,
            content=clean_content,
            summary=summary,
            citations=citations_data if citations_data else None,
            round_number=round_number,
        )
        db.add(turn)
        db.commit()
        db.refresh(turn)

        # Emit turn summary and complete events
        yield _format_sse(
            {
                "type": "turn_summary",
                "turn_id": str(turn.id),
                "summary": summary,
            }
        )
        yield _format_sse(
            {
                "type": "turn_complete",
                "turn_id": str(turn.id),
                "role": role,
            }
        )

    # Summarize if context is getting large
    await _summarize_debate_if_needed(db, debate)

    # Update debate round counter
    debate.current_round = round_number
    db.commit()

    yield _format_sse(
        {
            "type": "round_complete",
            "round_number": round_number,
            "debate_id": str(debate.id),
        }
    )
