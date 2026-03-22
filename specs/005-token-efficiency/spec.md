# Feature Specification: API Token Efficiency & Prompt Optimization

**Feature Branch**: `005-token-efficiency`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Hardening to make sure we get more efficient with our prompts and session usage, making use of the APIs/tokens as efficiently as possible. Inspired by how Ground News and other AI-wrapped chatbots handle this."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduced Cost Per Conversation (Priority: P1)

As the system operator, I want each chat and debate session to consume significantly fewer input tokens so that the per-conversation cost drops without degrading response quality. Today, every request re-sends the full system prompt and growing message history, which wastes tokens on content the provider has already processed. By enabling prompt caching for stable prompt prefixes (persona rules, RAG context templates, debate instructions), the system should serve the same quality responses at a fraction of the input cost.

**Why this priority**: Token costs are the primary operational expense. Prompt caching alone can reduce input token costs by up to 90% on repeated prefixes, delivering the highest ROI of any optimization.

**Independent Test**: Can be fully tested by comparing the `cache_read_input_tokens` vs `input_tokens` fields in API responses before and after enablement, and verifying that response quality (measured by coherence and citation accuracy) remains unchanged.

**Acceptance Scenarios**:

1. **Given** a user sends a second message in an existing chat conversation, **When** the system prompt and prior context are sent to the AI provider, **Then** the stable prefix portion is served from cache (confirmed by cache hit metrics in the API response).
2. **Given** two different users start chat sessions on the same news story with the same persona perspective, **When** their requests share an identical system prompt prefix, **Then** the shared prefix is served from cache for the second user's request.
3. **Given** prompt caching is enabled, **When** 100 consecutive chat messages are processed, **Then** the average input token cost per message is at least 40% lower than without caching.

---

### User Story 2 - Smarter Context Window Management (Priority: P2)

As a user having a long conversation with a persona, I want the system to intelligently manage what context is sent with each request so that I get relevant, coherent responses without the system wasting tokens on stale or irrelevant earlier messages. Currently, summarization kicks in at a fixed token threshold, but there is no prioritization of which messages matter most. The system should use a sliding window that keeps recent messages verbatim while summarizing older context, and it should track token usage accurately rather than relying on rough word-count estimates.

**Why this priority**: Context management directly affects both cost and quality. Better context selection means fewer wasted tokens and more relevant responses.

**Independent Test**: Can be tested by running a 20+ message conversation and verifying that (a) total tokens sent stay within a defined budget, (b) the AI still references key points from early in the conversation, and (c) accurate token counts are logged.

**Acceptance Scenarios**:

1. **Given** a conversation exceeds the context budget, **When** the next message is sent, **Then** the system keeps the N most recent messages verbatim and replaces older messages with a progressive summary, staying within the token budget.
2. **Given** a conversation is in progress, **When** the system prepares context for the AI, **Then** it uses accurate token counting (not word-count approximation) to determine what fits within the budget.
3. **Given** a long conversation where the user referenced an important point early on, **When** that point is summarized into the rolling context, **Then** the AI can still refer to it coherently in later responses.

---

### User Story 3 - Token Usage Visibility & Budgeting (Priority: P3)

As the system operator, I want a dashboard or reporting mechanism that shows token consumption broken down by feature (chat, debate, summarization), cache hit rates, and cost estimates, so that I can monitor efficiency gains and identify further optimization opportunities. Today there is no visibility into how many tokens each conversation or feature consumes.

**Why this priority**: You can't optimize what you can't measure. Usage tracking is foundational for ongoing cost management and for validating that the other optimizations are working.

**Independent Test**: Can be tested by processing a known set of conversations and verifying that the usage report accurately reflects the token counts returned by the AI provider API.

**Acceptance Scenarios**:

1. **Given** multiple chat and debate sessions have occurred, **When** an operator views the usage report, **Then** they see total input tokens, output tokens, cached tokens, and estimated cost broken down by feature type (chat, debate, summarization).
2. **Given** prompt caching is active, **When** the operator checks the cache efficiency metrics, **Then** they see the cache hit rate, total tokens saved, and estimated cost savings over a configurable time period.
3. **Given** a daily reporting period, **When** the system generates a usage summary, **Then** it includes per-story and per-conversation token consumption so operators can identify unusually expensive sessions.

---

### User Story 4 - Pre-computed Summaries for Common Contexts (Priority: P4)

As a user opening a news story, I want the AI personas to already have a pre-computed understanding of the story and its key perspectives, so that the first response is fast and the system doesn't have to re-process the same articles for every user. Inspired by how Ground News pre-computes bias-comparison summaries for stories, the system should batch-process popular or trending stories to generate perspective summaries ahead of time, reducing per-request token consumption for RAG context.

**Why this priority**: Pre-computation amortizes the cost of article processing across all users who view the same story, and reduces first-response latency.

**Independent Test**: Can be tested by verifying that a story with pre-computed summaries uses fewer input tokens per chat request compared to one that builds RAG context on the fly, and that first-response time is measurably faster.

**Acceptance Scenarios**:

1. **Given** a news story has been ingested, **When** the story reaches a popularity threshold or is manually flagged, **Then** the system pre-generates perspective summaries (one per political lean) from the article chunks.
2. **Given** a pre-computed summary exists for a story and perspective, **When** a user starts a chat with that persona on that story, **Then** the system uses the compact pre-computed summary instead of raw article chunks, reducing RAG context size.
3. **Given** pre-computed summaries are available, **When** compared to raw chunk injection, **Then** the input token count for RAG context is at least 50% lower per request.

