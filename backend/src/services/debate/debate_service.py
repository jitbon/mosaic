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
    """Build the debate history using a sliding window strategy.

    Keeps the last N turns verbatim and prepends the rolling summary if one exists.
    Respects token_budget_debate to stay within context limits.
    """
    turns = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate.id)
        .order_by(DebateTurn.turn_number.asc())
        .all()
    )

    recent_n = settings.context_window_recent_messages
    recent_turns = turns[-recent_n:]
    older_turns = turns[:-recent_n] if len(turns) > recent_n else []

    messages = []
    for turn in recent_turns:
        if turn.role == "moderator":
            messages.append({"role": "user", "content": f"[MODERATOR]: {turn.content}"})
        else:
            perspective = ROLE_TO_PERSPECTIVE.get(turn.role, turn.role)
            label = PERSPECTIVE_LABELS.get(perspective, perspective)
            messages.append(
                {
                    "role": "assistant",
                    "content": f"[{label.upper()} PERSPECTIVE]: {turn.content}",
                }
            )

    # Prepend rolling summary for older turns if available
    if older_turns and debate.context_summary:
        recent_tokens = sum(count_tokens(t.content or "") for t in recent_turns)
        remaining = settings.token_budget_debate - recent_tokens
        summary_tokens = count_tokens(debate.context_summary)
        if summary_tokens <= remaining and remaining > 0:
            messages = [
                {
                    "role": "user",
                    "content": f"[DEBATE SUMMARY — earlier turns]\n{debate.context_summary}",
                },
                {
                    "role": "assistant",
                    "content": "Understood. I'll build on those earlier arguments.",
                },
            ] + messages

    return messages


