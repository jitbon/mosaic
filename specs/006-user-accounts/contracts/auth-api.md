# API Contract: Authentication & User Account Endpoints

**Feature**: 006-user-accounts
**Base path**: `/api/v1`
**Auth**: Bearer token (Supabase JWT) via `Authorization: Bearer <access_token>` header

---

## Authentication Roles

| Role | JWT `role` claim | Description |
|------|-----------------|-------------|
| Guest | `anon` | Anonymous Supabase user; limited access |
| Authenticated | `authenticated` | Registered user with full account |

Endpoints marked 🔒 require `role: authenticated`. Endpoints marked 👤 accept both roles. Endpoints marked 🌐 require no auth.

---

## Auth Endpoints

### POST `/auth/guest`
🌐 Initialize a guest session.

Calls `supabase.auth.signInAnonymously()` on the server side and returns the access token. The client uses this token for subsequent guest requests.

**Request**: No body.

**Response 200**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "role": "anon"
}
```

---

### POST `/auth/register`
🌐 Register a new email/password account.

Creates the Supabase Auth user and a corresponding `app_users` row. Triggers a verification email.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "display_name": "Jane Doe"
}
```

**Validation**:
- `email`: valid format, unique in `app_users`
- `password`: min 8 chars, ≥1 uppercase, ≥1 digit
- `display_name`: 1–100 chars

**Response 201**:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "email_verified": false
}
```

**Errors**:
- `409 Conflict` — email already exists: `{"code": "EMAIL_EXISTS"}`
- `422 Unprocessable Entity` — validation failure

**Rate limit**: 5/minute per IP (`slowapi`)

---

### POST `/auth/login`
🌐 Authenticate with email/password.

Proxies to Supabase `signInWithPassword`. Returns Supabase tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass1"
}
```

**Response 200**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "display_name": "Jane Doe",
    "email_verified": true
  }
}
```

**Errors**:
- `401 Unauthorized` — invalid credentials: `{"code": "INVALID_CREDENTIALS"}`
- `403 Forbidden` — email not verified: `{"code": "EMAIL_NOT_VERIFIED"}`

**Rate limit**: 5/minute per IP

---

### POST `/auth/logout`
🔒 Invalidate current session.

Revokes the refresh token via Supabase Admin API.

**Request**: No body.

**Response 204**: No content.

---

### POST `/auth/refresh`
🌐 Refresh access token.

**Request**:
```json
{
  "refresh_token": "..."
}
```

**Response 200**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

**Errors**:
- `401 Unauthorized` — invalid/expired/already-used refresh token

---

### POST `/auth/forgot-password`
🌐 Request a password reset email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response 200**: Always returns 200 (prevents email enumeration).
```json
{ "message": "If an account exists, a reset link has been sent." }
```

**Rate limit**: 3/hour per IP

---

### POST `/auth/resend-verification`
🌐 Resend verification email.

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response 200**: Always 200.

**Rate limit**: 3/hour per IP

---

### POST `/auth/migrate-anonymous`
🔒 Migrate anonymous (guest) conversations to the newly registered account.

Called immediately after a guest registers. Links all conversations and debates belonging to the anonymous `sub` to the new `user_id`.

**Request**:
```json
{
  "anonymous_user_id": "uuid"
}
```

**Response 200**:
```json
{
  "migrated_conversations": 3,
  "migrated_debates": 1
}
```

**Errors**:
- `404 Not Found` — anonymous session not found

---

## Profile Endpoints

### GET `/profile`
🔒 Get the current user's profile.

**Response 200**:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "email_verified": true,
  "preferences": {
    "default_perspective": "center",
    "notification_prefs": {}
  },
  "linked_providers": ["google"],
  "created_at": "2026-03-22T00:00:00Z",
  "last_login_at": "2026-03-22T10:00:00Z"
}
```

---

### PATCH `/profile`
🔒 Update display name and/or preferences.

**Request** (all fields optional):
```json
{
  "display_name": "Jane Smith",
  "preferences": {
    "default_perspective": "left",
    "notification_prefs": {}
  }
}
```

**Response 200**: Updated profile (same shape as GET `/profile`).

**Validation**:
- `display_name`: 1–100 chars if provided

---

### POST `/profile/change-password`
🔒 Change password (requires current password confirmation).

**Request**:
```json
{
  "current_password": "OldPass1",
  "new_password": "NewPass1"
}
```

**Response 204**: No content.

**Errors**:
- `401 Unauthorized` — current password incorrect: `{"code": "WRONG_PASSWORD"}`
- `422` — new password fails strength requirements

---

### POST `/profile/export`
🔒 Request a data export ZIP.

**Request**: No body.

**Response 200**: Streaming `application/zip` response with `Content-Disposition: attachment; filename=my-data.zip`.

ZIP contains:
- `profile.json`
- `conversations.json`
- `debates.json`

---

### DELETE `/profile`
🔒 Request account deletion.

Initiates the deletion pipeline: sets `account_status = 'pending_deletion'`, anonymizes debate turns, schedules hard delete after 30 days.

**Request**:
```json
{
  "confirm": true
}
```

**Response 200**:
```json
{
  "message": "Account deletion scheduled. Your data will be permanently removed within 30 days.",
  "deletion_scheduled_at": "2026-03-22T00:00:00Z"
}
```

**Errors**:
- `400 Bad Request` — `confirm` not `true`: `{"code": "CONFIRMATION_REQUIRED"}`

---

## Guest Limit Endpoint

### GET `/auth/guest/status`
👤 Get current guest session status (for guests only; returns null for authenticated users).

**Response 200**:
```json
{
  "is_guest": true,
  "conversation_count": 3,
  "conversation_limit": 5,
  "limit_reached": false
}
```

---

## Existing Endpoints — Behaviour Changes

### POST `/chat/conversations` (existing)
- **Authenticated users**: `user_id` is set from JWT `sub`; conversation is persisted
- **Guests** (`role: anon`): `guest_sessions.conversation_count` is incremented; if count ≥ 5, returns:
  ```json
  HTTP 403
  {"code": "GUEST_LIMIT_REACHED", "message": "Sign up to continue chatting."}
  ```
- **No token**: Returns `401 Unauthorized`

### GET `/chat/conversations` (existing)
- **Authenticated**: Returns only conversations where `user_id` matches the requester
- **Guests**: Returns only conversations created within the current anonymous session (by matching `user_id` = anon `sub`)

### POST `/debate/debates` (existing)
- **Authenticated only**: Guests receive `403 GUEST_DEBATES_RESTRICTED`

---

## Error Response Shape

All errors follow:
```json
{
  "code": "SNAKE_CASE_ERROR_CODE",
  "message": "Human-readable description"
}
```

Standard HTTP status codes:
- `400` — bad request / validation failure
- `401` — missing or invalid token
- `403` — authenticated but insufficient permission (or guest limit)
- `404` — resource not found
- `409` — conflict (e.g., email already exists)
- `422` — Pydantic validation error
- `429` — rate limit exceeded
