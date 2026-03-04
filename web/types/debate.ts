import type { Citation, Perspective } from "./chat";

export type { Citation, Perspective };

export type DebateStatus = "active" | "paused" | "completed";
export type DebateRole = "persona_left" | "persona_center" | "persona_right" | "moderator";

export interface DebateCreate {
  personas: Perspective[];
}

export interface DebateSummary {
  id: number;
  story_id: number;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  turn_count: number;
  created_at: string;
  updated_at: string;
  last_turn_preview: string;
}

export interface DebateTurnData {
  id: number;
  turn_number: number;
  role: DebateRole;
  content: string;
  summary: string | null;
  citations: Citation[] | null;
  round_number: number;
  created_at: string;
}

export interface DebateDetail {
  id: number;
  story_id: number;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  created_at: string;
  updated_at: string;
  turns: DebateTurnData[];
}

export type DebateSSEEvent =
  | { type: "round_start"; round_number: number }
  | { type: "turn_start"; role: DebateRole; turn_number: number }
  | { type: "token"; text: string }
  | { type: "citation"; citations: Citation[] }
  | { type: "turn_summary"; turn_id: string; summary: string }
  | { type: "turn_complete"; turn_id: string; role: DebateRole }
  | { type: "round_complete"; round_number: number; debate_id: string }
  | { type: "ended"; reason: string; message: string }
  | { type: "error"; code: string; message: string };

export interface InterjectionCreate {
  message: string;
  directed_at?: Perspective;
}

export interface InterjectionResponse {
  turn_id: number;
  turn_number: number;
  role: "moderator";
  content: string;
  directed_at: Perspective | null;
}
