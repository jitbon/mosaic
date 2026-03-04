# Feature Specification: Web Frontend

**Feature Branch**: `004-web-frontend`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "now that we have the backend, create a front-end for the user to be able to switch between windows, probably with a navigation pane with buttons at the bottom. The home screen I think would just be the list of news topics for now"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse News Feed (Priority: P1)

A user visits the Mosaic web app and sees a list of current news topics (stories) on the home screen. Each story shows its headline, summary, publication time, and a visual indicator of how the story is covered across left, center, and right perspectives. The user can scroll through the list and load more stories. Filter buttons allow narrowing the feed to "All", "Blindspot" (stories with skewed coverage), or "Balanced" stories.

**Why this priority**: The news feed is the core entry point — without it, no other feature has context. It delivers immediate value by surfacing multi-perspective news.

**Independent Test**: Can be fully tested by loading the home screen, verifying stories appear with headlines/summaries/bias indicators, and confirming filters change the displayed stories.

**Acceptance Scenarios**:

1. **Given** the user opens the web app, **When** the page loads, **Then** a paginated list of news stories is displayed with headline, summary, time ago, and bias bar for each story.
2. **Given** the user is on the feed, **When** they select the "Blindspot" filter, **Then** only stories flagged as blindspot are shown.
3. **Given** the user scrolls to the bottom of the feed, **When** more stories are available, **Then** additional stories load automatically (infinite scroll).
4. **Given** the feed has no stories, **When** the page loads, **Then** a friendly empty state message is displayed.

---

### User Story 2 - View Story Details & Sources (Priority: P1)

A user taps on a story from the feed to see its full details. The detail view shows the headline, summary, and a list of source articles grouped by perspective (left, center, right). Each source shows the outlet name, article title, a snippet, and a link to the original article. The user can see at a glance how different outlets are covering the same topic.

**Why this priority**: Story details with source breakdown is the core value proposition — showing users how the same topic is framed differently across the political spectrum.

**Independent Test**: Can be tested by clicking a story, verifying all source articles appear with correct bias labels, and confirming external links work.

**Acceptance Scenarios**:

1. **Given** the user taps a story, **When** the story detail screen loads, **Then** the headline, summary, and source articles are displayed grouped by bias.
2. **Given** a story has articles from multiple perspectives, **When** viewing details, **Then** articles are grouped under "Left", "Center", "Right" sections with source names and bias indicators.
3. **Given** the user taps an article link, **When** the link is activated, **Then** the original article opens in a new tab.

---

### User Story 3 - Navigate Between Sections (Priority: P1)

The app has a persistent bottom navigation bar with clearly labeled buttons that allow the user to switch between the main sections: Feed (home), Chat History, and Debate History. The currently active section is visually highlighted. Navigation is instant with no full-page reloads.

**Why this priority**: Navigation is foundational — users need to move between features. Without it the app is a single page.

**Independent Test**: Can be tested by clicking each navigation button and verifying the correct section loads while the active indicator updates.

**Acceptance Scenarios**:

1. **Given** the user is on any screen, **When** they look at the bottom of the page, **Then** a navigation bar is visible with labeled buttons for Feed, Chats, and Debates.
2. **Given** the user taps "Chats" in the nav bar, **When** the transition completes, **Then** the Chat History section is displayed and the "Chats" button is highlighted.
3. **Given** the user is viewing a story detail, **When** they tap "Feed" in the nav bar, **Then** they return to the news feed at their previous scroll position.

---

### User Story 4 - Chat with AI Perspectives (Priority: P2)

From a story detail page, the user can start a conversation with an AI persona representing a left, center, or right perspective. The user selects a perspective tab, types a question, and receives a streaming response with citations from source articles. Previous conversations are accessible from the Chat History section.

**Why this priority**: Chat is a key differentiator but depends on feed and story details being functional first.

**Independent Test**: Can be tested by selecting a story, choosing a perspective, sending a message, and verifying a streaming response with citations appears.

**Acceptance Scenarios**:

1. **Given** the user is viewing a story, **When** they tap "Explore Perspectives", **Then** a chat interface opens with perspective tabs (Left, Center, Right).
2. **Given** a perspective is selected, **When** the user types and sends a message, **Then** the AI response streams in real-time with citations linking to source articles.
3. **Given** the user switches perspectives, **When** the new tab is selected, **Then** a fresh conversation starts (or existing one loads) for that perspective.
4. **Given** the user navigates to Chat History, **When** the list loads, **Then** previous conversations are listed with story headline, perspective, and last message preview.

---

### User Story 5 - Watch AI Debates (Priority: P2)

From a story detail page, the user can start a debate between 2-3 AI personas representing different perspectives. The debate progresses in rounds, with each persona making arguments supported by citations. The user can act as moderator by interjecting with questions or prompts. Previous debates are accessible from the Debate History section.

