"""JWT verification dependencies for FastAPI.

Verifies Supabase-issued JWTs using the SUPABASE_JWT_SECRET.
Provides:
  - get_current_user: requires a valid authenticated JWT (role == "authenticated")
  - get_optional_user: accepts authenticated or anon tokens; returns None if missing
  - require_authenticated: alias for get_current_user, for explicitness in route deps
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.core.config import settings

_bearer = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": str(exc)},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """Require a valid authenticated JWT. Returns the decoded payload dict."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "MISSING_TOKEN",
                "message": "Authorization header required",
            },
        )
    payload = _decode_token(credentials.credentials)
    if payload.get("role") != "authenticated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "INSUFFICIENT_ROLE",
                "message": "Authenticated account required",
            },
        )
    return payload


require_authenticated = get_current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict]:
    """Accept authenticated or anon JWTs; return None if no token is provided."""
    if credentials is None:
        return None
    return _decode_token(credentials.credentials)
