# Feature Specification: Multi-Persona Debate Mode

**Feature Branch**: `003-debate-mode`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "A multi-persona debate feature where users can watch AI personas with different political/ideological viewpoints debate a news topic in real-time. Users select a news story from their feed, choose 2-3 personas to participate, and observe a structured debate. Personas argue their positions using steel-manned arguments grounded in real sources (RAG). The user can moderate by asking follow-up questions, requesting clarification, or steering the topic. Debates are stored locally for later review. Builds on top of the existing persona chat (002) and news feed (001) infrastructure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch a Two-Persona Debate on a Story (Priority: P1)

Users tap on a news story and launch a debate between two AI personas representing different political perspectives. The personas take turns presenting their positions on the story, each grounding arguments in real source articles. The user observes the exchange as it unfolds in real-time, seeing how two perspectives engage with the same topic.

**Why this priority**: This is the core experience — watching two perspectives argue a topic in a structured format. Without this, there is no debate feature. It delivers the primary value of seeing how different viewpoints interact with and respond to each other, which goes beyond the single-persona chat.

**Independent Test**: Can be fully tested by selecting a story, choosing two perspectives (e.g., Left and Right), and verifying that the personas take turns making source-cited, steel-manned arguments that directly respond to each other's points.

**Acceptance Scenarios**:

1. **Given** user is viewing a story detail screen, **When** user taps "Start Debate", **Then** user sees a persona selector allowing them to choose 2 or 3 perspectives (Left, Center, Right)
2. **Given** user selects Left and Right personas, **When** the debate begins, **Then** the first persona introduces its position on the story with source citations, followed by the second persona presenting its counter-position
3. **Given** a debate is in progress, **When** a persona responds, **Then** it directly addresses points raised by the other persona(s) rather than arguing in isolation
4. **Given** a debate is in progress, **When** either persona makes a factual claim, **Then** the claim includes an inline citation to a source article
5. **Given** a debate is in progress, **When** the user views the debate, **Then** each persona is visually distinct (labeled with perspective name) and clearly identified as AI
6. **Given** a persona finishes streaming its turn, **When** the turn completes, **Then** the full response collapses into a short summary with the persona label, and the next persona automatically begins its turn
7. **Given** a completed turn is displayed as a summary, **When** the user taps/presses on it, **Then** the full response expands inline as a dropdown showing the complete text with citations

---

### User Story 2 - Moderate and Steer the Debate (Priority: P2)

Users can actively participate as moderators during the debate — asking follow-up questions, requesting clarification on a specific point, challenging a persona's argument, or steering the debate toward a particular subtopic. The personas respond to the moderator's input before continuing the debate.

**Why this priority**: Moderation transforms the experience from passive observation to active learning. It builds on the core debate (US1) and adds significant depth, but the debate is still valuable without it.

**Independent Test**: Can be tested by starting a debate, interjecting with a question directed at one or both personas, and verifying that the personas address the moderator's input before continuing the exchange.

**Acceptance Scenarios**:

1. **Given** a debate is in progress, **When** user types a message, **Then** the next persona turn incorporates and responds to the user's input
2. **Given** user asks "Can you elaborate on that economic argument?", **When** the targeted persona responds, **Then** it provides a deeper explanation with additional source citations before the debate continues
3. **Given** user asks a question directed at both personas (e.g., "What do you both think about the impact on small businesses?"), **When** the debate continues, **Then** both personas address the question in their next turns
4. **Given** user steers the debate toward a subtopic, **When** personas respond, **Then** they pivot to the new subtopic while maintaining their established positions and perspective consistency

---

### User Story 3 - Three-Way Debate with Center Persona (Priority: P2)

Users can include a Center persona in the debate alongside Left and Right, creating a three-way exchange that includes moderate and nuanced positions alongside the more polarized viewpoints.

**Why this priority**: The Center perspective adds nuance and prevents the debate from becoming a binary argument. It's an important part of the MosaicAI mission but is incremental on top of the two-persona debate.

