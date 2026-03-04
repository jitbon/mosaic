<!--
SYNC IMPACT REPORT
==================
Version change: Initial → 1.0.0
Modified principles: N/A (Initial constitution)
Added sections: All core principles, AI Ethics & Safety, User Experience Standards, Technology Constraints, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ constitution.md (this file)
  ⚠ spec-template.md (will use as-is, context added via constitution)
  ⚠ plan-template.md (will use as-is, context added via constitution)
Follow-up TODOs: None
-->

# MosaicAI Constitution

## Core Principles

### I. Understanding Over Persuasion (NON-NEGOTIABLE)

The primary goal is to help users **understand** different viewpoints, not to persuade, radicalize, or push any agenda.

- All features MUST prioritize clarity, comprehension, and exposure to diverse perspectives
- Personas MUST NOT employ manipulative or coercive language
- Success is measured by user understanding, not opinion change
- No gamification or engagement patterns that favor extreme content

**Rationale**: MosaicAI exists to reduce polarization and increase empathy. Any feature that optimizes for engagement over understanding violates this core mission.

### II. Steel-Manning Requirement (NON-NEGOTIABLE)

Every AI persona MUST represent its assigned viewpoint using the **steel-man principle**: presenting the strongest, most intellectually honest version of that perspective.

- No straw-manning, caricatures, or bad-faith arguments
- No ad hominem attacks or dismissive rhetoric
- Personas acknowledge valid concerns and limitations of their own position
- Disagreements focus on substance, values, and priorities—not character

**Rationale**: Users cannot develop genuine understanding from distorted representations. Steel-manning builds respect and intellectual honesty into the system architecture.

### III. Source Grounding (NON-NEGOTIABLE)

Every AI persona claim, argument, or position MUST be grounded in real, attributable source material.

- All persona statements traced to specific articles, transcripts, or official sources
- RAG (Retrieval-Augmented Generation) is mandatory for all persona interactions
- Clear source attribution displayed to users
- No fabricated quotes, statistics, or positions

**Rationale**: Grounding prevents hallucination, ensures accountability, and allows users to verify claims independently.

### IV. Bias Transparency

Source bias and coverage gaps MUST be visible to users at all times.

- Display Left/Center/Right coverage distribution for every story
- Highlight "Blindspot" stories (covered primarily by one side)
- Show which sources ground each persona's perspective
- Use AllSides or equivalent bias ratings for source classification

**Rationale**: Users cannot evaluate perspectives without understanding source bias and coverage patterns.

### V. Privacy & Data Minimization

User data collection MUST be minimal, purposeful, and transparent.

- No tracking of political leanings, ideological profiles, or opinion change
- User chat history stored only with explicit consent and clear retention policy
- No selling or sharing of user data with third parties
- No algorithmic profiling for targeting or manipulation

**Rationale**: Trust is essential for users to explore perspectives openly. Data exploitation destroys that trust.

### VI. Moderation & Safety

The system MUST deflect hate speech, personal attacks, and bad-faith engagement back to substantive discussion.

- Personas refuse to engage with slurs, threats, or dehumanizing language
- Clear disclaimers that personas are AI representations, not real people
- Human moderation for edge cases and escalations
- Continuous monitoring for emergent harmful patterns

**Rationale**: Safe exploration of controversial topics requires boundaries. Without moderation, the platform can amplify harm.

## AI Ethics & Safety

### Avoiding False Personification

- Personas MUST NOT use real politician names or identifiable public figures
- Clear visual and textual indicators that personas are AI constructs
- Disclaimers on every Debate Mode and Chat Mode screen
- No use of real photos, voices, or biometric representations

**Rationale**: Users must understand they are interacting with AI systems representing viewpoints, not real individuals with agency or accountability.

### Validation & Fairness Review

- Regular audits to ensure personas represent each viewpoint fairly
- Independent review of persona prompts and grounding sources
- User feedback mechanisms to flag unfair representations
- Iteration based on both quantitative metrics and qualitative assessment

**Rationale**: Algorithmic bias and prompt engineering errors can inadvertently favor one perspective. Continuous validation protects against systemic unfairness.

## User Experience Standards

### Performance & Reliability

- News feed MUST load in under 2 seconds on standard mobile connections
- Persona generation MUST return within 5 seconds for on-demand stories
- System MUST handle 1000 concurrent users without degradation (MVP target)
- Graceful fallbacks for API failures or missing data

### Accessibility

- All UI elements MUST meet WCAG 2.1 AA standards
- Support for screen readers and assistive technologies
- High-contrast modes and adjustable text sizes
- Keyboard navigation for all interactive features

### Mobile-First Design

- Primary target platform is mobile (React Native + Expo)
- Touch-friendly UI with appropriate tap targets
- Offline mode for previously loaded stories
- Responsive design for tablets and web

## Technology Constraints

### Tech Stack Commitments

- **Frontend**: React Native + Expo (mobile), Next.js (web)
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + pgvector for embeddings)
- **LLM**: Claude API (primary for persona generation)
- **Embeddings**: OpenAI text-embedding-3-small
- **Auth**: Supabase Auth or Clerk

**Rationale**: These choices optimize for rapid iteration (Expo), ML/NLP capabilities (Python + FastAPI), vector search (pgvector), and high-quality persona generation (Claude).

### API & Integration Requirements

- All external APIs (News API, AllSides, etc.) MUST have fallback mechanisms
- Rate limiting and caching to manage API costs
- Graceful degradation when third-party services unavailable

## Governance

This constitution supersedes all other development practices and product decisions. Any feature, design, or implementation that conflicts with these principles MUST be rejected or revised.

### Amendment Process

1. Proposed amendments documented with rationale and impact analysis
2. Review by project stakeholders (technical lead, ethics advisor, UX lead)
3. Version bump according to semantic versioning:
   - **MAJOR**: Removal or fundamental redefinition of core principles
   - **MINOR**: Addition of new principles or material expansions
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review

- All feature specs MUST reference relevant constitutional principles
- All PRs MUST include a "Constitution Compliance" section in description
- Regular audits to ensure implementation aligns with stated principles

### Living Document

This constitution will evolve as the project learns from user feedback, discovers edge cases, and navigates ethical challenges. Amendments require documentation but are expected and encouraged.

**Version**: 1.0.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-04
