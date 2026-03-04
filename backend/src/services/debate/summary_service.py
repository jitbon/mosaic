"""Parse and extract turn summaries from persona responses."""

import re

_SUMMARY_PATTERN = re.compile(r"\[SUMMARY:\s*(.*?)\]", re.DOTALL)


def extract_summary(response_text: str) -> str:
    """Extract the [SUMMARY: ...] marker from a persona response.

    Returns the summary text. Falls back to the first sentence if no marker found.
    """
    match = _SUMMARY_PATTERN.search(response_text)
    if match:
        return match.group(1).strip()
    return _fallback_summary(response_text)


def strip_summary_marker(response_text: str) -> str:
    """Remove the [SUMMARY: ...] marker from the response text for display."""
    return _SUMMARY_PATTERN.sub("", response_text).rstrip()


def _fallback_summary(response_text: str) -> str:
    """Fallback: use the first sentence of the response as summary."""
    text = response_text.strip()
    for delimiter in [".", "!", "?"]:
        idx = text.find(delimiter)
        if idx != -1 and idx < 300:
            return text[: idx + 1]
    # If no sentence boundary found, truncate
    return text[:150] + "..." if len(text) > 150 else text
