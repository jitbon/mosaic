interface BiasBarProps {
  leftCount: number;
  centerCount: number;
  rightCount: number;
  height?: number;
}

export default function BiasBar({
  leftCount,
  centerCount,
  rightCount,
  height = 6,
}: BiasBarProps) {
  const total = leftCount + centerCount + rightCount;
  if (total === 0) return null;

  const MIN_PCT = 5;

  function pct(count: number) {
    const raw = (count / total) * 100;
    return count > 0 ? Math.max(raw, MIN_PCT) : 0;
  }

  const lp = pct(leftCount);
  const cp = pct(centerCount);
  const rp = pct(rightCount);
  const sum = lp + cp + rp;
  const scale = 100 / sum;

  return (
    <div
      aria-label={`Coverage: ${leftCount} left, ${centerCount} center, ${rightCount} right`}
      style={{
        display: "flex",
        height,
        borderRadius: height / 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {leftCount > 0 && (
        <div style={{ flex: lp * scale, backgroundColor: "var(--color-left)" }} />
      )}
      {centerCount > 0 && (
        <div style={{ flex: cp * scale, backgroundColor: "var(--color-center)" }} />
      )}
      {rightCount > 0 && (
        <div style={{ flex: rp * scale, backgroundColor: "var(--color-right)" }} />
      )}
    </div>
  );
}
