import Link from "next/link";
import type { FeedStory } from "@/types/feed";
import BiasBar from "./BiasBar";
import BlindspotBadge from "./BlindspotBadge";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StoryCard({ story }: { story: FeedStory }) {
  return (
    <Link
      href={`/story/${story.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <article
        style={{
          backgroundColor: "var(--color-card-bg)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          border: "1px solid var(--color-border-light)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--color-text-primary)",
              margin: 0,
              flex: 1,
            }}
          >
            {story.headline}
          </h2>
          <time
            dateTime={story.published_at}
            style={{ fontSize: 11, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}
          >
            {timeAgo(story.published_at)}
          </time>
        </div>

        {story.summary && (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "0 0 10px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {story.summary}
          </p>
        )}

        <BiasBar
          leftCount={story.left_count}
          centerCount={story.center_count}
          rightCount={story.right_count}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {story.left_count + story.center_count + story.right_count} sources
          </span>
          {story.is_blindspot && (
            <BlindspotBadge perspective={story.blindspot_perspective} />
          )}
        </div>
      </article>
    </Link>
  );
}
