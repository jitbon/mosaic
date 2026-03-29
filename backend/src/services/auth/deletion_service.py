"""Account deletion: anonymize debate turns, delete private data, call Supabase admin delete."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.models.user import User
from src.services.auth import supabase_client


def request_account_deletion(user_id: str, db: Session) -> datetime:
    """
    Soft-delete pipeline:
    1. Set account_status = 'pending_deletion', deleted_at = now()
    2. Anonymize debate_turns (display_name → 'Deleted User', user_id → NULL)
    3. Delete conversations + messages (private history)
    4. Call Supabase admin delete
    Returns the deletion_scheduled_at timestamp.
    """
    uid = uuid.UUID(user_id)
    now = datetime.now(timezone.utc)

    # 1. Mark pending
    db.query(User).filter(User.id == uid).update(
        {
            "account_status": "pending_deletion",
            "deleted_at": now,
        }
    )

    # 2. Anonymize debate turns
    db.execute(
        text(
            "UPDATE debate_turns SET display_name = 'Deleted User', user_id = NULL "
            "WHERE user_id = :uid"
        ),
        {"uid": uid},
    )

    # 3. Delete conversations (messages cascade)
    db.execute(
        text("DELETE FROM conversations WHERE user_id = :uid"),
        {"uid": uid},
    )

    db.commit()

    # 4. Delete from Supabase Auth
    try:
        supabase_client.delete_auth_user(user_id)
    except Exception:
        pass  # Best-effort; scheduled job will retry

    return now
