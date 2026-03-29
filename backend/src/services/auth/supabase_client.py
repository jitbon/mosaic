"""Supabase Admin client (service_role key).

NEVER import this module in frontend code or expose the service_role key to the browser.
Used for admin operations: delete_user, signInAnonymously server-side, etc.
"""

import httpx

from src.core.config import settings

SUPABASE_URL = settings.supabase_url
_SERVICE_ROLE_KEY = settings.supabase_service_role_key


def _admin_headers() -> dict:
    return {
        "apikey": _SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def sign_in_anonymously() -> dict:
    """Create a Supabase anonymous session server-side. Returns the session dict."""
    url = f"{SUPABASE_URL}/auth/v1/signup"
    resp = httpx.post(url, json={}, headers=_admin_headers(), timeout=10)
    resp.raise_for_status()
    return resp.json()


def sign_in_with_password(email: str, password: str) -> dict:
    """Proxy email/password sign-in to Supabase Auth."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    resp = httpx.post(
        url,
        json={"email": email, "password": password},
        headers=_admin_headers(),
        timeout=10,
    )
    return resp


def sign_up(email: str, password: str) -> dict:
    """Create a new Supabase Auth user."""
    url = f"{SUPABASE_URL}/auth/v1/signup"
    resp = httpx.post(
        url,
        json={"email": email, "password": password},
        headers=_admin_headers(),
        timeout=10,
    )
    return resp


def delete_auth_user(user_id: str) -> None:
    """Hard-delete a user from Supabase Auth (admin operation)."""
    url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
    resp = httpx.delete(url, headers=_admin_headers(), timeout=10)
    resp.raise_for_status()


def refresh_token(refresh_token: str) -> dict:
    """Exchange a refresh token for a new access token."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    resp = httpx.post(
        url, json={"refresh_token": refresh_token}, headers=_admin_headers(), timeout=10
    )
    return resp


def send_password_reset(email: str, redirect_to: str) -> None:
    """Send a password reset email via Supabase Auth."""
    url = f"{SUPABASE_URL}/auth/v1/recover"
    httpx.post(
        url,
        json={"email": email, "gotrue_meta_security": {}},
        headers={
            "apikey": _SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
        timeout=10,
    )


def resend_verification(email: str) -> None:
    """Resend email verification via Supabase Auth."""
    url = f"{SUPABASE_URL}/auth/v1/resend"
    httpx.post(
        url,
        json={"type": "signup", "email": email},
        headers={
            "apikey": _SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
        timeout=10,
    )


def revoke_session(jwt_token: str) -> None:
    """Revoke the current session (logout)."""
    url = f"{SUPABASE_URL}/auth/v1/logout"
    httpx.post(
        url,
        headers={
            "apikey": _SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {jwt_token}",
        },
        timeout=10,
    )
