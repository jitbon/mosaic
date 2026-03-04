import type { StoryDetail } from "@/types/story";
import BiasBar from "@/components/feed/BiasBar";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StoryHeader({ story }: { story: StoryDetail }) {
  return (
    <div style={{ padding: "16px 16px 12px", backgroundColor: "var(--color-surface-bg)" }}>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.4,
          color: "var(--color-text-primary)",
          margin: "0 0 8px",
        }}
      >
        {story.headline}
      </h1>
      {story.summary && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 12px",
          }}
        >
          {story.summary}
        </p>
      )}
      <BiasBar
        leftCount={story.left_count}
        centerCount={story.center_count}
        rightCount={story.right_count}
        height={8}
      />
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 8,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}
      >
        <span>{timeAgo(story.published_at)}</span>
        <span>·</span>
        <span style={{ color: "var(--color-left)" }}>L: {story.left_count}</span>
        <span style={{ color: "var(--color-center)" }}>C: {story.center_count}</span>
        <span style={{ color: "var(--color-right)" }}>R: {story.right_count}</span>
      </div>
    </div>
  );
}
