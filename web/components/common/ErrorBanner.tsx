"use client";

import { useState } from "react";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message = "Unable to connect to the server.",
  onRetry,
}: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--color-error-bg)",
        color: "var(--color-error-text)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        borderBottom: "1px solid #f5c2c2",
      }}
    >
      <span style={{ flex: 1 }}>⚠️ {message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--color-error-text)",
            backgroundColor: "transparent",
            color: "var(--color-error-text)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Retry
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "var(--color-error-text)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "0 4px",
        }}
      >
        ×
      </button>
    </div>
  );
}
