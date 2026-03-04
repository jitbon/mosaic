"""Add chat tables: article_chunks, conversations, messages

Revision ID: 003_chat_tables
Revises: 002_feed_cache_materialized_view
Create Date: 2026-03-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003_chat_tables"
down_revision = "002_feed_cache_materialized_view"
branch_labels = None
depends_on = None


def upgrade():
    # Enable pgvector extension if not already enabled
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Article chunks for RAG
    op.create_table(
        "article_chunks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("bias_label", sa.String(20), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.Column("metadata", JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_article_chunks_story_id", "article_chunks", ["story_id"])
    op.create_index(
        "ix_article_chunks_story_bias", "article_chunks", ["story_id", "bias_label"]
    )

    # Add vector column and index (pgvector)
    op.execute(
        "ALTER TABLE article_chunks ADD COLUMN embedding_vector vector(1536)"
    )
    op.execute(
        "CREATE INDEX ix_article_chunks_embedding ON article_chunks "
        "USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100)"
    )

    # Conversations
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "story_id",
            sa.Integer(),
            sa.ForeignKey("stories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("perspective", sa.String(10), nullable=False),
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
        sa.Column("abuse_redirect_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_ended", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("context_summary", sa.Text(), nullable=True),
    )
    op.create_index(
        "ix_conversations_story_perspective",
        "conversations",
        ["story_id", "perspective"],
    )
    op.create_index("ix_conversations_updated_at", "conversations", ["updated_at"])

    # Messages
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("citations", JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index(
        "ix_messages_conversation_created",
        "messages",
        ["conversation_id", "created_at"],
    )


def downgrade():
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_index("ix_article_chunks_embedding", "article_chunks")
    op.drop_table("article_chunks")
