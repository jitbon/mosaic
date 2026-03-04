interface LoadingSkeletonProps {
  count?: number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export default function LoadingSkeleton({
  count = 1,
  height = 80,
  borderRadius = 12,
  style,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            height,
            borderRadius,
            backgroundColor: "var(--color-skeleton-base)",
            backgroundImage: `linear-gradient(90deg, var(--color-skeleton-base) 0%, var(--color-skeleton-shine) 50%, var(--color-skeleton-base) 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            marginBottom: 12,
            ...style,
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
