# Feature Specification: AI Persona Chat

**Feature Branch**: `002-ai-persona-chat`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "AI Persona Chat: Users can tap on a story and chat with AI personas that represent different political perspectives (Left, Center, Right) about that story. Each persona is grounded in real source material via RAG, uses the steel-man principle to present the strongest version of its perspective, and clearly identifies itself as AI. Users can ask questions, challenge viewpoints, and explore how different perspectives think about the story. Persona responses must cite their source articles. The chat interface is accessible from the story detail screen."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chat with a Single Perspective Persona (Priority: P1)

Users tap on a story in the detail screen and select a political perspective (Left, Center, or Right) to start a conversation. An AI persona representing that perspective responds to user questions about the story, grounding every response in real source articles. The persona clearly identifies itself as an AI representation of that viewpoint.

**Why this priority**: This is the core interaction — a user engaging with one perspective at a time. Without this, no other chat features can exist. It delivers the primary value of understanding how a specific perspective thinks about a story.

**Independent Test**: Can be fully tested by selecting a story, choosing a perspective, and verifying that the persona responds with source-cited arguments that represent the strongest version of that viewpoint.

**Acceptance Scenarios**:

1. **Given** user is viewing a story detail screen, **When** user taps a "Chat" or "Explore Perspectives" button, **Then** user sees a perspective selector showing Left, Center, and Right options
2. **Given** user selects the "Left" perspective, **When** the chat screen loads, **Then** the persona introduces itself as an AI representation of left-leaning viewpoints on this story, citing which source articles ground its perspective
3. **Given** user asks "Why do you think this policy is important?", **When** the persona responds, **Then** the response presents the strongest left-leaning argument, cites at least one source article, and does not use manipulative or dismissive language
4. **Given** user challenges the persona's position, **When** the persona responds, **Then** it acknowledges the validity of the challenge, addresses it substantively, and maintains intellectual honesty about limitations of its own position

---

### User Story 2 - Switch Between Perspectives (Priority: P2)

Users can switch between Left, Center, and Right personas within the same chat session to compare how different perspectives view the same story, without losing their conversation history.

**Why this priority**: Comparing perspectives side-by-side is what differentiates MosaicAI from a simple chatbot. However, it builds on the single-persona chat (US1) and adds incremental value.

**Independent Test**: Can be tested by starting a chat with one persona, switching to another, and verifying both conversation threads are preserved and each persona maintains its distinct viewpoint.

**Acceptance Scenarios**:

1. **Given** user is chatting with the Left persona, **When** user taps the perspective switcher and selects "Right", **Then** the chat switches to the Right persona with its own conversation thread
2. **Given** user has chatted with both Left and Right personas, **When** user switches back to Left, **Then** the previous Left conversation is preserved and the user can continue where they left off
3. **Given** user asks the same question to both Left and Right personas, **When** viewing both responses, **Then** each persona provides a distinct, steel-manned argument from its perspective, grounded in different source articles

---

### User Story 3 - Source Citation and Verification (Priority: P2)

Users can see which source articles inform each persona response and tap on citations to read the original articles, enabling independent verification of the persona's claims.

**Why this priority**: Source transparency is a constitutional requirement (Principle III) and critical for user trust, but it enhances rather than enables the core chat experience.

**Independent Test**: Can be tested by chatting with a persona, tapping on an inline citation, and verifying it links to a real article that supports the persona's claim.

**Acceptance Scenarios**:

1. **Given** a persona responds to a user question, **When** the response contains factual claims, **Then** each claim includes an inline citation referencing a specific source article
2. **Given** user sees a citation in a persona response, **When** user taps on the citation, **Then** user can view the article title, source name, bias rating, and a link to the original article
3. **Given** a persona cannot find source material to support a particular claim, **When** the persona responds, **Then** it explicitly states that this point is its interpretation rather than a sourced fact

---

### User Story 4 - Chat History and Continuity (Priority: P3)

Users can return to previous conversations about stories they've explored, allowing them to revisit and continue learning about topics over time.

**Why this priority**: Persistence improves the learning experience but is not essential for the core interaction. Users can still get value from one-time conversations.

**Independent Test**: Can be tested by having a conversation, closing the app, reopening it, and verifying the previous conversation is accessible.

**Acceptance Scenarios**:

1. **Given** user has previously chatted about a story, **When** user returns to that story's detail screen and opens chat, **Then** the previous conversation history is displayed
2. **Given** user has chatted about multiple stories, **When** user views their chat history, **Then** they see a list of past conversations organized by story
3. **Given** a story's source articles have been updated since the last conversation, **When** user reopens the chat, **Then** the persona can reference new source material while maintaining awareness of the previous conversation context

---

### Edge Cases

