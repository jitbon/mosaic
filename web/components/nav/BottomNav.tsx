"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Feed", icon: "📰", match: null },
  { href: "/history?tab=chats", label: "Chats", icon: "💬", match: "/history" },
  { href: "/history?tab=debates", label: "Debates", icon: "⚖️", match: "/history" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        backgroundColor: "var(--color-card-bg)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.match
          ? pathname.startsWith(tab.match)
          : pathname === "/";
        return (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textDecoration: "none",
              color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
              fontWeight: isActive ? 600 : 400,
              fontSize: 11,
              transition: "color 0.15s",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
