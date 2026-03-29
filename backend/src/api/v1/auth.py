"""Authentication endpoints: register, login, logout, refresh, password reset,
guest sessions, and anonymous migration."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from src.core.auth import get_current_user, get_optional_user
from src.core.config import settings
from src.core.database import get_db
from src.models.guest_session import GuestSession
from src.schemas.auth import (
    ForgotPasswordRequest,
    GuestStatusResponse,
    LoginRequest,
    LoginResponse,
    MigrateAnonymousRequest,
    MigrateResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    TokenResponse,
    UserOut,
)
from src.services.auth import supabase_client
from src.services.auth.user_service import (
    create_user,
    get_user_by_id,
    migrate_anonymous_to_user,
    update_last_login,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Use Redis backend for distributed rate limiting if redis_url is configured
_storage_uri = settings.redis_url if settings.redis_url else None
limiter = Limiter(key_func=get_remote_address, storage_uri=_storage_uri)

GUEST_CONVERSATION_LIMIT = 5


# ── Guest ─────────────────────────────────────────────────────────────────────


@router.post("/guest", response_model=TokenResponse)
async def guest_session(request: Request):
    """Initialize an anonymous guest session."""
    resp = supabase_client.sign_in_anonymously()
    session = resp.get("session") or resp
    return TokenResponse(
        access_token=session["access_token"],
        token_type="bearer",
        expires_in=session.get("expires_in", 3600),
        role="anon",
    )


@router.get("/guest/status", response_model=GuestStatusResponse)
async def guest_status(
    db: Session = Depends(get_db),
    token: Optional[dict] = Depends(get_optional_user),
):
    """Return guest session chat limit status."""
    if token is None or token.get("role") != "anon":
        return GuestStatusResponse(
            is_guest=False,
            conversation_count=0,
            conversation_limit=GUEST_CONVERSATION_LIMIT,
            limit_reached=False,
        )
    sub = token.get("sub")
    row = db.query(GuestSession).filter(GuestSession.user_id == uuid.UUID(sub)).first()
    count = row.conversation_count if row else 0
    return GuestStatusResponse(
        is_guest=True,
        conversation_count=count,
        conversation_limit=GUEST_CONVERSATION_LIMIT,
        limit_reached=count >= GUEST_CONVERSATION_LIMIT,
    )


# ── Register ──────────────────────────────────────────────────────────────────


@router.post(
    "/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
async def register(
    request: Request, body: RegisterRequest, db: Session = Depends(get_db)
):
    """Create a new email/password account."""
    resp = supabase_client.sign_up(body.email, body.password)

    if resp.status_code == 422 or (
        resp.status_code == 400 and "already" in resp.text.lower()
    ):
        raise HTTPException(
            status_code=409,
            detail={"code": "EMAIL_EXISTS", "message": "Email already registered"},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail={"code": "AUTH_ERROR", "message": "Registration failed"},
        )

    data = resp.json()
    user_data = data.get("user") or data
    user_id = user_data["id"]
    email_confirmed = bool(user_data.get("email_confirmed_at"))

    # Create app_users row
    create_user(db, user_id=user_id, email=body.email, display_name=body.display_name)

    return RegisterResponse(
        user_id=user_id,
        email=body.email,
        display_name=body.display_name,
        email_verified=email_confirmed,
    )


# ── Login ─────────────────────────────────────────────────────────────────────


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email/password."""
    resp = supabase_client.sign_in_with_password(body.email, body.password)

    if resp.status_code == 400:
        data = resp.json()
        msg = data.get("error_description", "").lower()
        if "verify" in msg or "confirm" in msg:
            raise HTTPException(
                status_code=403,
                detail={"code": "EMAIL_NOT_VERIFIED", "message": "Email not verified"},
            )
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password",
            },
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password",
            },
        )

    data = resp.json()
    user_data = data.get("user", {})
    user_id = user_data.get("id")

    # Update last_login
    if user_id and get_user_by_id(db, user_id):
        update_last_login(db, user_id)

    return LoginResponse(
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        token_type="bearer",
        expires_in=data.get("expires_in", 3600),
        user=UserOut(
            user_id=user_id,
            email=user_data.get("email", body.email),
            display_name="",  # fetched from app_users if needed
            email_verified=bool(user_data.get("email_confirmed_at")),
        ),
    )


# ── Logout ────────────────────────────────────────────────────────────────────


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, token: dict = Depends(get_current_user)):
    """Revoke current session."""
    raw = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    supabase_client.revoke_session(raw)


# ── Refresh ───────────────────────────────────────────────────────────────────


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    """Exchange a refresh token for a new access token."""
    resp = supabase_client.refresh_token(body.refresh_token)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_REFRESH_TOKEN",
                "message": "Invalid or expired refresh token",
            },
        )
    data = resp.json()
    return {
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
        "expires_in": data.get("expires_in", 3600),
    }


# ── Password reset ────────────────────────────────────────────────────────────


@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(request: Request, body: ForgotPasswordRequest):
    """Send a password reset email. Always returns 200 (no email enumeration)."""
    supabase_client.send_password_reset(body.email, redirect_to="")
    return {"message": "If an account exists, a reset link has been sent."}


@router.post("/resend-verification")
@limiter.limit("3/hour")
async def resend_verification(request: Request, body: ResendVerificationRequest):
    """Resend email verification. Always returns 200."""
    supabase_client.resend_verification(body.email)
    return {"message": "If an account exists, a verification email has been sent."}


# ── Anonymous migration ───────────────────────────────────────────────────────


@router.post("/migrate-anonymous", response_model=MigrateResponse)
async def migrate_anonymous(
    body: MigrateAnonymousRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    """Migrate anonymous conversations to the newly registered account."""
    new_user_id = token["sub"]
    result = migrate_anonymous_to_user(
        db, anonymous_user_id=body.anonymous_user_id, new_user_id=new_user_id
    )
    return MigrateResponse(**result)
