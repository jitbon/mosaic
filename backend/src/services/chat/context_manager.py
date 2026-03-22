"""Conversation context management: sliding window + progressive summarization."""

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


def get_conversation_context(
    db: Session,
    conversation: Conversation,
    system_prompt_tokens: int = 0,
    new_message_tokens: int = 0,
) -> list[dict]:
    """Build the message history for Claude using a sliding window strategy.

    Keeps the most recent N messages verbatim (configurable via
    context_window_recent_messages). If budget remains, the rolling summary
    is prepended as a synthetic user/assistant exchange.
    """
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    if not messages:
        return []

    recent_n = settings.context_window_recent_messages
    recent_messages = messages[-recent_n:]
    older_messages = messages[:-recent_n] if len(messages) > recent_n else []

    available_budget = (
        settings.token_budget_chat - system_prompt_tokens - new_message_tokens
    )

    # Build result from recent messages
    result = [{"role": m.role, "content": m.content} for m in recent_messages]

    # Count tokens used by recent messages
    recent_tokens = sum(count_tokens(m.content) for m in recent_messages)
    remaining_budget = available_budget - recent_tokens

    # Include rolling summary if there are older messages and budget allows
    if older_messages and conversation.context_summary and remaining_budget > 0:
        summary_tokens = count_tokens(conversation.context_summary)
        if summary_tokens <= remaining_budget:
            result = [
                {
                    "role": "user",
                    "content": f"[CONVERSATION SUMMARY — earlier messages]\n{conversation.context_summary}",
                },
                {
                    "role": "assistant",
                    "content": "Understood. I'll keep that context in mind.",
                },
            ] + result
        else:
            # Truncate summary progressively to fit budget
            words = conversation.context_summary.split()
            truncated = []
            token_count = 0
            for word in words:
                token_count += 1  # approximate
                if token_count > remaining_budget - 20:
                    break
                truncated.append(word)
            if truncated:
                truncated_summary = " ".join(truncated) + "..."
                result = [
                    {
                        "role": "user",
                        "content": f"[CONVERSATION SUMMARY — earlier messages]\n{truncated_summary}",
                    },
                    {
                        "role": "assistant",
                        "content": "Understood. I'll keep that context in mind.",
                    },
                ] + result

    return result


def _count_context_tokens(messages: list[dict]) -> int:
    """Estimate total tokens in conversation history."""
    total = 0
    for msg in messages:
        total += count_tokens(msg.get("content", ""))
    return total


async def summarize_if_needed(db: Session, conversation: Conversation) -> None:
    """Progressively summarize messages that have aged out of the sliding window.

    Only summarizes newly-aged-out messages by combining them with the
    existing context_summary, rather than summarizing all old messages.
    """
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    recent_n = settings.context_window_recent_messages

    if len(messages) < recent_n + 1:
        return

    # Messages that have fallen off the sliding window
    aged_out = messages[:-recent_n]
    if not aged_out:
        return

    if conversation.context_summary:
        # Only incorporate the most recently aged-out messages (progressive update)
        new_aged_out = aged_out[-2:]
    else:
        new_aged_out = aged_out

    new_aged_tokens = sum(count_tokens(m.content) for m in new_aged_out)

    if new_aged_tokens < 100:
        return

    new_aged_input = "\n".join(f"{m.role}: {m.content}" for m in new_aged_out)

    if conversation.context_summary:
        summary_prompt = (
            "Update the following conversation summary by incorporating these new messages. "
            "The updated summary should be concise (2-4 sentences), capture all key points, "
            "positions, and citations:\n\n"
            f"EXISTING SUMMARY:\n{conversation.context_summary}\n\n"
            f"NEW MESSAGES TO INCORPORATE:\n{new_aged_input}"
        )
    else:
        summary_prompt = (
            "Summarize the following conversation in 2-3 concise sentences, "
            "capturing the key points discussed, positions taken, and any "
            "important claims or citations mentioned:\n\n"
            f"{new_aged_input}"
        )

    try:
        client = _get_client()
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": summary_prompt}],
        )
        summary = response.content[0].text

        conversation.context_summary = summary
        db.commit()

        logger.info(
            f"Progressive summary updated for conversation {conversation.id}: "
            f"{len(new_aged_out)} new aged-out messages incorporated"
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
                story_id=conversation.story_id,
                conversation_id=conversation.id,
            )
        except Exception as ue:
            logger.error(f"Failed to record summarization usage: {ue}")
    except Exception as e:
        logger.error(f"Failed to summarize conversation {conversation.id}: {e}")
