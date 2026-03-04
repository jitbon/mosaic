"use client";

import { useEffect, useRef } from "react";
import { useFeed } from "@/hooks/useFeed";
import FilterButtons from "@/components/feed/FilterButtons";
import StoryCard from "@/components/feed/StoryCard";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorBanner from "@/components/common/ErrorBanner";

export default function FeedPage() {
  const { stories, filter, loading, error, hasMore, changeFilter, loadMore, refresh } =
    useFeed();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    changeFilter("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div>
      {error && <ErrorBanner message={error.message} onRetry={refresh} />}

      <header style={{ padding: "16px 16px 0", backgroundColor: "var(--color-surface-bg)" }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 12px",
            color: "var(--color-text-primary)",
          }}
        >
          Mosaic
        </h1>
      </header>

      <FilterButtons active={filter} onChange={changeFilter} />

      <div style={{ padding: "10px 12px" }}>
        {stories.length === 0 && !loading && !error && (
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              marginTop: 60,
              fontSize: 15,
            }}
          >
            No stories yet. Check back soon!
          </p>
        )}

        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}

        {loading && <LoadingSkeleton count={3} height={120} />}

        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
