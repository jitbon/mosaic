/**
 * Account Deletion Request Page
 *
 * Required for Google Play Data Safety compliance.
 * URL: /account-deletion
 * Register this URL in Google Play Console → App content → Data safety → Deletion link.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function AccountDeletionPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // For logged-in users, direct them to profile page where deletion is available
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Request Received</h1>
        <p style={{ color: "#aaa", marginBottom: 16 }}>
          If you have an account with <strong>{email}</strong>, you can delete it by signing in
          and visiting your profile page.
        </p>
        <Link href="/auth/login?next=/profile" style={{ color: "var(--color-center)" }}>
          Sign in to delete my account →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Request Account Deletion</h1>
      <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24 }}>
        To delete your Mosaic account and all associated data, enter your email address below.
        You will be directed to sign in and complete the deletion from your profile page.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 4 }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            background: "var(--color-left)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Request Deletion
        </button>
      </form>

      <p style={{ fontSize: 13, color: "#666", marginTop: 24 }}>
        Already signed in?{" "}
        <Link href="/profile" style={{ color: "var(--color-center)" }}>
          Go to your profile
        </Link>{" "}
        to delete your account directly.
      </p>
    </div>
  );
}
