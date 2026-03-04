interface BlindspotBadgeProps {
  perspective: string | null;
}

const LABELS: Record<string, string> = {
  left: "Left Blindspot",
  center: "Center Blindspot",
  right: "Right Blindspot",
};

const COLORS: Record<string, string> = {
  left: "var(--color-left)",
  center: "var(--color-center)",
  right: "var(--color-right)",
};

export default function BlindspotBadge({ perspective }: BlindspotBadgeProps) {
  if (!perspective) return null;
  const label = LABELS[perspective] ?? `${perspective} Blindspot`;
  const color = COLORS[perspective] ?? "var(--color-text-muted)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color: "white",
        backgroundColor: color,
        letterSpacing: "0.02em",
      }}
    >
      ⚠ {label}
    </span>
  );
}
