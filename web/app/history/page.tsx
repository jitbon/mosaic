"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ChatHistoryList from "@/components/chat/ChatHistoryList";
import DebateHistoryList from "@/components/debate/DebateHistoryList";

function HistoryContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "debates" ? "debates" : "chats";

  return (
    <div>
      <header
        style={{
          padding: "16px",
          backgroundColor: "var(--color-surface-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text-primary)" }}>
          History
        </h1>
        <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)" }}>
          {(["chats", "debates"] as const).map((t) => (
            <a
              key={t}
              href={`/history?tab=${t}`}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px 0",
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                backgroundColor: tab === t ? "var(--color-primary-light)" : "var(--color-card-bg)",
                color: tab === t ? "var(--color-primary)" : "var(--color-text-secondary)",
                textDecoration: "none",
                textTransform: "capitalize",
              }}
            >
              {t === "chats" ? "💬 Chats" : "⚖️ Debates"}
            </a>
          ))}
        </div>
      </header>

      <div style={{ padding: "12px" }}>
        {tab === "chats" ? <ChatHistoryList /> : <DebateHistoryList />}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense>
      <HistoryContent />
    </Suspense>
  );
}
