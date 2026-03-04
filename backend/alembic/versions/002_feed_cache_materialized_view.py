"""Add materialized view for feed cache

Revision ID: 002
Revises: 001
Create Date: 2026-03-04
"""
from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS feed_cache AS
        SELECT
            s.id,
            s.headline,
            s.summary,
            s.published_at,
            s.left_count,
            s.center_count,
            s.right_count,
            s.is_blindspot,
            s.blindspot_perspective,
            (s.left_count + s.center_count + s.right_count) AS total_coverage,
            (SELECT a.image_url FROM articles a WHERE a.story_id = s.id AND a.image_url IS NOT NULL LIMIT 1) AS image_url
        FROM stories s
        ORDER BY s.published_at DESC
    """)
    op.execute("CREATE UNIQUE INDEX ix_feed_cache_id ON feed_cache (id)")
    op.execute("CREATE INDEX ix_feed_cache_published_at ON feed_cache (published_at DESC)")
    op.execute("CREATE INDEX ix_feed_cache_is_blindspot ON feed_cache (is_blindspot)")


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS feed_cache")
