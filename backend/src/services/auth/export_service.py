"""User data export: builds an in-memory ZIP of profile, conversations, debates."""

import io
import json
import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from src.models.conversation import Conversation
from src.models.debate import Debate
from src.models.debate_turn import DebateTurn
from src.models.message import Message
from src.models.user import User, UserPreference


def _serialize(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def generate_user_data_zip(user_id: str, db: Session) -> io.BytesIO:
    """Build a ZIP containing profile.json, conversations.json, debates.json."""
    uid = uuid.UUID(user_id)

    user = db.query(User).filter(User.id == uid).first()
    prefs = db.query(UserPreference).filter(UserPreference.user_id == uid).first()

    profile_data = {
        "user_id": str(uid),
        "email": user.email if user else "",
        "display_name": user.display_name if user else "",
        "created_at": user.created_at if user else None,
        "last_login_at": user.last_login_at if user else None,
        "preferences": {
            "default_perspective": prefs.default_perspective if prefs else None,
            "notification_prefs": prefs.notification_prefs if prefs else {},
        },
    }

    convs = db.query(Conversation).filter(Conversation.user_id == uid).all()
    conversations_data = []
    for conv in convs:
        msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
            .all()
        )
        conversations_data.append(
            {
                "id": conv.id,
                "story_id": conv.story_id,
                "perspective": conv.perspective,
                "created_at": conv.created_at,
                "messages": [
                    {"role": m.role, "content": m.content, "created_at": m.created_at}
                    for m in msgs
                ],
            }
        )

    debates = db.query(Debate).filter(Debate.user_id == uid).all()
    debates_data = []
    for debate in debates:
        turns = (
            db.query(DebateTurn)
            .filter(DebateTurn.debate_id == debate.id)
            .order_by(DebateTurn.turn_number)
            .all()
        )
        debates_data.append(
            {
                "id": debate.id,
                "story_id": debate.story_id,
                "personas": debate.personas,
                "status": debate.status,
                "created_at": debate.created_at,
                "turns": [
                    {
                        "role": t.role,
                        "content": t.content,
                        "round_number": t.round_number,
                    }
                    for t in turns
                ],
            }
        )

    buf = io.BytesIO()
    import zipfile

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "profile.json", json.dumps(profile_data, default=_serialize, indent=2)
        )
        zf.writestr(
            "conversations.json",
            json.dumps(conversations_data, default=_serialize, indent=2),
        )
        zf.writestr(
            "debates.json", json.dumps(debates_data, default=_serialize, indent=2)
        )

    buf.seek(0)
    return buf
