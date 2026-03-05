import logging

from sqlalchemy.orm import Session

from src.models.article_chunk import ArticleChunk

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
    """Retrieve relevant article chunks for a persona.

    Uses recency-based retrieval filtered by perspective.
    TODO: Add vector similarity search (e.g. Voyage AI embeddings + pgvector)
    when article volume justifies semantic ranking over recency.
    """
    bias_labels = BIAS_MAP.get(perspective, [perspective])

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


def format_rag_context(chunks: list[dict], perspective: str) -> str:
    """Format retrieved chunks as a numbered reference list for the system prompt."""
    if not chunks:
        return f"No source articles available for the {perspective} perspective on this story."

    lines = [f"SOURCES FOR {perspective.upper()} PERSPECTIVE:\n"]
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata", {})
        lines.append(
            f"[{i}] {meta.get('source_name', 'Unknown')} ({meta.get('published_at', 'N/A')})"
        )
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
