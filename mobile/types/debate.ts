import type { Citation, Perspective } from "./chat";

// --- Core entities ---

export type DebateStatus = "active" | "paused" | "completed";

export type DebateRole =
  | "persona_left"
  | "persona_center"
  | "persona_right"
  | "moderator";

export interface Debate {
  id: string;
  story_id: string;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  created_at: string;
  updated_at?: string;
}

export interface DebateTurn {
  id: string;
  turn_number: number;
  role: DebateRole;
  content: string;
  summary: string | null;
  citations: Citation[] | null;
  round_number: number;
  created_at: string;
}

export interface DebateDetail extends Debate {
  turns: DebateTurn[];
}

export interface DebateListItem {
  id: string;
  story_id: string;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  turn_count: number;
  created_at: string;
  updated_at: string;
  last_turn_preview: string | null;
}

// --- API request/response ---

export interface DebateCreateRequest {
  personas: Perspective[];
}

export interface InterjectionRequest {
  message: string;
  directed_at: Perspective | null;
}

export interface InterjectionResponse {
  turn_id: string;
  turn_number: number;
  role: "moderator";
  content: string;
  directed_at: Perspective | null;
}

// --- SSE event types ---

export interface DebateRoundStartEvent {
  type: "round_start";
  round_number: number;
}

export interface DebateTurnStartEvent {
  type: "turn_start";
  role: DebateRole;
  turn_number: number;
}

export interface DebateTokenEvent {
  type: "token";
  text: string;
}

export interface DebateCitationEvent {
  type: "citation";
  citations: Citation[];
}

export interface DebateTurnSummaryEvent {
  type: "turn_summary";
  turn_id: string;
  summary: string;
}

export interface DebateTurnCompleteEvent {
  type: "turn_complete";
  turn_id: string;
  role: DebateRole;
}

export interface DebateRoundCompleteEvent {
  type: "round_complete";
  round_number: number;
  debate_id: string;
}

export interface DebateErrorEvent {
  type: "error";
  code: string;
  message: string;
}

export interface DebateEndedEvent {
  type: "ended";
  reason: string;
  message: string;
}

export type DebateStreamEvent =
  | DebateRoundStartEvent
  | DebateTurnStartEvent
  | DebateTokenEvent
  | DebateCitationEvent
  | DebateTurnSummaryEvent
  | DebateTurnCompleteEvent
  | DebateRoundCompleteEvent
  | DebateErrorEvent
  | DebateEndedEvent;