**Independent Test**: Can be tested by selecting all three perspectives, starting a debate, and verifying that the Center persona contributes distinct arguments that don't simply split the difference between Left and Right.

**Acceptance Scenarios**:

1. **Given** user selects Left, Center, and Right personas, **When** the debate begins, **Then** all three personas take turns in a structured rotation
2. **Given** a three-way debate is in progress, **When** the Center persona responds, **Then** it presents an independent position grounded in centrist sources rather than simply mediating between Left and Right
3. **Given** a three-way debate is in progress, **When** any persona responds, **Then** it may address points from either or both of the other personas

---

### User Story 4 - Review and Resume Past Debates (Priority: P3)

Users can browse their debate history, re-read past debates, and resume a debate where they left off. Debates are stored locally and organized by story.

**Why this priority**: Persistence enhances the learning experience by allowing reflection and comparison over time, but the core debate value is delivered in a single session.

**Independent Test**: Can be tested by completing a debate, navigating away, returning to the debate history, and verifying the full debate transcript is accessible and the debate can be resumed.

**Acceptance Scenarios**:

1. **Given** user has completed or paused a debate, **When** user views their debate history, **Then** they see a list of past debates organized by story with date, personas involved, and a preview of the topic
2. **Given** user opens a past debate, **When** the debate transcript loads, **Then** the full exchange is displayed with all persona labels, source citations, and moderator interjections preserved
3. **Given** user chooses to resume a past debate, **When** the debate restarts, **Then** personas have context of the previous exchange and continue from where it left off

---

### Edge Cases

- What happens when a story has sources from only one perspective (e.g., only Left sources)? Personas without source material should be disabled for that story with a clear explanation
- How does the system handle a persona being asked to argue a point that contradicts its own perspective? Personas maintain their assigned perspective and acknowledge the opposing point while explaining their disagreement
- What happens when one persona's source articles directly contradict another persona's sources? Personas cite their respective sources and acknowledge the factual disagreement transparently
- How does the system manage turn-taking when the user moderates frequently? User interjections insert into the rotation; the next persona in sequence responds, then the rotation continues
- What happens when the debate reaches a natural conclusion or personas run out of new arguments? The system suggests closing the debate or exploring a related subtopic; personas do not repeat arguments
- How does the system handle very long debates that exceed context limits? Earlier debate turns are summarized while preserving key arguments and citations, with a subtle indicator shown to the user

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Start Debate" entry point from the story detail screen
- **FR-002**: System MUST allow users to select 2 or 3 personas from available perspectives (Left, Center, Right) before starting a debate
- **FR-003**: System MUST disable persona selection for perspectives that have no source articles for the selected story
- **FR-004**: Each persona MUST clearly identify itself as an AI representation of a political perspective on every turn
- **FR-005**: Personas MUST take turns in a structured rotation with auto-advance — each persona automatically begins its turn after the previous persona finishes streaming, with no manual trigger required
- **FR-006**: Every persona response MUST be grounded in source articles via RAG, with inline citations for factual claims
- **FR-007**: Every persona MUST use the steel-man principle — presenting the strongest, most intellectually honest version of its assigned perspective
- **FR-008**: Users MUST be able to interject during the debate to ask questions, request clarification, or steer the topic
- **FR-009**: Personas MUST incorporate user interjections into their next response before continuing the debate flow
- **FR-010**: System MUST visually distinguish between personas (perspective labels, distinct styling) and user interjections
- **FR-011**: Personas MUST NOT use manipulative, coercive, ad hominem, or dismissive rhetoric toward each other or the user
- **FR-012**: Personas MUST acknowledge valid points made by opposing personas rather than ignoring or straw-manning them
- **FR-013**: Personas MUST refuse to engage with hate speech or dehumanizing language from the user, redirecting to substantive discussion
- **FR-014**: Persona responses MUST stream token-by-token in real-time during their turn
- **FR-015**: System MUST persist debate history locally, auto-expiring after 30 days of inactivity, with the ability for users to manually delete individual debates
- **FR-016**: System MUST allow users to resume a past debate with full context of the previous exchange
- **FR-017**: System MUST clearly distinguish between sourced claims and persona interpretation in debate responses
- **FR-018**: System MUST handle context length limits by summarizing earlier turns while preserving key arguments and citations
- **FR-019**: Once a persona's turn finishes streaming, the system MUST collapse the full response into a concise summary (1-2 sentences) showing the persona label and key point
- **FR-020**: Users MUST be able to expand any collapsed turn summary by tapping/pressing on it to reveal the full response text with citations inline

