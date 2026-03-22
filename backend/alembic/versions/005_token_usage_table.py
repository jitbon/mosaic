"""Add token_usage and token_usage_daily tables

Revision ID: 005_token_usage_table
Revises: 004_debate_tables
Create Date: 2026-03-22
"""

import sqlalchemy as sa

from alembic import op

revision = "005_token_usage_table"
down_revision = "004_debate_tables"
branch_labels = None
depends_on = None


def upgrade():
    # token_usage: per-API-call tracking
    op.create_table(
        "token_usage",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("feature_type", sa.String(20), nullable=False),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("conversations.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "debate_id",
            sa.Integer(),
            sa.ForeignKey("debates.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column(
            "cache_creation_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "cache_read_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("estimated_cost_usd", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_token_usage_feature_type", "token_usage", ["feature_type"])
    op.create_index("ix_token_usage_story_id", "token_usage", ["story_id"])
    op.create_index("ix_token_usage_created_at", "token_usage", ["created_at"])
    op.create_index(
        "ix_token_usage_feature_created", "token_usage", ["feature_type", "created_at"]
    )

    # token_usage_daily: aggregated daily summaries
    op.create_table(
        "token_usage_daily",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("feature_type", sa.String(20), nullable=False),
        sa.Column("total_input_tokens", sa.BigInteger(), nullable=False),
        sa.Column("total_output_tokens", sa.BigInteger(), nullable=False),
        sa.Column("total_cache_creation_tokens", sa.BigInteger(), nullable=False),
        sa.Column("total_cache_read_tokens", sa.BigInteger(), nullable=False),
        sa.Column("total_estimated_cost_usd", sa.Float(), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.Column("cache_hit_count", sa.Integer(), nullable=False),
        sa.UniqueConstraint(
            "date", "feature_type", name="uq_token_usage_daily_date_feature"
        ),
    )
    op.create_index("ix_token_usage_daily_date", "token_usage_daily", ["date"])


def downgrade():
    op.drop_table("token_usage_daily")
    op.drop_table("token_usage")
