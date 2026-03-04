import logging
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.article_chunk import ArticleChunk
from src.services.chat.chunking_service import embed_texts

logger = logging.getLogger(__name__)

# Map persona perspectives to source bias labels
BIAS_MAP = {
    "left": ["left"],
    "center": ["center-left", "center", "center-right"],
    "right": ["right"],
}


def retrieve_chunks(
    db: Session,
    story_id: int,
    perspective: str,
    query_text: str,
    max_chunks: int = 8,
    max_per_article: int = 2,
) -> list[dict]:
    """Retrieve relevant article chunks for a persona using pgvector similarity search."""
    bias_labels = BIAS_MAP.get(perspective, [perspective])

    # Embed the query
    try:
        embeddings = embed_texts([query_text])
        if not embeddings:
            return _fallback_retrieve(db, story_id, bias_labels, max_chunks)
        query_embedding = embeddings[0]
    except Exception as e:
        logger.warning(f"Embedding failed, using fallback retrieval: {e}")
        return _fallback_retrieve(db, story_id, bias_labels, max_chunks)

    # Vector similarity search via pgvector
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    try:
        result = db.execute(
            text("""
                SELECT
                    ac.id, ac.article_id, ac.content, ac.metadata,
                    ac.bias_label, ac.chunk_index,
                    1 - (ac.embedding_vector <=> :embedding::vector) AS similarity
                FROM article_chunks ac
                WHERE ac.story_id = :story_id
                    AND ac.bias_label = ANY(:bias_labels)
                ORDER BY ac.embedding_vector <=> :embedding::vector
                LIMIT :limit
            """),
            {
                "embedding": embedding_str,
                "story_id": story_id,
                "bias_labels": bias_labels,
                "limit": max_chunks * 2,  # Fetch extra for diversity re-ranking
            },
        )
        rows = result.mappings().all()
    except Exception as e:
        logger.warning(f"Vector search failed, using fallback: {e}")
        return _fallback_retrieve(db, story_id, bias_labels, max_chunks)

    if not rows:
        return _fallback_retrieve(db, story_id, bias_labels, max_chunks)

    # Diversity re-ranking: max N chunks per article
    return _rerank_chunks(
        [dict(row) for row in rows],
        max_per_article=max_per_article,
        total=max_chunks,
    )


def _fallback_retrieve(
    db: Session, story_id: int, bias_labels: list[str], max_chunks: int
) -> list[dict]:
    """Fallback: retrieve chunks by recency without vector similarity."""
    chunks = (
        db.query(ArticleChunk)
        .filter(
            ArticleChunk.story_id == story_id,
            ArticleChunk.bias_label.in_(bias_labels),
        )
        .order_by(ArticleChunk.created_at.desc())
        .limit(max_chunks)
        .all()
    )
    return [
        {
            "id": c.id,
            "article_id": c.article_id,
            "content": c.content,
            "metadata": c.metadata_,
            "bias_label": c.bias_label,
            "chunk_index": c.chunk_index,
            "similarity": 0.0,
        }
        for c in chunks
    ]


def _rerank_chunks(
    chunks: list[dict], max_per_article: int = 2, total: int = 8
) -> list[dict]:
    """Re-rank chunks to ensure diversity: max N per article."""
    seen: dict[int, list[dict]] = {}
    for chunk in chunks:
        aid = chunk["article_id"]
        if aid not in seen:
            seen[aid] = []
        if len(seen[aid]) < max_per_article:
            seen[aid].append(chunk)

    # Flatten sorted by best similarity per article group
    result = []
    for group in sorted(
        seen.values(),
        key=lambda g: g[0].get("similarity", 0),
        reverse=True,
    ):
        result.extend(group)

    return result[:total]


def format_rag_context(chunks: list[dict], perspective: str) -> str:
    """Format retrieved chunks as a numbered reference list for the system prompt."""
    if not chunks:
        return f"No source articles available for the {perspective} perspective on this story."

    lines = [f"SOURCES FOR {perspective.upper()} PERSPECTIVE:\n"]
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata", {})
        lines.append(f"[{i}] {meta.get('source_name', 'Unknown')} ({meta.get('published_at', 'N/A')})")
        lines.append(f"Title: {meta.get('article_title', 'Untitled')}")
        lines.append(f"Excerpt: {chunk['content']}")
        lines.append(f"URL: {meta.get('article_url', 'N/A')}")
        lines.append("")

    return "\n".join(lines)


def get_perspective_availability(db: Session, story_id: int) -> dict:
    """Check which perspectives have source articles for a story."""
    result = {}
    for perspective, labels in BIAS_MAP.items():
        count = (
            db.query(ArticleChunk)
            .filter(
                ArticleChunk.story_id == story_id,
                ArticleChunk.bias_label.in_(labels),
            )
            .count()
        )
        result[perspective] = {
            "available": count > 0,
            "source_count": count,
        }
    return result
