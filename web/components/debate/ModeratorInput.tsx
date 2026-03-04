"use client";

import { useState } from "react";
import type { Perspective } from "@/types/chat";

interface ModeratorInputProps {
  onSubmit: (message: string, directedAt?: Perspective) => void;
  disabled?: boolean;
  personas: Perspective[];
}

export default function ModeratorInput({ onSubmit, disabled = false, personas }: ModeratorInputProps) {
  const [text, setText] = useState("");
  const [directedAt, setDirectedAt] = useState<Perspective | "">("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed, directedAt || undefined);
    setText("");
    setDirectedAt("");
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        padding: "10px 12px",
        backgroundColor: "var(--color-surface-bg)",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 6px" }}>
        Moderator Interjection
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <select
          value={directedAt}
          onChange={(e) => setDirectedAt(e.target.value as Perspective | "")}
          style={{
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-input-bg)",
            fontSize: 12,
            color: "var(--color-text-secondary)",
          }}
        >
          <option value="">All personas</option>
          {personas.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a moderator comment…"
          disabled={disabled}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 20,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-input-bg)",
            fontSize: 13,
            outline: "none",
            color: "var(--color-text-primary)",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          style={{
            padding: "8px 14px",
            borderRadius: 20,
            border: "none",
            backgroundColor: disabled || !text.trim() ? "var(--color-text-disabled)" : "var(--color-success)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: disabled || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