- What happens when a story has no source articles from a particular perspective (e.g., no Right sources)?
- How does the persona handle questions that are off-topic or unrelated to the story?
- What happens when the user attempts to manipulate the persona into making inflammatory statements?
- How does the system handle very long conversations that exceed context limits?
- What happens when the source articles are paywalled or no longer accessible?
- How does the persona respond when asked about its own bias or limitations?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a clear entry point to persona chat from the story detail screen
- **FR-002**: System MUST offer three perspective options: Left, Center, and Right
- **FR-003**: Each persona MUST identify itself as an AI representation of a political perspective, not a real person
- **FR-004**: Each persona response MUST be grounded in source articles associated with the story using RAG (Retrieval-Augmented Generation)
- **FR-005**: Each persona MUST use the steel-man principle — presenting the strongest, most intellectually honest version of its assigned perspective
- **FR-006**: Persona responses MUST include inline citations referencing specific source articles
- **FR-007**: Users MUST be able to tap citations to view source article details and external links
- **FR-008**: System MUST maintain separate conversation threads per perspective per story
- **FR-009**: Users MUST be able to switch between perspectives without losing conversation history
- **FR-010**: Personas MUST refuse to engage with hate speech, slurs, or dehumanizing language, redirecting to substantive discussion. After 3 consecutive redirections for abusive content, the system MUST end the conversation with an explanation; the user can start a new conversation
- **FR-011**: Personas MUST NOT use manipulative, coercive, or ad hominem rhetoric
- **FR-012**: Personas MUST acknowledge valid concerns and limitations of their own position when challenged
- **FR-013**: System MUST persist conversation history locally for returning users, auto-expiring after 30 days of inactivity, with the ability for users to manually delete individual conversations at any time
- **FR-014**: System MUST handle unavailable perspectives by showing the perspective option as disabled/grayed out with a "No sources available" label (e.g., story with no Right-leaning sources)
- **FR-015**: Persona responses MUST stream token-by-token in real-time, with the first token appearing within 5 seconds of user sending a message
- **FR-016**: System MUST clearly distinguish between sourced claims and persona interpretation

### Assumptions

- **Persona generation**: AI personas are generated using a large language model with system prompts that enforce perspective, steel-manning, and citation requirements
- **RAG source material**: Persona responses are grounded in the source articles already associated with each story from the news feed ingestion pipeline
- **Conversation storage**: Chat history is stored locally on the device for MVP; server-side persistence can be added later. Conversations auto-expire after 30 days of inactivity and users can manually delete individual conversations. **[REVISIT LATER: Retention policy may need adjustment based on user feedback post-launch]**
- **Context management**: Long conversations are handled by summarizing earlier messages while retaining key context. A subtle inline indicator (e.g., "Earlier messages summarized") is shown when summarization occurs
- **Perspective mapping**: Source bias ratings (left, center-left, center, center-right, right) are mapped to three personas — Left sources inform the Left persona, Center/Center-left/Center-right inform the Center persona, and Right sources inform the Right persona
- **Off-topic handling**: Personas redirect off-topic questions back to the story and its implications rather than engaging with unrelated topics

### Key Entities

- **Conversation**: Represents a chat thread between a user and a specific persona about a specific story. Key attributes include story reference, perspective (Left/Center/Right), message history, creation timestamp.
- **Message**: Represents a single exchange in a conversation. Key attributes include sender (user or persona), content, citations, timestamp.
- **Citation**: Represents a reference from a persona response to a source article. Key attributes include article reference, quoted text or claim being supported, position in the response.
- **Persona**: Represents an AI character with a defined political perspective. Key attributes include perspective label, system prompt, behavioral constraints (steel-manning, source grounding, AI disclosure).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First token of persona response streams within 5 seconds of user sending a message
- **SC-002**: 100% of persona responses include at least one source citation when making factual claims
- **SC-003**: Personas correctly maintain their assigned perspective in 95%+ of responses (no perspective drift)
- **SC-004**: 90% of users can identify the persona as AI within the first message (clear AI disclosure)
- **SC-005**: Persona responses pass steel-man quality review — no straw-manning, caricatures, or bad-faith arguments in 95%+ of responses
- **SC-006**: Users can switch between all three perspectives in under 2 seconds
- **SC-007**: Chat history persists across app sessions with 100% reliability
- **SC-008**: System handles 100 concurrent chat sessions without degradation

## Clarifications

### Session 2026-03-04

- Q: What is the chat history retention policy? → A: Auto-expire after 30 days of inactivity, user can delete individual conversations anytime. **[REVISIT post-launch based on user feedback]**
- Q: Should the user be notified when conversation context is summarized? → A: Silent summarization with a subtle inline indicator (e.g., "Earlier messages summarized")
- Q: How should unavailable perspectives be handled? → A: Show perspective as disabled/grayed out with "No sources available" label
- Q: Should persona responses stream or appear all at once? → A: Stream token-by-token in real-time; 5-second SLA applies to first token
- Q: What happens after repeated abusive messages? → A: After 3 consecutive redirections, end conversation with explanation; user can start a new one

## Constitution Compliance

This feature aligns with the following constitutional principles:

- **Understanding Over Persuasion** (Principle I): Personas help users understand viewpoints without pushing any agenda; success is measured by comprehension, not opinion change
- **Steel-Manning Requirement** (Principle II): Every persona uses the steel-man principle, presenting the strongest version of its perspective
- **Source Grounding** (Principle III): RAG is mandatory; all claims are traced to source articles with clear attribution
- **Bias Transparency** (Principle IV): Users see which sources inform each persona and can verify claims independently
- **Moderation & Safety** (Principle VI): Personas refuse hate speech and redirect to substantive discussion; clear AI disclaimers on every chat screen
- **Avoiding False Personification** (AI Ethics): Personas do not use real politician names or identifiable figures; clear indicators they are AI constructs