def _build_debate_system_prompt(
    perspective: str,
    story_headline: str,
    rag_context: str,
    debate: Debate,
    is_first_turn: bool,
) -> list[dict]:
    """Build system prompt for a debate persona turn as structured content blocks."""
    base_blocks = build_system_prompt(
        perspective=perspective,
        story_headline=story_headline,
        rag_context=rag_context,
        context_summary=debate.context_summary,
    )

    debate_rules_lines = [
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
        debate_rules_lines.extend(
            [
                "",
                "This is the OPENING of the debate. Present your perspective's position on the story. "
                "Clearly state your main argument and supporting evidence from the sources.",
            ]
        )

    # Append debate rules to Block 1 (persona identity block)
    blocks = []
    for i, block in enumerate(base_blocks):
        if i == 0:
            blocks.append(
                {**block, "text": block["text"] + "\n".join(debate_rules_lines)}
            )
        else:
            blocks.append(block)

    # Add cache_control to stable blocks (Block 1 with debate rules, Block 2 story+RAG)
    cached_blocks = []
    for i, block in enumerate(blocks):
        if i < 2:
            cached_blocks.append({**block, "cache_control": {"type": "ephemeral"}})
        else:
            cached_blocks.append(block)

    return cached_blocks


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
    """Progressively summarize debate turns that have aged out of the sliding window."""
    turns = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate.id)
        .order_by(DebateTurn.turn_number.asc())
        .all()
    )

    recent_n = settings.context_window_recent_messages
    if len(turns) < recent_n + 1:
        return

    aged_out = turns[:-recent_n]
    if not aged_out:
        return

    if debate.context_summary:
        new_aged_out = aged_out[-2:]
    else:
        new_aged_out = aged_out

    new_aged_tokens = sum(count_tokens(t.content or "") for t in new_aged_out)
    if new_aged_tokens < 100:
        return

    new_aged_input = "\n".join(
        f"{PERSPECTIVE_LABELS.get(ROLE_TO_PERSPECTIVE.get(t.role, t.role), t.role)}: {t.content}"
        for t in new_aged_out
    )

    if debate.context_summary:
        summary_prompt = (
            "Update the following debate summary by incorporating these new turns. "
            "The updated summary should be concise (3-4 sentences), capturing each persona's "
            "key arguments and any important evidence or citations:\n\n"
            f"EXISTING SUMMARY:\n{debate.context_summary}\n\n"
            f"NEW TURNS TO INCORPORATE:\n{new_aged_input}"
        )
    else:
        summary_prompt = (
            "Summarize the following debate exchange in 3-4 concise sentences, "
            "capturing each persona's key arguments, positions taken, and any "
            "important evidence or citations referenced:\n\n"
            f"{new_aged_input}"
        )

    try:
        client = _get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": summary_prompt}],
        )
        debate.context_summary = response.content[0].text
        db.commit()
        logger.info(
            f"Progressive summary updated for debate {debate.id}: "
            f"{len(new_aged_out)} new aged-out turns incorporated"
        )

        # T023: Record summarization usage
        try:
            from src.services.usage.usage_service import record_usage

            usage = response.usage
            record_usage(
                db=db,
                feature_type="summarization",
                model_name="claude-haiku-4-5-20251001",
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                story_id=debate.story_id,
                debate_id=debate.id,
            )
        except Exception as ue:
            logger.error(f"Failed to record debate summarization usage: {ue}")
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

        # Build system prompt (returns list of content blocks with cache_control)
        system_blocks = _build_debate_system_prompt(
            perspective=perspective,
            story_headline=story.headline,
            rag_context=rag_context,
            debate=debate,
            is_first_turn=is_first_turn,
        )
        # Fallback blocks without cache_control (used if caching is unsupported)
        system_blocks_no_cache = [
            {k: v for k, v in b.items() if k != "cache_control"} for b in system_blocks
        ]

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

        # Pre-call token count estimate for discrepancy tracking (T017)
        pre_call_estimate = sum(
            count_tokens(b.get("text", "")) for b in system_blocks
        ) + sum(count_tokens(m.get("content", "")) for m in messages)

        # Stream from Claude
        client = _get_client()
        full_response = ""
        usage_data: dict = {}

        try:
            async with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=system_blocks,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    full_response += text
                    yield _format_sse({"type": "token", "text": text})
                final_msg = await stream.get_final_message()
                usage = final_msg.usage
                cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
                cache_creation = getattr(usage, "cache_creation_input_tokens", 0) or 0
                estimated_cost = (
                    (
                        usage.input_tokens
                        * settings.model_cost_input_per_million
                        / 1_000_000
                    )
                    + (
                        usage.output_tokens
                        * settings.model_cost_output_per_million
                        / 1_000_000
                    )
                    + (
                        cache_read
                        * settings.model_cost_cache_read_per_million
                        / 1_000_000
                    )
                    + (
                        cache_creation
                        * settings.model_cost_cache_write_per_million
                        / 1_000_000
                    )
                )
                usage_data = {
                    "input_tokens": usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "cache_creation_tokens": cache_creation,
                    "cache_read_tokens": cache_read,
                    "estimated_cost_usd": round(estimated_cost, 6),
                }
                logger.info(
                    f"Debate usage debate={debate.id} role={role} "
                    f"input={usage.input_tokens} output={usage.output_tokens} "
                    f"cache_creation={cache_creation} cache_read={cache_read} "
                    f"cost=${estimated_cost:.6f}"
                )
                # T017: Log discrepancy if pre-call estimate vs provider-reported differs >5%
                if usage.input_tokens > 0:
                    discrepancy = (
                        abs(pre_call_estimate - usage.input_tokens) / usage.input_tokens
                    )
                    if discrepancy > 0.05:
                        logger.warning(
                            f"Token count discrepancy debate={debate.id} role={role}: "
                            f"estimated={pre_call_estimate} actual={usage.input_tokens} "
                            f"discrepancy={discrepancy:.1%}"
                        )
        except Exception as e:
            logger.warning(
                f"Claude API error with cache_control for debate, retrying without: {e}"
            )
            try:
                async with client.messages.stream(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=1024,
                    system=system_blocks_no_cache,
                    messages=messages,
                ) as stream:
                    async for text in stream.text_stream:
                        full_response += text
                        yield _format_sse({"type": "token", "text": text})
                    final_msg = await stream.get_final_message()
                    usage = final_msg.usage
                    estimated_cost = (
                        usage.input_tokens
                        * settings.model_cost_input_per_million
                        / 1_000_000
                    ) + (
                        usage.output_tokens
                        * settings.model_cost_output_per_million
                        / 1_000_000
                    )
                    usage_data = {
                        "input_tokens": usage.input_tokens,
                        "output_tokens": usage.output_tokens,
                        "cache_creation_tokens": 0,
                        "cache_read_tokens": 0,
                        "estimated_cost_usd": round(estimated_cost, 6),
                    }
            except Exception as e2:
                logger.error(f"Claude API error during debate turn: {e2}")
                yield _format_sse(
                    {"type": "error", "code": "llm_error", "message": str(e2)}
                )
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

        # Emit usage event for this turn
        if usage_data:
            yield _format_sse({"type": "usage", **usage_data})

        # Record usage to DB (T022)
        if usage_data:
            try:
                from src.services.usage.usage_service import record_usage

                record_usage(
                    db=db,
                    feature_type="debate",
                    model_name="claude-haiku-4-5-20251001",
                    input_tokens=usage_data["input_tokens"],
                    output_tokens=usage_data["output_tokens"],
                    cache_creation_tokens=usage_data["cache_creation_tokens"],
                    cache_read_tokens=usage_data["cache_read_tokens"],
                    story_id=debate.story_id,
                    debate_id=debate.id,
                )
            except Exception as e:
                logger.error(f"Failed to record usage for debate {debate.id}: {e}")

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
