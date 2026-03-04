"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface-bg)",
        padding: "8px 12px 12px",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "0 0 6px", textAlign: "center" }}>
        This is an AI perspective, not a real person
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, 2000));
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKey}
          placeholder="Ask a question…"
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 20,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-input-bg)",
            fontSize: 14,
            resize: "none",
            outline: "none",
            color: "var(--color-text-primary)",
            maxHeight: 120,
            overflow: "auto",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: "none",
            backgroundColor: disabled || !text.trim() ? "var(--color-text-disabled)" : "var(--color-primary)",
            color: "white",
            fontSize: 18,
            cursor: disabled || !text.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
      <p style={{ fontSize: 10, color: "var(--color-text-faint)", margin: "4px 0 0", textAlign: "right" }}>
        {text.length}/2000
      </p>
    </div>
  );
}
