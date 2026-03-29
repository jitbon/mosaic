"""User service: create, fetch, and update app_users + user_preferences."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from src.models.user import User, UserPreference


def _is_apple_relay_email(email: str) -> bool:
    return email.endswith("@privaterelay.appleid.com")


def create_user(
    db: Session,
    *,
    user_id: str,
    email: str,
    display_name: str,
    provider_email: Optional[str] = None,
) -> User:
    """Insert a new app_users row plus a default user_preferences row.

    For Apple private relay emails, provider_email is stored in social_accounts
    but the main app_users.email is only set from a real email address.
    """
    uid = uuid.UUID(user_id)
    stored_email = email
    if (
        _is_apple_relay_email(email)
        and provider_email
        and not _is_apple_relay_email(provider_email)
    ):
        stored_email = provider_email

    user = User(
        id=uid,
        email=stored_email,
        display_name=display_name,
        account_status="active",
    )
    db.add(user)
    db.flush()

    prefs = UserPreference(user_id=uid, notification_prefs={})
    db.add(prefs)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == uuid.UUID(user_id)).first()


def update_last_login(db: Session, user_id: str) -> None:
    db.query(User).filter(User.id == uuid.UUID(user_id)).update(
        {"last_login_at": datetime.now(timezone.utc)}
    )
    db.commit()


def migrate_anonymous_to_user(
    db: Session, *, anonymous_user_id: str, new_user_id: str
) -> dict:
    """Reassign conversations and debates from an anonymous sub to a registered user."""
    from sqlalchemy import text

    anon_uuid = uuid.UUID(anonymous_user_id)
    new_uuid = uuid.UUID(new_user_id)

    conv_result = db.execute(
        text("UPDATE conversations SET user_id = :new WHERE user_id = :anon"),
        {"new": new_uuid, "anon": anon_uuid},
    )
    debate_result = db.execute(
        text("UPDATE debates SET user_id = :new WHERE user_id = :anon"),
        {"new": new_uuid, "anon": anon_uuid},
    )
    db.execute(
        text("UPDATE guest_sessions SET converted_at = now() WHERE user_id = :anon"),
        {"anon": anon_uuid},
    )
    db.commit()

    return {
        "migrated_conversations": conv_result.rowcount,
        "migrated_debates": debate_result.rowcount,
    }
