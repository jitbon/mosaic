"use client";

import type { FeedFilter } from "@/types/feed";

interface FilterButtonsProps {
  active: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "blindspot", label: "Blindspot" },
  { value: "balanced", label: "Balanced" },
];

export default function FilterButtons({ active, onChange }: FilterButtonsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "12px 16px",
        backgroundColor: "var(--color-surface-bg)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            aria-pressed={isActive}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
              backgroundColor: isActive ? "var(--color-primary-light)" : "var(--color-card-bg)",
              color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