**Why this priority**: Debates build on chat infrastructure and provide a unique multi-perspective experience, but require stories and navigation to be in place.

**Independent Test**: Can be tested by starting a debate, watching a round stream, submitting a moderator interjection, and verifying debate history.

**Acceptance Scenarios**:

1. **Given** the user is viewing a story, **When** they tap "Start Debate", **Then** a persona selector appears letting them choose 2-3 perspectives.
2. **Given** personas are selected, **When** the debate starts, **Then** each persona's argument streams in sequence with citations and role labels.
3. **Given** a round completes, **When** the user taps "Next Round", **Then** a new round of arguments streams in.
4. **Given** a debate is in progress, **When** the user types a moderator message, **Then** it appears as a moderator turn and influences subsequent responses.
5. **Given** the user navigates to Debate History, **When** the list loads, **Then** previous debates are listed with story headline, personas, status, and round count.

---

### Edge Cases

- What happens when the backend is unreachable? Show a connection error banner with a retry option.
- What happens when a story has no articles for a selected perspective? The perspective tab is grayed out and disabled with a tooltip explaining no sources are available.
- What happens when the user sends a message while a response is still streaming? The send button is disabled during streaming.
- What happens on a slow connection during debate streaming? A loading indicator shows which persona is "thinking" and partial text appears as it arrives.
- What happens when the user resizes the browser window? The layout adapts responsively — the bottom nav remains fixed, content reflows appropriately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST serve a web interface at the root URL (`/`) of the backend server.
- **FR-002**: The app MUST display a bottom navigation bar with labeled buttons for Feed, Chats, and Debates sections.
- **FR-003**: Navigation between sections MUST be client-side without full page reloads.
- **FR-004**: The Feed screen MUST display a paginated list of stories fetched from the backend feed endpoint.
- **FR-005**: Each story in the feed MUST show headline, summary, time since publication, and a bias distribution bar.
- **FR-006**: The Feed MUST support filtering by All, Blindspot, and Balanced categories.
- **FR-007**: The Feed MUST support infinite scroll loading of additional stories.
- **FR-008**: Tapping a story MUST navigate to a detail view showing full story information and source articles.
- **FR-009**: Source articles MUST be grouped by bias perspective (left, center, right) with outlet name and link.
- **FR-010**: The Chat interface MUST support selecting a perspective and streaming AI responses via Server-Sent Events.
- **FR-011**: Chat messages MUST display citations linking to source articles.
- **FR-012**: The Debate interface MUST support selecting 2-3 personas and streaming multi-turn debates.
- **FR-013**: The Debate interface MUST allow moderator interjections.
- **FR-014**: Chat History and Debate History sections MUST list previous conversations/debates fetched from the backend API, with navigation to resume or review them. No browser-local storage is used for history.
- **FR-015**: The app MUST use the Mosaic logo and the established soft color theme (warm cream backgrounds, soft blue/mauve/terracotta/teal accents).
- **FR-016**: The app MUST be responsive, functioning on desktop and mobile browser widths.

### Key Entities

- **Story**: A clustered news topic with headline, summary, publication time, bias counts, and blindspot flag. The central unit users browse and interact with.
- **Article**: An individual news piece from a source, belonging to a story. Has title, URL, snippet, and bias label.
- **Source**: A news outlet with a name, domain, and bias rating (left/center/right).
- **Conversation**: A chat session tied to a story and perspective, containing messages between the user and an AI persona.
- **Debate**: A multi-persona discussion tied to a story, progressing in rounds of turns with optional moderator interjections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can load the news feed and see stories within 2 seconds of opening the app.
- **SC-002**: Users can navigate between Feed, Chat History, and Debate History in under 300ms (no perceptible delay).
- **SC-003**: Users can view a story's source articles grouped by perspective within 1 tap from the feed.
- **SC-004**: AI chat responses begin streaming within 2 seconds of sending a message.
- **SC-005**: The web app is usable on screens from 375px (mobile) to 1440px+ (desktop) width.
- **SC-006**: All existing backend API endpoints are consumed by the web frontend with no new backend changes required.
- **SC-007**: Users can complete the full flow (browse feed, view story, start chat or debate) without encountering dead ends or broken navigation.

## Clarifications

### Session 2026-03-04

- Q: Should chat/debate history come from backend API, browser local storage, or both? → A: Backend API only — history fetched from server endpoints.

## Assumptions

- The web frontend will be served from the same backend server, eliminating CORS concerns.
- The existing backend API is stable and requires no modifications for this feature.
- The Mosaic theme colors defined in the mobile app will be reused in the web frontend for visual consistency.
- Authentication is not required — the app is open access for now.
- The bottom navigation pattern mirrors the existing mobile app's tab structure for design consistency.
