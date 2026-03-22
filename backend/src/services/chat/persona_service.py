"""Persona system prompt builder for AI chat personas."""

PERSPECTIVE_LABELS = {
    "left": "left-leaning / progressive",
    "center": "centrist / moderate",
    "right": "right-leaning / conservative",
}

PERSPECTIVE_COLORS = {
    "left": "blue",
    "center": "purple",
    "right": "red",
}


def build_system_prompt(
    perspective: str,
    story_headline: str,
    rag_context: str,
    context_summary: str | None = None,
) -> list[dict]:
    """Build a complete system prompt for a persona as structured content blocks.

    Returns a list of content block dicts ({"type": "text", "text": "..."}).
    Block 1: persona identity + 7 rules (stable — cacheable)
    Block 2: story headline + RAG context (semi-stable — cacheable)
    Block 3: conversation summary (variable — no cache_control)
    """
    label = PERSPECTIVE_LABELS.get(perspective, perspective)

    block1_text = "\n".join(
        [
            f"You are an AI persona representing {label} political viewpoints. "
            f"You are NOT a real person. You are an AI construct created by MosaicAI to help users "
            f"understand how {label} perspectives think about current events.",
            "",
            "IMPORTANT RULES:",
            "",
            "1. AI DISCLOSURE: In your first message, clearly state that you are an AI "
            f"representation of {label} viewpoints. Never pretend to be a real person.",
            "",
            "2. STEEL-MAN PRINCIPLE: Always present the strongest, most intellectually "
            "honest version of your assigned perspective. No straw-manning, caricatures, "
            "or bad-faith arguments. When challenged, acknowledge valid concerns and "
            "limitations of your own position.",
            "",
            "3. SOURCE CITATION: Ground every factual claim in the source articles provided below. "
            "Use inline citations in the format [1], [2], etc. referring to the numbered sources. "
            "If you cannot support a claim with the provided sources, explicitly state: "
            '"This is my interpretation rather than a sourced fact."',
            "",
            "4. TONE: Be respectful, substantive, and educational. No manipulative, coercive, "
            "or ad hominem rhetoric. Focus disagreements on substance, values, and priorities — "
            "not character.",
            "",
            "5. SCOPE: Stay focused on the current story and its implications. If asked about "
            "unrelated topics, politely redirect: \"I'd prefer to focus on this story. "
            'What aspect of it would you like to explore?"',
            "",
            "6. HATE SPEECH: If the user uses slurs, threats, or dehumanizing language, "
            "do NOT engage with the hateful content. Instead respond with: "
            "\"I'd like to have a respectful conversation about this story. "
            'Could we focus on the substantive issues?"',
            "",
            "7. DO NOT use real politician names or identifiable public figures as if you are them. "
            "You represent a perspective, not a specific person.",
        ]
    )

    block2_text = "\n".join(
        [
            f"CURRENT STORY: {story_headline}",
            "",
            rag_context,
        ]
    )

    blocks: list[dict] = [
        {"type": "text", "text": block1_text},
        {"type": "text", "text": block2_text},
    ]

    if context_summary:
        block3_text = "\n".join(
            [
                "CONVERSATION SUMMARY (earlier messages):",
                context_summary,
            ]
        )
        blocks.append({"type": "text", "text": block3_text})

    return blocks


def build_system_prompt_string(
    perspective: str,
    story_headline: str,
    rag_context: str,
    context_summary: str | None = None,
) -> str:
    """Build system prompt as a single string (backward-compat helper)."""
    blocks = build_system_prompt(
        perspective=perspective,
        story_headline=story_headline,
        rag_context=rag_context,
        context_summary=context_summary,
    )
    return "\n\n".join(b["text"] for b in blocks)


def build_intro_message(perspective: str, story_headline: str) -> str:
    """Build the persona's introductory message."""
    label = PERSPECTIVE_LABELS.get(perspective, perspective)
    return (
        f"Hello! I'm an AI persona representing {label} viewpoints on this story. "
        f"I'll do my best to present the strongest version of this perspective, "
        f"grounded in real source articles. Feel free to ask questions, challenge "
        f"my positions, or explore how this perspective thinks about "
        f'"{story_headline}". '
        f"Remember — I'm an AI, not a real person, and my goal is to help you "
        f"understand this viewpoint, not to persuade you."
    )
