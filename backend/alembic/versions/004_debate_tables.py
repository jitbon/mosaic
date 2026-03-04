"""Add debate tables: debates, debate_turns

Revision ID: 004_debate_tables
Revises: 003_chat_tables
Create Date: 2026-03-04
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "004_debate_tables"
down_revision = "003_chat_tables"
branch_labels = None
depends_on = None


def upgrade():
    # Debates
    op.create_table(
        "debates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("personas", JSONB(), nullable=False),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("current_round", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "abuse_redirect_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("context_summary", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("debates_story_id_idx", "debates", ["story_id"])
    op.create_index("debates_updated_at_idx", "debates", ["updated_at"])

    # Debate turns
    op.create_table(
        "debate_turns",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "debate_id",
            sa.Integer(),
            sa.ForeignKey("debates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("turn_number", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("citations", JSONB(), nullable=True),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("debate_turns_debate_id_idx", "debate_turns", ["debate_id"])
    op.create_index(
        "debate_turns_debate_turn_idx",
        "debate_turns",
        ["debate_id", "turn_number"],
        unique=True,
    )


def downgrade():
    op.drop_table("debate_turns")
    op.drop_table("debates")