### Assumptions

- **Debate orchestration**: The system manages turn-taking by sending each persona's response as context to the next persona, creating a coherent back-and-forth exchange
- **Source material**: Debates are grounded in the same source articles already associated with each story from the news feed ingestion pipeline (feature 001)
- **Persona infrastructure**: Debate personas reuse the same persona generation and RAG infrastructure from the single-persona chat (feature 002), extended with multi-turn debate context
- **Turn length**: Each persona turn is roughly equivalent in length (2-4 paragraphs) to maintain balanced airtime; the system enforces this via prompt engineering
- **Debate storage**: Debates are stored locally on-device following the same pattern as chat history in feature 002. Auto-expire after 30 days of inactivity
- **Debate length**: A typical debate runs 4-8 rounds (each persona speaks once per round). The system suggests winding down after 8 rounds but allows the user to continue

### Key Entities

- **Debate**: Represents a structured multi-persona exchange about a specific story. Key attributes include story reference, participating personas (2-3), turn history, creation timestamp, status (active/completed/paused)
- **Debate Turn**: Represents a single persona's contribution in the debate. Key attributes include persona perspective, content, summary (1-2 sentence condensed version for collapsed view), citations, turn number, references to previous turns being addressed
- **Moderator Interjection**: Represents a user's input during the debate. Key attributes include content, timestamp, position in the turn sequence, whether directed at a specific persona or all
- **Debate Summary**: Represents a condensed version of earlier debate turns used for context management. Key attributes include key arguments preserved, citations retained, original turn range covered

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First token of each persona turn streams within 5 seconds of the previous turn completing
- **SC-002**: 100% of persona debate turns include at least one source citation when making factual claims
- **SC-003**: 95%+ of persona turns directly reference or respond to points made by the opposing persona(s) rather than arguing in isolation
- **SC-004**: Personas maintain their assigned perspective without drift in 95%+ of debate turns
- **SC-005**: 90% of users can identify all personas as AI within the first round of debate
- **SC-006**: User moderator interjections are addressed by the next persona within their immediate response 95%+ of the time
- **SC-007**: Debate history persists across app sessions with 100% reliability
- **SC-008**: System handles 50 concurrent active debates without degradation

## Clarifications

### Session 2026-03-04

- Q: Should debate turns auto-advance or require manual trigger? → A: Auto-advance — each persona automatically begins after the previous turn finishes. Completed turns collapse into a short summary (1-2 sentences) with the persona label; users can tap/press to expand the full response with citations as a dropdown. This keeps the debate flowing while preventing scroll fatigue from long text blocks.

## Constitution Compliance

This feature aligns with the following constitutional principles:

- **Understanding Over Persuasion** (Principle I): Debates help users understand how different perspectives engage with each other; success is measured by comprehension of multiple viewpoints, not opinion change
- **Steel-Manning Requirement** (Principle II): Every persona presents the strongest version of its perspective and acknowledges valid opposing points
- **Source Grounding** (Principle III): RAG is mandatory; all debate claims are traced to source articles with inline citations
- **Bias Transparency** (Principle IV): Users see which sources inform each persona and can compare coverage across perspectives within the same debate
- **Moderation & Safety** (Principle VI): Personas refuse hate speech, maintain civil discourse, and are clearly identified as AI on every screen
- **Avoiding False Personification** (AI Ethics): Personas do not use real politician names or identifiable figures; clear AI disclosure on every debate turn
