from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

VALID_PERSPECTIVES = {"left", "center", "right"}


class DebateCreate(BaseModel):
    personas: list[str] = Field(..., min_length=2, max_length=3)

    @field_validator("personas")
    @classmethod
    def validate_personas(cls, v: list[str]) -> list[str]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate perspectives are not allowed")
        for p in v:
            if p not in VALID_PERSPECTIVES:
                raise ValueError(
                    f"Invalid perspective: {p}. Must be one of {VALID_PERSPECTIVES}"
                )
        return v


class DebateResponse(BaseModel):
    id: int
    story_id: int
    personas: list[str]
    status: str
    current_round: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CitationDetail(BaseModel):
    index: int
    source_name: str
    article_title: str
    article_url: str
    bias_label: str
    quoted_text: str


class DebateTurnResponse(BaseModel):
    id: int
    turn_number: int
    role: str
    content: str
    summary: Optional[str] = None
    citations: Optional[list[CitationDetail]] = None
    round_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DebateDetailResponse(BaseModel):
    id: int
    story_id: int
    personas: list[str]
    status: str
    current_round: int
    created_at: datetime
    updated_at: datetime
    turns: list[DebateTurnResponse] = []

    model_config = {"from_attributes": True}


class DebateListItem(BaseModel):
    id: int
    story_id: int
    personas: list[str]
    status: str
    current_round: int
    turn_count: int
    created_at: datetime
    updated_at: datetime
    last_turn_preview: Optional[str] = None

    model_config = {"from_attributes": True}


class DebateListResponse(BaseModel):
    debates: list[DebateListItem]


class InterjectionCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    directed_at: Optional[str] = None

    @field_validator("directed_at")
    @classmethod
    def validate_directed_at(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_PERSPECTIVES:
            raise ValueError(
                f"Invalid perspective: {v}. Must be one of {VALID_PERSPECTIVES}"
            )
        return v


class InterjectionResponse(BaseModel):
    turn_id: int
    turn_number: int
    role: str
    content: str
    directed_at: Optional[str] = None
