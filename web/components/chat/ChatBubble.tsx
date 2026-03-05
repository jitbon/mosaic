"use client";

import { useState } from "react";
import type { EmojiValue, Message, Reaction } from "@/types/chat";
import { EMOJI_OPTIONS } from "@/types/chat";
import CitationCard from "./CitationCard";
import ReactionPicker from "./ReactionPicker";

const PERSPECTIVE_COLORS: Record<string, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

interface ChatBubbleProps {
  message: Message;
  perspective?: string;
  reactions?: Reaction[];
  onReactionToggle?: (messageId: number, emoji: EmojiValue) => void;
  streaming?: boolean;
}

export default function ChatBubble({ message, perspective, reactions = [], onReactionToggle, streaming = false }: ChatBubbleProps) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isUser = message.role === "user";
  const accentColor = perspective ? (PERSPECTIVE_COLORS[perspective] ?? "var(--color-primary)") : "var(--color-primary)";
  const appliedEmojis = reactions.map((r) => r.emoji);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
        padding: "0 12px",
      }}
    >
      <div
        style={{ position: "relative", maxWidth: "80%" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            backgroundColor: isUser ? accentColor : "var(--color-card-bg)",
            color: isUser ? "white" : "var(--color-text-primary)",
            border: isUser ? "none" : `1px solid var(--color-border)`,
            borderLeft: !isUser ? `3px solid ${accentColor}` : undefined,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {message.content}
        </div>

        {/* Reaction trigger — only on assistant messages, not while streaming */}
        {!isUser && !streaming && onReactionToggle && (hovered || pickerOpen) && (
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Add reaction"
            aria-expanded={pickerOpen}
            style={{
              position: "absolute",
              bottom: -10,
              right: -10,
              background: "var(--color-surface-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "50%",
              width: 24,
              height: 24,
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            😊
          </button>
        )}

        {/* Reaction picker popup */}
        {pickerOpen && !isUser && !streaming && (
          <ReactionPicker
            appliedEmojis={appliedEmojis}
            onSelect={(emoji) => {
              onReactionToggle?.(message.id, emoji);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      {/* Applied reaction badges */}
      {!isUser && reactions.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 4, maxWidth: "80%", flexWrap: "wrap" }}>
          {reactions.map((r) => {
            const opt = EMOJI_OPTIONS.find((o) => o.value === r.emoji);
            return (
              <button
                key={r.emoji}
                onClick={() => onReactionToggle?.(message.id, r.emoji)}
                aria-label={`Remove ${opt?.label ?? r.emoji} reaction`}
                title={`Remove ${opt?.label ?? r.emoji}`}
                style={{
                  background: "var(--color-surface-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: "1px 6px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {opt?.display ?? r.emoji}
              </button>
            );
          })}
        </div>
      )}

      {!isUser && message.citations && message.citations.length > 0 && (
        <div style={{ maxWidth: "80%", marginTop: 4 }}>
          <button
            onClick={() => setCitationsOpen((o) => !o)}
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
            }}
          >
            {citationsOpen ? "▲" : "▼"} {message.citations.length} source{message.citations.length !== 1 ? "s" : ""}
          </button>
          {citationsOpen && (
            <div>
              {message.citations.map((c) => (
                <CitationCard key={c.index} citation={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
