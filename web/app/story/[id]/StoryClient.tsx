"use client";

import Link from "next/link";
import { useStory } from "@/hooks/useStory";
import StoryHeader from "@/components/story/StoryHeader";
import SourceList from "@/components/story/SourceList";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorBanner from "@/components/common/ErrorBanner";

export default function StoryClient({ id }: { id: string }) {
  const storyId = Number(id);
  const { story, loading, error } = useStory(storyId);

  return (
    <div>
      <div style={{ padding: "12px 16px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-primary)", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
          ← Feed
        </Link>
      </div>

      {error && <ErrorBanner message={error.message} />}

      {loading && (
        <div style={{ padding: 16 }}>
          <LoadingSkeleton height={120} />
          <LoadingSkeleton count={4} height={80} />
        </div>
      )}

      {story && (
        <>
          <StoryHeader story={story} />
          <div style={{ display: "flex", gap: 10, padding: "12px 16px", backgroundColor: "var(--color-surface-bg)", borderBottom: "1px solid var(--color-border)" }}>
            <Link href={`/chat/${story.id}`} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "var(--color-primary)", color: "white", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              💬 Explore Perspectives
            </Link>
            <Link href={`/debate/${story.id}`} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, border: "1.5px solid var(--color-primary)", color: "var(--color-primary)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              ⚖️ Start Debate
            </Link>
          </div>
          <SourceList articles={story.articles} />
        </>
      )}
    </div>
  );
}
