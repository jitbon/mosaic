"""Add user accounts tables

Revision ID: 007_add_user_accounts
Revises: 006_story_summaries_table
Create Date: 2026-03-23
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

from alembic import op

revision = "007_add_user_accounts"
down_revision = "006_story_summaries_table"
branch_labels = None
depends_on = None


def upgrade():
    # 1. app_users
    op.create_table(
        "app_users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column(
            "account_status", sa.String(20), nullable=False, server_default="active"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_app_users_email", "app_users", ["email"], unique=True)
    op.create_index("ix_app_users_account_status", "app_users", ["account_status"])
    op.create_index("ix_app_users_deleted_at", "app_users", ["deleted_at"])

    # 2. user_preferences
    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("default_perspective", sa.String(20), nullable=True),
        sa.Column("notification_prefs", JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_user_preferences_user_id", "user_preferences", ["user_id"], unique=True
    )

    # 3. social_accounts
    op.create_table(
        "social_accounts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("provider_email", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "provider", "provider_user_id", name="uq_social_accounts_provider_user"
        ),
    )
    op.create_index("ix_social_accounts_user_id", "social_accounts", ["user_id"])

    # 4. guest_sessions
    op.create_table(
        "guest_sessions",
        sa.Column("user_id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "conversation_count", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 5. conversations.user_id
    op.add_column(
        "conversations",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_conversations_user_id", "conversations", ["user_id"])

    # 6. debates.user_id
    op.add_column(
        "debates",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_debates_user_id", "debates", ["user_id"])

    # 7. debate_turns.user_id + display_name
    op.add_column(
        "debate_turns",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("app_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "debate_turns",
        sa.Column("display_name", sa.String(100), nullable=False, server_default="AI"),
    )
    op.create_index("ix_debate_turns_user_id", "debate_turns", ["user_id"])


def downgrade():
    op.drop_index("ix_debate_turns_user_id", "debate_turns")
    op.drop_column("debate_turns", "display_name")
    op.drop_column("debate_turns", "user_id")

    op.drop_index("ix_debates_user_id", "debates")
    op.drop_column("debates", "user_id")

    op.drop_index("ix_conversations_user_id", "conversations")
    op.drop_column("conversations", "user_id")

    op.drop_table("guest_sessions")
    op.drop_table("social_accounts")
    op.drop_table("user_preferences")
    op.drop_table("app_users")
