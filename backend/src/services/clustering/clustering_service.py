import logging

import numpy as np

from src.services.clustering.embeddings import cosine_similarity, get_embeddings

logger = logging.getLogger("mosaic.clustering")


def cluster_articles(
    articles: list[dict], similarity_threshold: float = 0.75
) -> list[list[dict]]:
    if not articles:
        return []

    titles = [a.get("title", "") for a in articles]
    embeddings = get_embeddings(titles)

    n = len(articles)
    assigned = [False] * n
    clusters: list[list[dict]] = []

    for i in range(n):
        if assigned[i]:
            continue

        cluster = [articles[i]]
        assigned[i] = True

        for j in range(i + 1, n):
            if assigned[j]:
                continue

            sim = cosine_similarity(embeddings[i], embeddings[j])
            if sim >= similarity_threshold:
                cluster.append(articles[j])
                assigned[j] = True

        clusters.append(cluster)

    logger.info(
        "Clustered %d articles into %d stories (threshold=%.2f)",
        n,
        len(clusters),
        similarity_threshold,
    )

    return clusters


def pick_headline(cluster: list[dict]) -> str:
    if not cluster:
        return "Unknown Story"
    return max(cluster, key=lambda a: len(a.get("title", "")))["title"]


def pick_summary(cluster: list[dict]) -> str | None:
    for article in cluster:
        desc = article.get("description") or article.get("snippet")
        if desc and len(desc) > 50:
            return desc
    return None


def pick_image(cluster: list[dict]) -> str | None:
    for article in cluster:
        img = article.get("image") or article.get("image_url")
        if img:
            return img
    return None
