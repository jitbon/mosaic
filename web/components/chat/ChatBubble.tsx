"use client";

import { useState } from "react";
import type { Message } from "@/types/chat";
import CitationCard from "./CitationCard";

const PERSPECTIVE_COLORS: Record<string, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

interface ChatBubbleProps {
  message: Message;
  perspective?: string;
}

export default function ChatBubble({ message, perspective }: ChatBubbleProps) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const isUser = message.role === "user";
  const accentColor = perspective ? (PERSPECTIVE_COLORS[perspective] ?? "var(--color-primary)") : "var(--color-primary)";

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
        style={{
          maxWidth: "80%",
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
