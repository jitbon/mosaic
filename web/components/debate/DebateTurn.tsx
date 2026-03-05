"use client";

import { useState } from "react";
import type { DebateTurnData, DebateRole } from "@/types/debate";
import CitationCard from "@/components/chat/CitationCard";

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
}

export default function DebateTurn({ turn }: DebateTurnProps) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const color = ROLE_COLORS[turn.role] ?? "var(--color-text-muted)";
  const label = ROLE_LABELS[turn.role] ?? turn.role;
  const isModerator = turn.role === "moderator";

  return (
    <div
      style={{
        margin: "8px 12px",
        padding: "12px 14px",
        borderRadius: 12,
        backgroundColor: isModerator ? "var(--color-warning-bg)" : "var(--color-card-bg)",
        border: `1px solid var(--color-border)`,
        borderLeft: `4px solid ${color}`,
      }}
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
