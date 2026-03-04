"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import { getPerspectives } from "@/lib/api";
import PerspectiveSelector from "@/components/chat/PerspectiveSelector";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import StreamingText from "@/components/chat/StreamingText";
import ErrorBanner from "@/components/common/ErrorBanner";
import type { Perspective, PerspectiveAvailabilityResponse } from "@/types/chat";

export default function ChatClient({ storyId }: { storyId: string }) {
  const id = Number(storyId);
  const [perspective, setPerspective] = useState<Perspective>("left");
  const [perspectives, setPerspectives] = useState<PerspectiveAvailabilityResponse | null>(null);
  const { messages, streaming, streamingText, conversationId, ended, endedReason, error, sendMessage } = useChat(id);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPerspectives(id).then(setPerspectives).catch(() => null);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "12px 16px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Link href={`/story/${storyId}`} style={{ textDecoration: "none", color: "var(--color-primary)", fontSize: 14 }}>← Story</Link>
        {conversationId && <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>#{conversationId}</span>}
      </div>

      <PerspectiveSelector perspectives={perspectives} selected={perspective} onChange={setPerspective} />
      {error && <ErrorBanner message={error} />}

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
        {messages.length === 0 && !streaming && (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: 40, fontSize: 14 }}>
            Ask the {perspective} perspective about this story
          </p>
        )}
        {messages.map((m) => <ChatBubble key={m.id} message={m} perspective={perspective} />)}
        {streaming && streamingText && (
          <div style={{ padding: "0 12px", marginBottom: 12 }}>
            <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "18px 18px 18px 4px", backgroundColor: "var(--color-card-bg)", border: "1px solid var(--color-border)", fontSize: 14, lineHeight: 1.6 }}>
              <StreamingText text={streamingText} streaming />
            </div>
          </div>
        )}
        {ended && (
          <div style={{ margin: "8px 12px", padding: "10px 14px", backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning-text)", borderRadius: 10, fontSize: 13 }}>
            Conversation ended: {endedReason}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0 }}>
        <ChatInput onSend={(text) => sendMessage(text, perspective)} disabled={streaming || ended} />
      </div>
    </div>
  );
}
