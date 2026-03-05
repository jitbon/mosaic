"use client";

import { useState } from "react";
import type { DebateTurnData, DebateRole } from "@/types/debate";
import type { EmojiValue, Reaction } from "@/types/chat";
import { EMOJI_OPTIONS } from "@/types/chat";
import CitationCard from "@/components/chat/CitationCard";
import ReactionPicker from "@/components/chat/ReactionPicker";

const ROLE_COLORS: Record<DebateRole, string> = {
  persona_left: "var(--color-left)",
  persona_center: "var(--color-center)",
  persona_right: "var(--color-right)",
  moderator: "var(--color-text-muted)",
};

const ROLE_LABELS: Record<DebateRole, string> = {
  persona_left: "Left",
  persona_center: "Center",
  persona_right: "Right",
  moderator: "Moderator",
};

interface DebateTurnProps {
  turn: DebateTurnData;
  reactions?: Reaction[];
  onReactionToggle?: (turnId: number, emoji: EmojiValue) => void;
}

export default function DebateTurn({ turn, reactions = [], onReactionToggle }: DebateTurnProps) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = ROLE_COLORS[turn.role] ?? "var(--color-text-muted)";
  const label = ROLE_LABELS[turn.role] ?? turn.role;
  const isModerator = turn.role === "moderator";
  const appliedEmojis = reactions.map((r) => r.emoji);

  return (
    <div
      style={{
        margin: "8px 12px",
        padding: "12px 14px",
        borderRadius: 12,
        backgroundColor: isModerator ? "var(--color-warning-bg)" : "var(--color-card-bg)",
        border: `1px solid var(--color-border)`,
        borderLeft: `4px solid ${color}`,
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>Turn {turn.turn_number}</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-primary)", margin: 0 }}>
        {turn.content}
      </p>

      {/* Reaction trigger — only on persona turns, not moderator */}
      {!isModerator && onReactionToggle && (hovered || pickerOpen) && (
        <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Add reaction"
            aria-expanded={pickerOpen}
            style={{
              background: "var(--color-surface-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--color-text-muted)",
            }}
          >
            😊 React
          </button>
          {pickerOpen && (
            <ReactionPicker
              appliedEmojis={appliedEmojis}
              onSelect={(emoji) => {
                onReactionToggle(turn.id, emoji);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      )}

      {/* Applied reaction badges */}
      {!isModerator && reactions.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {reactions.map((r) => {
            const opt = EMOJI_OPTIONS.find((o) => o.value === r.emoji);
            return (
              <button
                key={r.emoji}
                onClick={() => onReactionToggle?.(turn.id, r.emoji)}
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

      {turn.citations && turn.citations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setCitationsOpen((o) => !o)}
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {citationsOpen ? "▲" : "▼"} {turn.citations.length} source{turn.citations.length !== 1 ? "s" : ""}
          </button>
          {citationsOpen && turn.citations.map((c) => <CitationCard key={c.index} citation={c} />)}
        </div>
      )}
    </div>
  );
}
