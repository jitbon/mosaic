"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface GuestStatus {
  is_guest: boolean;
  conversation_count: number;
  conversation_limit: number;
  limit_reached: boolean;
}

export default function TopNav() {
  const { user, isGuest, isAuthenticated, signOut } = useAuth();
  const [guestStatus, setGuestStatus] = useState<GuestStatus | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!isGuest) { setGuestStatus(null); return; }

    async function fetchGuestStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/v1/auth/guest/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setGuestStatus(await res.json());
    }
    fetchGuestStatus();
  }, [isGuest]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "var(--color-app-bg, #0a0a0a)",
        borderBottom: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 100,
      }}
    >
      <Link href="/" style={{ fontWeight: 700, fontSize: 18, color: "#fff", textDecoration: "none" }}>
        Mosaic
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isAuthenticated && (
          <>
            <Link href="/profile" style={navLinkStyle}>Profile</Link>
            <button onClick={signOut} style={btnStyle}>Sign Out</button>
          </>
        )}
        {isGuest && (
          <>
            {guestStatus && (
              <span style={{ fontSize: 12, color: guestStatus.limit_reached ? "var(--color-left)" : "#888" }}>
                {guestStatus.conversation_count}/{guestStatus.conversation_limit} chats used
              </span>
            )}
            {!guestStatus && <span style={{ fontSize: 12, color: "#888" }}>Guest</span>}
            <Link href="/auth/signup" style={{ ...btnStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Sign Up
            </Link>
          </>
        )}
        {!user && (
          <>
            <Link href="/auth/login" style={navLinkStyle}>Sign In</Link>
            <Link
              href="/auth/signup"
              style={{ ...btnStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: "#aaa",
  textDecoration: "none",
  fontSize: 14,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "var(--color-center, #4a90d9)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 600,
};
