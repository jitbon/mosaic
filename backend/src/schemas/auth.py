import re
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("display_name")
    @classmethod
    def display_name_length(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 100:
            raise ValueError("display_name must be 1–100 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class MigrateAnonymousRequest(BaseModel):
    anonymous_user_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: Optional[str] = None


class UserOut(BaseModel):
    user_id: str
    email: str
    display_name: str
    email_verified: bool


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    email_verified: bool


class GuestStatusResponse(BaseModel):
    is_guest: bool
    conversation_count: int
    conversation_limit: int
    limit_reached: bool


class MigrateResponse(BaseModel):
    migrated_conversations: int
    migrated_debates: int
