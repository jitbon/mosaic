"""Profile endpoints: GET/PATCH profile, change password, export data, delete account."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.core.auth import get_current_user
from src.core.database import get_db
from src.models.user import SocialAccount, User, UserPreference
from src.schemas.user import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    ProfileResponse,
    UpdateProfileRequest,
    UserPreferenceOut,
)
from src.services.auth import supabase_client
from src.services.auth.deletion_service import request_account_deletion
from src.services.auth.export_service import generate_user_data_zip

router = APIRouter(prefix="/profile", tags=["profile"])


def _build_profile(
    user: User, db: Session, email_verified: bool = True
) -> ProfileResponse:
    prefs = user.preferences or UserPreference(notification_prefs={})
    providers = [
        sa.provider
        for sa in db.query(SocialAccount).filter(SocialAccount.user_id == user.id).all()
    ]
    return ProfileResponse(
        user_id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        email_verified=email_verified,
        preferences=UserPreferenceOut(
            default_perspective=prefs.default_perspective,
            notification_prefs=prefs.notification_prefs or {},
        ),
        linked_providers=providers,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


@router.get("", response_model=ProfileResponse)
async def get_profile(
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    user_id = token["sub"]
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    return _build_profile(
        user,
        db,
        email_verified=bool(
            token.get("email_confirmed_at") or token.get("email_verified")
        ),
    )


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    user_id = token["sub"]
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )

    if body.display_name is not None:
        user.display_name = body.display_name

    if body.preferences is not None:
        prefs = user.preferences
        if prefs is None:
            prefs = UserPreference(user_id=uuid.UUID(user_id), notification_prefs={})
            db.add(prefs)
        if body.preferences.default_perspective is not None:
            prefs.default_perspective = body.preferences.default_perspective
        if body.preferences.notification_prefs is not None:
            prefs.notification_prefs = body.preferences.notification_prefs

    db.commit()
    db.refresh(user)
    return _build_profile(user, db)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    token: dict = Depends(get_current_user),
):
    # Verify current password by attempting sign-in
    email = token.get("email", "")
    verify = supabase_client.sign_in_with_password(email, body.current_password)
    if verify.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "WRONG_PASSWORD",
                "message": "Current password is incorrect",
            },
        )

    # Update password via Supabase Admin
    import httpx

    url = f"{supabase_client.SUPABASE_URL}/auth/v1/admin/users/{token['sub']}"
    resp = httpx.patch(
        url,
        json={"password": body.new_password},
        headers=supabase_client._admin_headers(),
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "PASSWORD_UPDATE_FAILED",
                "message": "Could not update password",
            },
        )


@router.post("/export")
async def export_data(
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    user_id = token["sub"]
    buf = generate_user_data_zip(user_id, db)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=my-data.zip"},
    )


@router.delete("")
async def delete_account(
    body: DeleteAccountRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    if not body.confirm:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "CONFIRMATION_REQUIRED",
                "message": "Set confirm=true to delete your account",
            },
        )

    user_id = token["sub"]
    deletion_at = request_account_deletion(user_id, db)
    return {
        "message": "Account deletion scheduled. Your data will be permanently removed within 30 days.",
        "deletion_scheduled_at": deletion_at.isoformat(),
    }
