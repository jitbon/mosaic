"""Add story_summaries table

Revision ID: 006_story_summaries_table
Revises: 005_token_usage_table
Create Date: 2026-03-22
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "006_story_summaries_table"
down_revision = "005_token_usage_table"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "story_summaries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("perspective", sa.String(20), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("source_article_ids", JSONB(), nullable=False),
        sa.Column("source_version_hash", sa.String(64), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "story_id", "perspective", name="uq_story_summaries_story_perspective"
        ),
    )
    op.create_index("ix_story_summaries_story_id", "story_summaries", ["story_id"])
    op.create_index("ix_story_summaries_expires_at", "story_summaries", ["expires_at"])


def downgrade():
    op.drop_table("story_summaries")
