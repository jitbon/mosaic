# Feature Specification: User Accounts & Authentication

**Feature Branch**: `006-user-accounts`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Add user accounts and for this to scale on AWS, connecting to S3 storage and having this hosted on something/somewhere. I would like to learn about implementing cloud technologies/deploying this as a web app and on the app store eventually"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Registration & Login (Priority: P1)

A new visitor arrives at the Mosaic app and wants to create an account so their conversations and debate history are saved across sessions and devices. They register with an email address and password, verify their email, and log in. On subsequent visits they log in and see their previous conversations and debates intact.

**Why this priority**: Without user accounts, nothing else works — conversations are anonymous and ephemeral. This is the foundation for all personalization, data ownership, and multi-device access.

**Independent Test**: Can be fully tested by registering a new account, logging in, starting a conversation, logging out, logging back in, and verifying the conversation history persists.

**Acceptance Scenarios**:

1. **Given** the app homepage, **When** a visitor clicks "Sign Up" and provides a valid email and password, **Then** they receive a verification email and can activate their account
2. **Given** an activated account, **When** the user enters correct credentials on the login page, **Then** they are authenticated and redirected to their personalized feed
3. **Given** a logged-in user, **When** they start a chat conversation, **Then** the conversation is linked to their account and appears in their history on any device
4. **Given** a logged-in user, **When** they click "Log Out", **Then** their session ends and protected pages redirect to login

---

### User Story 2 - User Profile & Preferences (Priority: P2)

A registered user wants to manage their profile information and reading preferences. They can set a display name, choose default news perspectives, and manage their account settings (change password, delete account).

**Why this priority**: Profiles enable personalization and give users ownership of their identity within the app. This builds on the account foundation from US1.

**Independent Test**: Can be tested by logging in, navigating to profile settings, updating display name and preferences, refreshing the page, and verifying changes persist.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they navigate to their profile page, **Then** they see their email, display name, and current preferences
2. **Given** the profile page, **When** the user updates their display name and saves, **Then** the new name appears across the app immediately
3. **Given** the profile page, **When** the user changes their password with correct current password, **Then** the password is updated and they remain logged in
4. **Given** the profile page, **When** the user requests account deletion and confirms, **Then** their private data (chat conversations, profile) is permanently deleted within 30 days and their debate contributions are anonymized to "Deleted User"
5. **Given** the profile page, **When** the user clicks "Export My Data", **Then** the system generates a downloadable file containing their profile, conversations, and debates, available within 24 hours

---

### User Story 3 - Social Login (Priority: P3)

A visitor prefers not to create yet another email/password combination and wants to sign up or log in using their existing Google, Apple, or Facebook account. The flow is seamless — one click, automatic account creation if new, and immediate access. Additionally, visitors who don't want to create any account at all can use a "Guest" mode that provides limited functionality with unsaved (ephemeral) data.

**Why this priority**: Social login reduces friction and increases sign-up conversion rates. Guest mode lowers the barrier to entry further by letting users try the app before committing. Depends on the core auth system from US1 being in place first.

**Independent Test**: Can be tested by clicking "Sign in with Google" on the login page, completing the OAuth flow, and verifying the account is created and the user is logged in. Guest mode can be tested by clicking "Continue as Guest" and verifying limited access with no data persistence.

**Acceptance Scenarios**:

1. **Given** the login page, **When** a new visitor clicks "Sign in with Google", **Then** they complete the OAuth flow and an account is automatically created with their Google profile info
2. **Given** an existing account linked to Google, **When** the user clicks "Sign in with Google", **Then** they are logged in to their existing account
3. **Given** an existing email/password account, **When** the user tries to sign in with a social provider using the same email, **Then** the accounts are linked and both login methods work going forward
4. **Given** the login page, **When** a visitor clicks "Sign in with Apple", **Then** they complete the Apple OAuth flow and an account is created (Apple may provide a private relay email)
5. **Given** the login page, **When** a visitor clicks "Sign in with Facebook", **Then** they complete the Facebook OAuth flow and an account is created with their Facebook profile info
6. **Given** the login page, **When** a visitor clicks "Continue as Guest", **Then** they can browse the news feed, read stories, and start up to 5 chat conversations per session (ephemeral, not saved); debates require an account
7. **Given** a guest with 5 active chat conversations, **When** they try to start a 6th, **Then** they see a prompt to create an account with a message like "You've reached the guest chat limit. Sign up to continue and save your conversations."

---

### User Story 4 - Ownership of Existing Anonymous Data (Priority: P4)

A user who has been using Mosaic anonymously creates an account and wants their existing conversation and debate history (from the current browser session) to be migrated to their new account so they don't lose their work.

**Why this priority**: This is a migration/transition story that only matters during the rollout period. Important for user retention but not blocking for launch.

**Independent Test**: Can be tested by starting anonymous conversations, registering a new account in the same browser, and verifying the conversations appear in the new account's history.

**Acceptance Scenarios**:

1. **Given** an anonymous user with 3 existing conversations, **When** they register a new account in the same browser session, **Then** all 3 conversations are linked to the new account
2. **Given** an anonymous user who registers, **When** they view their conversation history, **Then** both pre-registration and post-registration conversations appear together

---

### Edge Cases

