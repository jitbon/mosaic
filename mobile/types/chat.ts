export type Perspective = "left" | "center" | "right";

export interface Citation {
  index: number;
  source_name: string;
  article_title: string;
  article_url: string;
  bias_label: string;
  quoted_text: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  story_id: string;
  perspective: Perspective;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  story_id: string;
  perspective: Perspective;
  message_count: number;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
}

export interface PerspectiveInfo {
  available: boolean;
  source_count: number;
}

export interface PerspectiveAvailability {
  perspectives: Record<Perspective, PerspectiveInfo>;
}

export interface ChatRequest {
  message: string;
  perspective: Perspective;
  conversation_id: string | null;
}

// SSE event types
export interface ChatTokenEvent {
  type: "token";
  text: string;
}

export interface ChatCitationEvent {
  type: "citation";
  citations: Citation[];
}

export interface ChatDoneEvent {
  type: "done";
  message_id: string;
}

export interface ChatErrorEvent {
  type: "error";
  code: string;
  message: string;
}

export interface ChatConversationStartEvent {
  type: "conversation_start";
  conversation_id: string;
}

export interface ChatEndedEvent {
  type: "ended";
  reason: string;
  message: string;
}

export type ChatStreamEvent =
  | ChatTokenEvent
  | ChatCitationEvent
  | ChatDoneEvent
  | ChatErrorEvent
  | ChatConversationStartEvent
  | ChatEndedEvent;
