"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { getConversations, getConversation } from "@/lib/api";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import StreamingText from "./StreamingText";
import type { Perspective } from "@/types/chat";

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

const PERSPECTIVE_COLORS: Record<Perspective, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

interface ChatPaneProps {
  storyId: number;
  perspective: Perspective;
  onClose?: () => void;
}

export default function ChatPane({ storyId, perspective, onClose }: ChatPaneProps) {
  const { messages, streaming, streamingText, ended, endedReason, error, sendMessage, loadConversation, reset } = useChat(storyId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const color = PERSPECTIVE_COLORS[perspective];

  // Load existing conversation on mount
  useEffect(() => {
    reset();
    getConversations(storyId)
      .then((list) => {
        const match = list.find((c) => c.perspective === perspective && !c.is_ended);
        if (match) {
          return getConversation(match.id).then((conv) => loadConversation(conv.messages, conv.id));
        }
      })
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, perspective]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Pane header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `2px solid ${color}`,
          backgroundColor: "var(--color-surface-bg)",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color, flex: 1 }}>
          {PERSPECTIVE_LABELS[perspective]}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close pane"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {messages.length === 0 && !streaming && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: 40, fontSize: 14 }}>
            Start a conversation with the {PERSPECTIVE_LABELS[perspective].toLowerCase()} perspective.
          </p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} perspective={perspective} />
        ))}
        {streaming && streamingText && (
          <div style={{ padding: "0 12px", marginBottom: 12 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                backgroundColor: "var(--color-card-bg)",
                border: "1px solid var(--color-border)",
                borderLeft: `3px solid ${color}`,
                fontSize: 14,
                lineHeight: 1.6,
                maxWidth: "80%",
              }}
            >
              <StreamingText text={streamingText} streaming />
            </div>
          </div>
        )}
        {streaming && !streamingText && (
          <div style={{ padding: "0 12px", marginBottom: 12 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                backgroundColor: "var(--color-card-bg)",
                border: "1px solid var(--color-border)",
                borderLeft: `3px solid ${color}`,
                fontSize: 14,
                color: "var(--color-text-muted)",
              }}
            >
              <span style={{ animation: "blink 1s step-end infinite" }}>●</span>
              <span style={{ margin: "0 2px", animation: "blink 1s step-end 0.33s infinite" }}>●</span>
              <span style={{ animation: "blink 1s step-end 0.66s infinite" }}>●</span>
              <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
            </div>
          </div>
        )}
        {ended && (
          <div style={{ textAlign: "center", padding: "8px 16px", color: "var(--color-text-muted)", fontSize: 13 }}>
            {endedReason ?? "Conversation ended."}
          </div>
        )}
        {error && (
          <div style={{ margin: "0 12px 8px", padding: "8px 12px", borderRadius: 8, backgroundColor: "var(--color-error-bg)", color: "var(--color-error-text)", fontSize: 13 }}>
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!ended && (
        <ChatInput
          onSend={(text) => sendMessage(text, perspective)}
          disabled={streaming}
        />
      )}
    </div>
  );
}