- What happens when a user tries to register with an email that already exists? → Clear error message: "An account with this email already exists. Try logging in or resetting your password."
- What happens when a user forgets their password? → "Forgot password" flow sends a time-limited reset link via email.
- What happens when a verification email expires? → User can request a new verification email from the login page.
- What happens when a user's session token expires during active use? → Silent token refresh; if refresh fails, redirect to login with a message.
- What happens when a social login provider is temporarily unavailable? → Show error with option to use email/password login instead.
- How does the system handle concurrent sessions on multiple devices? → All sessions remain valid; logging out on one device does not affect others.
- What happens if a user deletes their account and tries to re-register with the same email? → Allowed after the 30-day deletion grace period completes.
- What happens to a deleted user's debate contributions? → Debate turns are preserved but attributed to "Deleted User" to maintain debate coherence for other participants.
- What happens when a guest user tries to access saved history or profile features? → Prompt to create an account or sign in, with a clear message explaining that guest data is not saved.
- What happens when a guest reaches the 5-conversation limit? → Show a sign-up prompt: "You've reached the guest chat limit. Sign up to continue and save your conversations."
- Can guests start debates? → No. Debates require a registered account. Guests who click "Start Debate" see a sign-up prompt.
- What happens when Apple Sign-In provides a private relay email? → System uses the relay email as the user's email; if user later signs up with their real email, they can link accounts from profile settings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to register a new account using an email address and password
- **FR-002**: System MUST validate email addresses (format check and uniqueness) and enforce password strength requirements (minimum 8 characters, at least one uppercase letter and one number)
- **FR-003**: System MUST send a verification email upon registration; accounts are inactive until verified
- **FR-004**: System MUST authenticate users via email/password credentials and issue session tokens
- **FR-005**: System MUST support session token refresh so users are not logged out during active use
- **FR-006**: System MUST provide a "forgot password" flow that sends a time-limited password reset link via email
- **FR-007**: System MUST link all new conversations and debates to the authenticated user's account
- **FR-008**: System MUST allow users to view and update their profile (display name, preferences)
- **FR-009**: System MUST allow users to change their password (requiring current password confirmation)
- **FR-010**: System MUST allow users to request account deletion; private data (chat conversations, profile) is permanently deleted within 30 days, while shared content (debate contributions) is anonymized to "Deleted User" to preserve debate integrity for other participants
- **FR-010a**: System MUST allow users to request a downloadable export of their personal data (profile, conversations, debates) in a standard portable format; export MUST be available within 24 hours of request
- **FR-011**: System MUST support social login via Google, Apple, and Facebook OAuth providers
- **FR-011a**: System MUST support a "Guest" mode allowing visitors to browse public content (news feed, stories) and start up to 5 chat conversations per session (ephemeral, not saved); debates require a registered account; guest chat limit is enforced per browser session
- **FR-011b**: System MUST prompt guests who reach the 5-conversation limit to create an account, displaying a clear call-to-action
- **FR-012**: System MUST link social login accounts to existing accounts when the email matches
- **FR-013**: System MUST migrate anonymous conversation/debate history to a newly created account from the same browser session
- **FR-014**: System MUST protect all user-specific endpoints (profile, conversation history, preferences) behind authentication
- **FR-015**: System MUST allow unauthenticated access to the news feed and story detail pages (read-only public content)
- **FR-016**: System MUST rate-limit authentication endpoints (login, registration, password reset) to prevent abuse

### Key Entities

- **User**: Represents a registered person. Key attributes: unique email, display name, hashed password, email verification status, account status (active/pending/deleted), creation date, last login date
- **UserPreference**: User's personalization settings. Key attributes: default perspective, notification preferences, linked to one User
- **UserSession**: An active authentication session. Key attributes: token identifier, user reference, device info, expiration time, refresh capability
- **SocialAccount**: A linked OAuth provider account. Key attributes: provider name (Google, Apple, Facebook), provider user ID, linked to one User, creation date
- **GuestSession**: A temporary session for unauthenticated visitors. Key attributes: session identifier, creation time, expiration time, chat conversation count (max 5); no persisted data or user record

## Clarifications

### Session 2026-03-22

- Q: Can guests start chat conversations and debates, or only browse the feed? → A: Guests can start up to 5 chat conversations per session (ephemeral); debates require a registered account. At the limit, a sign-up prompt is shown.
- Q: Should users be able to export or download their personal data? → A: Yes. Users can request a data export (profile, conversations, debates) as a downloadable file, available within 24 hours.
- Q: What should happen to a user's data when they delete their account? → A: Private data (chat conversations, profile) is permanently deleted. Shared content (debate contributions) is anonymized to "Deleted User" to preserve debate integrity.

## Assumptions

- Email delivery service will be available for verification and password reset emails (specific provider to be decided during planning)
- Password hashing will use industry-standard algorithms (specific choice deferred to planning)
- Session tokens will use a standard mechanism (specific choice deferred to planning)
- The existing conversation and debate models will be extended with an optional user foreign key (nullable for backward compatibility during migration)
- Public content (news feed, stories) remains accessible without login
- Admin endpoints (from 005-token-efficiency) will require a separate admin role — not part of this feature's scope
- Mobile app authentication will be addressed in the cloud deployment feature (007), not this one — this feature focuses on the web frontend

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users can complete account registration (from clicking "Sign Up" to verified and logged in) in under 3 minutes, excluding email delivery time
- **SC-002**: 95% of login attempts with correct credentials complete in under 2 seconds
- **SC-003**: Users can access their conversation history from a different device/browser after logging in, with 100% of their data visible
- **SC-004**: Session token refresh happens transparently — users are never unexpectedly logged out during a session lasting up to 7 days of active use
- **SC-005**: Password reset flow completes successfully (from "forgot password" click to logging in with new password) in under 5 minutes, excluding email delivery time
- **SC-006**: Social login (when available) completes account creation or login in under 10 seconds from button click
- **SC-007**: Anonymous-to-registered data migration preserves 100% of existing conversations and debates from the current browser session
k
