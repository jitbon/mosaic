import type { Article } from "@/types/story";

interface SourceListProps {
  articles: Article[];
}

const SECTION_LABELS: Record<string, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

const SECTION_COLORS: Record<string, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

const SECTION_ORDER = ["left", "center", "right"];

function ArticleItem({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "12px 16px",
        textDecoration: "none",
        color: "inherit",
        borderBottom: "1px solid var(--color-border-light)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {article.source.name}
        </span>
        <span style={{ color: "var(--color-border)", fontSize: 11 }}>↗</span>
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          margin: "0 0 4px",
          lineHeight: 1.4,
        }}
      >
        {article.title}
      </p>
      {article.snippet && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-secondary)",
            margin: 0,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.snippet}
        </p>
      )}
    </a>
  );
}

export default function SourceList({ articles }: SourceListProps) {
  const grouped: Record<string, Article[]> = { left: [], center: [], right: [] };
  for (const a of articles) {
    const key = a.source.bias_rating;
    if (grouped[key]) grouped[key].push(a);
  }

  return (
    <div>
      {SECTION_ORDER.map((bias) => {
        const items = grouped[bias];
        if (!items || items.length === 0) return null;
        return (
          <section key={bias} style={{ marginBottom: 4 }}>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--color-surface-bg)",
                borderLeft: `4px solid ${SECTION_COLORS[bias]}`,
                fontSize: 12,
                fontWeight: 700,
                color: SECTION_COLORS[bias],
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {SECTION_LABELS[bias]} ({items.length})
            </div>
            <div style={{ backgroundColor: "var(--color-card-bg)" }}>
              {items.map((a) => (
                <ArticleItem key={a.id} article={a} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
