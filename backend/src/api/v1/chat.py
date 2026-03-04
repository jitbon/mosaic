import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from sqlalchemy import func as sa_func

from src.core.config import settings
from src.core.database import get_db
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.story import Story
from src.schemas.chat import (
    ChatRequest,
    ConversationListResponse,
    ConversationResponse,
    ConversationSummary,
    MessageResponse,
    PerspectiveAvailabilityResponse,
    PerspectiveInfo,
)
from src.services.chat.chat_service import stream_chat_response
from src.services.chat.rag_service import get_perspective_availability

router = APIRouter()

# Simple in-memory rate limiter (per story_id)
_rate_limits: dict[int, list[float]] = defaultdict(list)


def _check_rate_limit(story_id: int) -> None:
    now = time.time()
    window = 60.0
    max_requests = settings.chat_rate_limit_per_minute

    timestamps = _rate_limits[story_id]
    _rate_limits[story_id] = [t for t in timestamps if now - t < window]

    if len(_rate_limits[story_id]) >= max_requests:
        oldest = min(_rate_limits[story_id])
        retry_after = int(window - (now - oldest)) + 1
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again in a minute.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
            },
        )
    _rate_limits[story_id].append(now)


@router.post("/chat/{story_id}/stream")
async def chat_stream(
    story_id: int,
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """Stream a chat response from an AI persona via SSE."""
    # Validate story exists
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Rate limiting
    _check_rate_limit(story_id)

    return StreamingResponse(
        stream_chat_response(
            db=db,
            story_id=story_id,
            user_message=request.message,
            perspective=request.perspective,
            conversation_id=request.conversation_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/chat/{story_id}/perspectives")
async def get_perspectives(
    story_id: int,
    db: Session = Depends(get_db),
):
    """Check which perspectives have source articles for a story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    availability = get_perspective_availability(db, story_id)
    return PerspectiveAvailabilityResponse(
        perspectives={
            k: PerspectiveInfo(**v) for k, v in availability.items()
        }
    )


@router.get("/chat/{story_id}/conversations")
async def list_conversations(
    story_id: int,
    db: Session = Depends(get_db),
):
    """List all conversations for a story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    conversations = (
        db.query(Conversation)
        .filter(Conversation.story_id == story_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    summaries = []
    for conv in conversations:
        msg_count = (
            db.query(sa_func.count(Message.id))
            .filter(Message.conversation_id == conv.id)
            .scalar()
        )
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.role == "assistant")
            .order_by(Message.created_at.desc())
            .first()
        )
        summaries.append(
            ConversationSummary(
                id=conv.id,
                story_id=conv.story_id,
                perspective=conv.perspective,
                message_count=msg_count or 0,
                is_ended=conv.is_ended,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                last_message_preview=(
                    last_msg.content[:100] if last_msg else None
                ),
            )
        )

    return ConversationListResponse(conversations=summaries)


@router.get("/chat/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
):
    """Get full conversation with all messages."""
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return ConversationResponse(
        id=conversation.id,
        story_id=conversation.story_id,
        perspective=conversation.perspective,
        is_ended=conversation.is_ended,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=m.citations,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/chat/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
