from pydantic import BaseModel


class SourceBase(BaseModel):
    name: str
    domain: str
    bias_rating: str
    confidence: float = 1.0


class SourceRead(SourceBase):
    id: int

    model_config = {"from_attributes": True}
