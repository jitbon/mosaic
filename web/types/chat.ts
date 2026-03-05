export type Perspective = "left" | "center" | "right";

export interface PerspectiveAvailability {
  available: boolean;
  source_count: number;
}

export interface PerspectiveAvailabilityResponse {
  perspectives: Record<Perspective, PerspectiveAvailability>;
}

export interface ChatRequest {
  message: string;
  perspective: Perspective;
  conversation_id?: number;
}

export interface Citation {
  index: number;
  source_name: string;
  article_title: string;
  article_url: string;
  bias_label: string;
  quoted_text: string;
}

export type ChatSSEEvent =
  | { type: "conversation_start"; conversation_id: number }
  | { type: "context_summarized" }
  | { type: "token"; text: string }
  | { type: "citation"; citations: Citation[] }
  | { type: "done"; message_id: number }
  | { type: "ended"; reason: string; message: string }
  | { type: "error"; code: string; message: string };

export interface ConversationSummary {
  id: number;
  story_id: number;
  perspective: Perspective;
  message_count: number;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  last_message_preview: string;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  story_id: number;
  perspective: Perspective;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export type EmojiValue = "thumbs_up" | "thumbs_down" | "question" | "lightbulb" | "heart";

export interface EmojiOption {
  value: EmojiValue;
  display: string;
  label: string;
}

export const EMOJI_OPTIONS: EmojiOption[] = [
  { value: "thumbs_up", display: "👍", label: "Agree" },
  { value: "thumbs_down", display: "👎", label: "Disagree" },
  { value: "question", display: "❓", label: "Confused" },
  { value: "lightbulb", display: "💡", label: "Insightful" },
  { value: "heart", display: "❤️", label: "Appreciate" },
];

export interface Reaction {
  id: number;
  emoji: EmojiValue;
  created_at: string;
}

// Map of message_id (or debate_turn_id) string → reactions
export type ReactionsMap = Record<string, Reaction[]>;
