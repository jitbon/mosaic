"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPerspectives } from "@/lib/api";
import ChatPane from "@/components/chat/ChatPane";
import type { Perspective, PerspectiveAvailabilityResponse } from "@/types/chat";

const ALL_PERSPECTIVES: Perspective[] = ["left", "center", "right"];
const LABELS: Record<Perspective, string> = { left: "Left", center: "Center", right: "Right" };
const COLORS: Record<Perspective, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

export default function ChatClient({ storyId }: { storyId: string }) {
  const id = Number(storyId);
  const [perspectives, setPerspectives] = useState<PerspectiveAvailabilityResponse | null>(null);
  const [openPanes, setOpenPanes] = useState<Perspective[]>(["left"]);

  useEffect(() => {
    getPerspectives(id).then(setPerspectives).catch(() => null);
  }, [id]);

  function togglePane(p: Perspective) {
    setOpenPanes((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    );
  }

  function closePane(p: Perspective) {
    setOpenPanes((prev) => prev.length > 1 ? prev.filter((x) => x !== p) : prev);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top bar */}
      <div style={{ padding: "10px 16px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Link href={`/story/${storyId}`} style={{ textDecoration: "none", color: "var(--color-primary)", fontSize: 14 }}>← Story</Link>
        <span style={{ flex: 1 }} />
        {/* Perspective toggle chips */}
        {ALL_PERSPECTIVES.map((p) => {
          const info = perspectives?.perspectives[p];
          const available = info?.available ?? true;
          const isOpen = openPanes.includes(p);
          const color = COLORS[p];

          return (
            <button
              key={p}
              onClick={() => available && togglePane(p)}
              disabled={!available}
              style={{
                padding: "4px 12px",
                borderRadius: 16,
                border: isOpen ? `2px solid ${color}` : "1px solid var(--color-border)",
                backgroundColor: isOpen ? `${color}18` : "transparent",
                color: isOpen ? color : available ? "var(--color-text-secondary)" : "var(--color-text-disabled)",
                fontWeight: isOpen ? 700 : 400,
                fontSize: 12,
                cursor: available ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              {LABELS[p]}
            </button>
          );
        })}
      </div>

      {/* Split panes */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {openPanes.map((p, i) => (
          <div
            key={p}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
              minWidth: 0,
            }}
          >
            <ChatPane
              storyId={id}
              perspective={p}
              onClose={openPanes.length > 1 ? () => closePane(p) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
