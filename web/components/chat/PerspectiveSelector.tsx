"use client";

import type { Perspective, PerspectiveAvailabilityResponse } from "@/types/chat";

interface PerspectiveSelectorProps {
  perspectives: PerspectiveAvailabilityResponse | null;
  selected: Perspective;
  onChange: (p: Perspective) => void;
}

const LABELS: Record<Perspective, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

const COLORS: Record<Perspective, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

export default function PerspectiveSelector({
  perspectives,
  selected,
  onChange,
}: PerspectiveSelectorProps) {
  const tabs: Perspective[] = ["left", "center", "right"];

  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface-bg)",
      }}
    >
      {tabs.map((p) => {
        const info = perspectives?.perspectives[p];
        const available = info?.available ?? true;
        const isSelected = selected === p;
        const color = COLORS[p];

        return (
          <button
            key={p}
            onClick={() => available && onChange(p)}
            disabled={!available}
            title={!available ? "No sources available for this perspective" : undefined}
            style={{
              flex: 1,
              padding: "12px 8px",
              border: "none",
              borderBottom: isSelected ? `3px solid ${color}` : "3px solid transparent",
              backgroundColor: "transparent",
              color: isSelected ? color : available ? "var(--color-text-secondary)" : "var(--color-text-disabled)",
              fontWeight: isSelected ? 700 : 400,
              fontSize: 13,
              cursor: available ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            {LABELS[p]}
            {info && (
              <span style={{ display: "block", fontSize: 10, color: "var(--color-text-muted)" }}>
                {info.source_count} sources
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
