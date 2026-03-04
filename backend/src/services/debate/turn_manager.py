"""Turn rotation and round boundary management for multi-persona debates."""

PERSPECTIVE_TO_ROLE = {
    "left": "persona_left",
    "center": "persona_center",
    "right": "persona_right",
}

ROLE_TO_PERSPECTIVE = {v: k for k, v in PERSPECTIVE_TO_ROLE.items()}


def get_persona_roles(personas: list[str]) -> list[str]:
    """Convert perspective names to role strings in rotation order."""
    return [PERSPECTIVE_TO_ROLE[p] for p in personas]


def get_next_role(personas: list[str], turn_number: int) -> str:
    """Given a turn number, return the role that should speak.

    Turn rotation repeats: for ["left", "right"], turn 0 = persona_left,
    turn 1 = persona_right, turn 2 = persona_left, etc.
    Moderator turns are not counted in the rotation — they are inserted
    separately and don't advance the persona index.
    """
    roles = get_persona_roles(personas)
    return roles[turn_number % len(roles)]


def get_round_number(personas: list[str], persona_turn_index: int) -> int:
    """Calculate which round a persona turn belongs to (1-based).

    persona_turn_index counts only persona turns (excludes moderator turns).
    """
    return (persona_turn_index // len(personas)) + 1


def is_round_complete(personas: list[str], persona_turn_index: int) -> bool:
    """Check if the current persona turn completes a round."""
    return (persona_turn_index + 1) % len(personas) == 0


def get_round_roles(personas: list[str]) -> list[str]:
    """Return the ordered list of roles for one complete round."""
    return get_persona_roles(personas)
