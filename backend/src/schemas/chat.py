from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    perspective: str = Field(..., pattern="^(left|center|right)$")
    conversation_id: Optional[int] = None


class CitationDetail(BaseModel):
    index: int
    source_name: str
    article_title: str
    article_url: str
    bias_label: str
    quoted_text: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    citations: Optional[list[CitationDetail]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: int
    story_id: int
    perspective: str
    is_ended: bool
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    id: int
    story_id: int
    perspective: str
    message_count: int
    is_ended: bool
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationSummary]


class PerspectiveInfo(BaseModel):
    available: bool
    source_count: int


class PerspectiveAvailabilityResponse(BaseModel):
    perspectives: dict[str, PerspectiveInfo]
