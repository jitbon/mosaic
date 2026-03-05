"use client";

interface TypingIndicatorProps {
  label?: string;
}

export default function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div style={{ margin: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
      {label && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      )}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-border)",
          fontSize: 14,
          color: "var(--color-text-muted)",
          display: "inline-flex",
          gap: 4,
        }}
      >
        <span style={{ animation: "blink 1s step-end infinite" }}>●</span>
        <span style={{ animation: "blink 1s step-end 0.33s infinite" }}>●</span>
        <span style={{ animation: "blink 1s step-end 0.66s infinite" }}>●</span>
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    </div>
  );
}
