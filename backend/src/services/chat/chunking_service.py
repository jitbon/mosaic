import logging
from typing import Optional

import tiktoken
from openai import OpenAI
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.article import Article
from src.models.article_chunk import ArticleChunk
from src.models.source import Source

logger = logging.getLogger(__name__)

_openai_client: Optional[OpenAI] = None
_encoder = tiktoken.get_encoding("cl100k_base")


def _get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def count_tokens(text: str) -> int:
    return len(_encoder.encode(text))


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


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using OpenAI text-embedding-3-small."""
    if not texts:
        return []

    client = _get_openai_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


def chunk_and_embed_article(db: Session, article: Article) -> list[ArticleChunk]:
    """Chunk an article, embed chunks, and store in DB."""
    source = db.query(Source).filter(Source.id == article.source_id).first()
    if not source:
        logger.warning(f"Source not found for article {article.id}")
        return []

    text = article.snippet or article.title
    if not text:
        return []

    # Prepend title + source for context in each chunk
    prefix = f"{article.title}. {source.name}."

    raw_chunks = chunk_article_text(text)
    if not raw_chunks:
        return []

    # Prepend context to each chunk for embedding
    texts_to_embed = [f"{prefix} {chunk}" for chunk in raw_chunks]

    try:
        embeddings = embed_texts(texts_to_embed)
    except Exception as e:
        logger.error(f"Failed to embed article {article.id}: {e}")
        return []

    created_chunks = []
    for i, (chunk_text, embedding) in enumerate(zip(raw_chunks, embeddings)):
        chunk = ArticleChunk(
            article_id=article.id,
            story_id=article.story_id,
            bias_label=source.bias_rating,
            chunk_index=i,
            content=chunk_text,
            embedding=str(embedding),
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
    """Chunk and embed all articles for a story. Returns chunk count."""
    # Check if chunks already exist
    existing = (
        db.query(ArticleChunk)
        .filter(ArticleChunk.story_id == story_id)
        .count()
    )
    if existing > 0:
        logger.info(f"Story {story_id} already has {existing} chunks, skipping")
        return existing

    articles = db.query(Article).filter(Article.story_id == story_id).all()
    total_chunks = 0
    for article in articles:
        chunks = chunk_and_embed_article(db, article)
        total_chunks += len(chunks)

    return total_chunks