---

### Edge Cases

- What happens when the cache TTL expires mid-conversation? The system should gracefully fall back to uncached requests without interrupting the user experience.
- How does the system handle a sudden spike in unique stories that defeats caching? The system should degrade gracefully, falling back to standard (uncached) processing without errors.
- What happens when token counting produces a different result than the AI provider reports? The system should log discrepancies and use the provider-reported count as the source of truth for billing/reporting.
- What if a pre-computed summary becomes stale because the underlying articles are updated? Pre-computed summaries should have a TTL and be regenerated when source articles change.
- How does the system behave when the context budget is so tight that even the summary plus the last message exceeds it? The system should truncate the summary progressively rather than dropping it entirely, preserving the most recent information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support prompt caching for stable prompt prefixes, including system instructions, persona rules, and shared RAG context, to reduce redundant input token processing.
- **FR-002**: System MUST use accurate token counting (aligned with the AI provider's tokenizer) rather than word-count approximation when making context budgeting decisions.
- **FR-003**: System MUST implement a sliding context window that keeps the most recent N messages verbatim and progressively summarizes older messages, replacing the current all-or-nothing summarization approach.
- **FR-004**: System MUST track and persist token usage metrics for every AI provider API call, including input tokens, output tokens, cached input tokens, and the feature context (chat, debate, or summarization).
- **FR-005**: System MUST provide a usage reporting mechanism that aggregates token consumption and cost estimates by feature type, time period, story, and conversation.
- **FR-006**: System MUST support pre-computing perspective summaries for stories, triggered by popularity thresholds or manual flags, to reduce per-request RAG context size.
- **FR-007**: System MUST structure prompts so that stable content (rules, instructions, persona definition) appears at the beginning and variable content (user message, recent history) appears at the end, maximizing cache prefix reuse.
- **FR-008**: System MUST set a configurable per-conversation token budget that caps the total input tokens sent per request, enforced via the sliding context window and summarization.
- **FR-009**: System MUST log cache hit/miss rates and make them available for monitoring.
- **FR-010**: System MUST handle cache misses and provider API changes gracefully, falling back to standard (uncached) request processing without user-visible errors.
- **FR-011**: System MUST support configurable threshold-based alerts that notify operators when per-conversation token cost exceeds a set limit, daily aggregate spend exceeds a set limit, or cache hit rate drops below a configured percentage.

### Key Entities

- **Token Usage Record**: A log entry for each AI provider API call, capturing input tokens, output tokens, cached tokens, cost estimate, feature type (chat/debate/summarization), associated story and conversation identifiers, and timestamp. Detailed records are retained for 90 days; after that, records are aggregated into daily summaries kept indefinitely for long-term trend analysis.
- **Pre-computed Summary**: A condensed perspective summary for a story, generated ahead of user requests. Attributes include story identifier, political perspective, summary text, source article versions, generation timestamp, and TTL/staleness indicator.
- **Context Budget Configuration**: Per-feature settings controlling maximum input tokens per request, sliding window size (number of recent messages kept verbatim), and summarization thresholds.

## Clarifications

### Session 2026-03-22

- Q: How long should token usage records be retained? → A: 90 days detailed, then aggregate into daily summaries kept indefinitely.
- Q: What should trigger an operator alert for abnormal token spending? → A: Configurable threshold alerts — per-conversation cost exceeds X, daily spend exceeds Y, cache hit rate drops below Z%.
- Q: Should optimizations be rolled out incrementally or all at once? → A: Incremental — ship each priority level independently (P1→P2→P3→P4) with validation between each.

## Assumptions

- The AI provider (Anthropic Claude) continues to support prompt caching with ephemeral cache controls and reports cache hit metrics in API responses.
- The current model (Claude Haiku 4.5) supports prompt caching. If not, the system will use whichever model supports it at the appropriate cost tier.
- A 5-minute default cache TTL is acceptable for most conversations (users typically send follow-up messages within minutes). The 1-hour extended TTL may be used for high-traffic stories if cost-effective.
- Pre-computed summaries are generated asynchronously (background job) and do not block user requests. If a summary is not yet available, the system falls back to raw chunk injection.
- Token counting accuracy within 5% of provider-reported counts is sufficient for budgeting decisions; exact counts are used for billing/reporting from provider response data.
- The existing Redis infrastructure can be reused for caching metadata and usage aggregation.
- Rollout is incremental by priority: P1 (prompt caching) ships first with validation, then P2 (context management), P3 (usage reporting), and P4 (pre-computed summaries). Each phase is validated against its success criteria before the next begins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Average input token cost per chat message decreases by at least 40% compared to the pre-optimization baseline, measured over a 7-day period with representative usage.
- **SC-002**: Prompt cache hit rate reaches at least 60% across all chat and debate requests within the first week of deployment.
- **SC-003**: Context token budgets are respected for 99%+ of requests — no request exceeds its configured maximum input token count.
- **SC-004**: First response time for stories with pre-computed summaries is at least 30% faster than stories without them.
- **SC-005**: Token usage reports are available with data no more than 1 hour old, and reported totals match AI provider billing data within 5% accuracy.
- **SC-006**: Users report no degradation in response quality (coherence, relevance, citation accuracy) as measured by a qualitative review of sample conversations before and after optimization.
- **SC-007**: System gracefully handles 100% cache miss scenarios (e.g., cold start, cache flush) with no user-visible errors and response times no more than 2x the cached baseline.
