"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

function passwordStrength(pw: string): { label: string; color: string } {
  if (pw.length < 8) return { label: "Too short", color: "#e55" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  if (hasUpper && hasDigit && pw.length >= 12) return { label: "Strong", color: "#5a5" };
  if (hasUpper && hasDigit) return { label: "Good", color: "#a85" };
  return { label: "Weak", color: "#e85" };
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isGuest, user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  async function handleSocialSignup(provider: "google" | "apple" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });

      if (res.status === 409) {
        setError("An account with this email already exists.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail?.message ?? "Registration failed. Please try again.");
        return;
      }

      // Migrate anonymous conversations if user was a guest
      if (isGuest && user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch("/api/v1/auth/migrate-anonymous", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ anonymous_user_id: user.id }),
          }).catch(() => null); // best-effort
        }
      }

      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Check your email</h1>
        <p style={{ color: "#aaa" }}>
          We sent a verification link to <strong>{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/auth/login" style={{ color: "var(--color-center)", marginTop: 24, display: "inline-block" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
          />
        </div>

        {password.length > 0 && (
          <p style={{ fontSize: 12, color: strength.color, marginBottom: 12 }}>
            {strength.label}
          </p>
        )}

        {error && <p style={{ color: "var(--color-left)", marginBottom: 12, fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "..." : "Create Account"}
        </button>
      </form>

      <div style={{ margin: "24px 0", borderTop: "1px solid #333", paddingTop: 24 }}>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Or sign up with</p>
        {(["google", "apple", "facebook"] as const).map((p) => (
          <button key={p} onClick={() => handleSocialSignup(p)} style={{ ...btnStyle, background: "#222", marginBottom: 8 }}>
            Sign up with {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 14 }}>
        Already have an account?{" "}
        <Link href="/auth/login" style={{ color: "var(--color-center)" }}>Sign In</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#111",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#fff",
  fontSize: 14,
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  background: "var(--color-center)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
};
