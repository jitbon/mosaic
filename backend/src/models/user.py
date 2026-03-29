from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from src.core.database import Base


class User(Base):
    __tablename__ = "app_users"

    id = Column(UUID(as_uuid=True), primary_key=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    account_status = Column(String(20), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    preferences = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    social_accounts = relationship(
        "SocialAccount", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_app_users_email", "email", unique=True),
        Index("ix_app_users_account_status", "account_status"),
        Index("ix_app_users_deleted_at", "deleted_at"),
    )


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("app_users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    default_perspective = Column(String(20), nullable=True)
    notification_prefs = Column(JSONB, nullable=False, default=dict)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="preferences")

    __table_args__ = (Index("ix_user_preferences_user_id", "user_id", unique=True),)


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("app_users.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider = Column(String(20), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="social_accounts")

    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_user_id", name="uq_social_accounts_provider_user"
        ),
        Index("ix_social_accounts_user_id", "user_id"),
    )
