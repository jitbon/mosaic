"""Debate API endpoints: start, round (SSE), interject, list, detail, delete."""

import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.models.debate import Debate
from src.models.debate_turn import DebateTurn
from src.models.story import Story
from src.schemas.debate import (
    DebateCreate,
    DebateDetailResponse,
    DebateListItem,
    DebateListResponse,
    DebateResponse,
    DebateTurnResponse,
    InterjectionCreate,
    InterjectionResponse,
)
from src.services.chat.rag_service import get_perspective_availability
from src.services.debate.debate_service import (
    create_debate,
    get_debate,
    store_interjection,
    stream_debate_round,
)

router = APIRouter()

# In-memory rate limiters
_round_limits: dict[int, list[float]] = defaultdict(list)  # per debate_id
_interject_limits: dict[int, list[float]] = defaultdict(list)  # per debate_id
_crud_limits: dict[str, list[float]] = defaultdict(list)  # per IP


def _check_rate_limit(
    bucket: dict, key, max_requests: int, window: float = 60.0, label: str = "requests"
) -> None:
    now = time.time()
    timestamps = bucket[key]
    bucket[key] = [t for t in timestamps if now - t < window]

    if len(bucket[key]) >= max_requests:
        oldest = min(bucket[key])
        retry_after = int(window - (now - oldest)) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {max_requests} {label}/min",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
            },
        )
    bucket[key].append(now)


@router.post("/debate/{story_id}/start", status_code=201)
async def start_debate(
    story_id: int,
    request: DebateCreate,
    req: Request = None,
    db: Session = Depends(get_db),
):
    """Create a new debate for a story with selected personas."""
    client_ip = req.client.host if req and req.client else "unknown"
    _check_rate_limit(_crud_limits, client_ip, 60, label="requests")

    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Check that each selected perspective has source articles
    availability = get_perspective_availability(db, story_id)
    for persona in request.personas:
        info = availability.get(persona, {})
        if not info.get("available", False):
            raise HTTPException(
                status_code=422,
                detail=f"Perspective '{persona}' has no source articles for this story",
            )

    debate = create_debate(db, story_id, request.personas)
    return DebateResponse(
        id=debate.id,
        story_id=debate.story_id,
        personas=debate.personas,
        status=debate.status,
        current_round=debate.current_round,
        created_at=debate.created_at,
    )


@router.post("/debate/{debate_id}/round")
async def debate_round(
    debate_id: int,
    db: Session = Depends(get_db),
):
    """Stream the next round of debate turns via SSE."""
    _check_rate_limit(_round_limits, debate_id, 5, label="rounds")

    debate = get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if debate.status in ("completed",):
        raise HTTPException(status_code=409, detail="Debate already completed")

    # Reactivate if paused
    if debate.status == "paused":
        debate.status = "active"
        db.commit()

    return StreamingResponse(
        stream_debate_round(db, debate),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/debate/{debate_id}/interject", status_code=201)
async def interject(
    debate_id: int,
    request: InterjectionCreate,
    db: Session = Depends(get_db),
):
    """Submit a moderator interjection."""
    _check_rate_limit(_interject_limits, debate_id, 10, label="interjections")

    debate = get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if debate.status == "completed":
        raise HTTPException(status_code=409, detail="Debate already completed")

    turn = store_interjection(db, debate, request.message, request.directed_at)
    return InterjectionResponse(
        turn_id=turn.id,
        turn_number=turn.turn_number,
        role="moderator",
        content=turn.content,
        directed_at=request.directed_at,
    )


@router.get("/debate/{story_id}/debates")
async def list_debates(
    story_id: int,
    db: Session = Depends(get_db),
):
    """List all debates for a story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    debates = (
        db.query(Debate)
        .filter(Debate.story_id == story_id)
        .order_by(Debate.updated_at.desc())
        .all()
    )

    items = []
    for d in debates:
        turn_count = (
            db.query(sa_func.count(DebateTurn.id))
            .filter(DebateTurn.debate_id == d.id)
            .scalar()
        ) or 0
        last_turn = (
            db.query(DebateTurn)
            .filter(DebateTurn.debate_id == d.id, DebateTurn.role != "moderator")
            .order_by(DebateTurn.turn_number.desc())
            .first()
        )
        items.append(
            DebateListItem(
                id=d.id,
                story_id=d.story_id,
                personas=d.personas,
                status=d.status,
                current_round=d.current_round,
                turn_count=turn_count,
                created_at=d.created_at,
                updated_at=d.updated_at,
                last_turn_preview=(last_turn.content[:100] if last_turn else None),
            )
        )
    return DebateListResponse(debates=items)


@router.get("/debate/{debate_id}")
async def get_debate_detail(
    debate_id: int,
    db: Session = Depends(get_db),
):
    """Get full debate with all turns."""
    debate = get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    turns = (
        db.query(DebateTurn)
        .filter(DebateTurn.debate_id == debate_id)
        .order_by(DebateTurn.turn_number.asc())
        .all()
    )

    return DebateDetailResponse(
        id=debate.id,
        story_id=debate.story_id,
        personas=debate.personas,
        status=debate.status,
        current_round=debate.current_round,
        created_at=debate.created_at,
        updated_at=debate.updated_at,
        turns=[
            DebateTurnResponse(
                id=t.id,
                turn_number=t.turn_number,
                role=t.role,
                content=t.content,
                summary=t.summary,
                citations=t.citations,
                round_number=t.round_number,
                created_at=t.created_at,
            )
            for t in turns
        ],
    )


@router.patch("/debate/{debate_id}/status")
async def update_debate_status(
    debate_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    """Update debate status (pause, complete)."""
    debate = get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    if status not in ("paused", "completed"):
        raise HTTPException(
            status_code=422, detail="Status must be 'paused' or 'completed'"
        )

    if debate.status == "completed":
        raise HTTPException(status_code=409, detail="Debate already completed")

    debate.status = status
    db.commit()
    return {"id": debate.id, "status": debate.status}


@router.delete("/debate/{debate_id}", status_code=204)
async def delete_debate(
    debate_id: int,
    db: Session = Depends(get_db),
):
    """Delete a debate and all its turns."""
    debate = get_debate(db, debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    db.delete(debate)
    db.commit()
