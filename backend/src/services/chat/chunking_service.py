import logging

from sqlalchemy.orm import Session

from src.models.article import Article
from src.models.article_chunk import ArticleChunk
from src.models.source import Source

logger = logging.getLogger(__name__)


def count_tokens(text: str) -> int:
    """Approximate token count using whitespace splitting (~75% accuracy)."""
    return len(text.split())


def chunk_article_text(
    text: str, max_tokens: int = 350, overlap_tokens: int = 50
) -> list[str]:
    """Split text into chunks at paragraph boundaries, ~300-400 tokens each."""
    if not text or not text.strip():
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    if not paragraphs:
        return [text.strip()] if text.strip() else []

    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para_tokens = count_tokens(para)

        if para_tokens > max_tokens:
            # Split long paragraph at sentence boundaries
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""
            sentences = para.replace(". ", ".\n").split("\n")
            for sentence in sentences:
                if count_tokens(current_chunk + " " + sentence) > max_tokens:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    current_chunk = (
                        current_chunk + " " + sentence if current_chunk else sentence
                    )
            continue

        combined = current_chunk + "\n\n" + para if current_chunk else para
        if count_tokens(combined) > max_tokens:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk = combined

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def chunk_and_store_article(db: Session, article: Article) -> list[ArticleChunk]:
    """Chunk an article, embed chunks, and store in DB."""
    source = db.query(Source).filter(Source.id == article.source_id).first()
    if not source:
        logger.warning(f"Source not found for article {article.id}")
        return []

    text = article.snippet or article.title
    if not text:
        return []

    raw_chunks = chunk_article_text(text)
    if not raw_chunks:
        return []

    # TODO: Add vector embeddings (e.g. Voyage AI) when article volume
    # justifies semantic search. Current scale works fine with recency-based
    # retrieval — see rag_service._fallback_retrieve().

    created_chunks = []
    for i, chunk_text in enumerate(raw_chunks):
        chunk = ArticleChunk(
            article_id=article.id,
            story_id=article.story_id,
            bias_label=source.bias_rating,
            chunk_index=i,
            content=chunk_text,
            metadata_={
                "source_name": source.name,
                "article_title": article.title,
                "article_url": article.url,
                "published_at": (
                    article.published_at.isoformat() if article.published_at else None
                ),
            },
        )
        db.add(chunk)
        created_chunks.append(chunk)

    db.commit()
    logger.info(
        f"Created {len(created_chunks)} chunks for article {article.id} "
        f"(story={article.story_id}, bias={source.bias_rating})"
    )
    return created_chunks


def chunk_story_articles(db: Session, story_id: int) -> int:
    """Chunk all articles for a story. Returns chunk count."""
    existing = db.query(ArticleChunk).filter(ArticleChunk.story_id == story_id).count()
    if existing > 0:
        logger.info(f"Story {story_id} already has {existing} chunks, skipping")
        return existing

    articles = db.query(Article).filter(Article.story_id == story_id).all()
    total_chunks = 0
    for article in articles:
        chunks = chunk_and_store_article(db, article)
        total_chunks += len(chunks)

    return total_chunks
