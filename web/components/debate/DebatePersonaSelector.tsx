"use client";

import type { Perspective, PerspectiveAvailabilityResponse } from "@/types/chat";

interface DebatePersonaSelectorProps {
  perspectives: PerspectiveAvailabilityResponse | null;
  selected: Perspective[];
  onChange: (selected: Perspective[]) => void;
  onStart: () => void;
  starting?: boolean;
}

const ALL: Perspective[] = ["left", "center", "right"];
const LABELS: Record<Perspective, string> = { left: "Left", center: "Center", right: "Right" };
const COLORS: Record<Perspective, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

export default function DebatePersonaSelector({
  perspectives,
  selected,
  onChange,
  onStart,
  starting = false,
}: DebatePersonaSelectorProps) {
  function toggle(p: Perspective) {
    if (selected.includes(p)) {
      onChange(selected.filter((s) => s !== p));
    } else if (selected.length < 3) {
      onChange([...selected, p]);
    }
  }

  const canStart = selected.length >= 2 && !starting;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
        Choose Perspectives to Debate
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 16px" }}>
        Select 2–3 perspectives
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {ALL.map((p) => {
          const info = perspectives?.perspectives[p];
          const available = info?.available ?? true;
          const isSelected = selected.includes(p);
          const color = COLORS[p];

          return (
            <button
              key={p}
              onClick={() => available && toggle(p)}
              disabled={!available}
              style={{
                flex: 1,
                padding: "14px 8px",
                borderRadius: 12,
                border: isSelected ? `2px solid ${color}` : "2px solid var(--color-border)",
                backgroundColor: isSelected ? `${color}18` : "var(--color-card-bg)",
                color: available ? (isSelected ? color : "var(--color-text-secondary)") : "var(--color-text-disabled)",
                fontWeight: isSelected ? 700 : 400,
                fontSize: 14,
                cursor: available ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>
                {p === "left" ? "🔵" : p === "center" ? "🟣" : "🔴"}
              </div>
              {LABELS[p]}
              {isSelected && <div style={{ fontSize: 18, marginTop: 4 }}>✓</div>}
            </button>
          );
        })}
      </div>

      <button
        onClick={onStart}
        disabled={!canStart}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          backgroundColor: canStart ? "var(--color-primary)" : "var(--color-text-disabled)",
          color: "white",
          fontWeight: 700,
          fontSize: 15,
          cursor: canStart ? "pointer" : "not-allowed",
        }}
      >
        {starting ? "Starting…" : "Start Debate"}
      </button>

      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "10px 0 0", textAlign: "center" }}>
        These are AI personas representing viewpoints, not real people
      </p>
    </div>
  );
}
