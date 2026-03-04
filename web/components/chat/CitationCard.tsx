import type { Citation } from "@/types/chat";

interface CitationCardProps {
  citation: Citation;
}

const BIAS_COLORS: Record<string, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

export default function CitationCard({ citation }: CitationCardProps) {
  return (
    <a
      href={citation.article_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "8px 10px",
        marginTop: 6,
        borderRadius: 8,
        backgroundColor: "var(--color-surface-bg)",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: BIAS_COLORS[citation.bias_label] ?? "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {citation.bias_label}
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>
          {citation.source_name}
        </span>
        <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>↗</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-primary)", margin: "0 0 4px", fontWeight: 500 }}>
        {citation.article_title}
      </p>
      {citation.quoted_text && (
        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0, fontStyle: "italic" }}>
          &ldquo;{citation.quoted_text}&rdquo;
        </p>
      )}
    </a>
  );
}
