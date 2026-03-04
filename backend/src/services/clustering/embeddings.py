import logging
import numpy as np

logger = logging.getLogger("mosaic.embeddings")

_model = None


def _load_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded sentence-transformers model: all-MiniLM-L6-v2")
        except ImportError:
            logger.warning(
                "sentence-transformers not installed, using fallback TF-IDF embeddings"
            )
            _model = "fallback"
    return _model


def get_embeddings(texts: list[str]) -> np.ndarray:
    model = _load_model()

    if model == "fallback":
        return _tfidf_embeddings(texts)

    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return np.array(embeddings)


def get_embedding(text: str) -> np.ndarray:
    return get_embeddings([text])[0]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _tfidf_embeddings(texts: list[str]) -> np.ndarray:
    from sklearn.feature_extraction.text import TfidfVectorizer

    vectorizer = TfidfVectorizer(max_features=384, stop_words="english")
    matrix = vectorizer.fit_transform(texts)
    return matrix.toarray()
