import json
from pathlib import Path
from urllib.parse import urlparse

_bias_data: dict | None = None

DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "allsides_sources.json"

BIAS_CATEGORIES = {
    "left": "left",
    "center-left": "center",
    "center": "center",
    "center-right": "center",
    "right": "right",
}


def _load_data() -> dict:
    global _bias_data
    if _bias_data is None:
        with open(DATA_PATH) as f:
            raw = json.load(f)
        _bias_data = {}
        for source in raw["sources"]:
            _bias_data[source["domain"]] = {
                "name": source["name"],
                "domain": source["domain"],
                "bias_rating": source["bias_rating"],
                "confidence": source["confidence"],
                "bias_category": BIAS_CATEGORIES.get(source["bias_rating"], "center"),
            }
    return _bias_data


def get_bias_for_domain(domain: str) -> dict | None:
    data = _load_data()
    domain = domain.lower().lstrip("www.")
    return data.get(domain)


def get_bias_for_url(url: str) -> dict | None:
    parsed = urlparse(url)
    domain = parsed.netloc.lower().lstrip("www.")
    return get_bias_for_domain(domain)


def get_bias_category(bias_rating: str) -> str:
    return BIAS_CATEGORIES.get(bias_rating, "center")


def get_all_sources() -> list[dict]:
    data = _load_data()
    return list(data.values())
