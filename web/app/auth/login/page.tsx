"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Invalid email or password.");
      } else {
        router.push(next);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setMessage("If an account exists, a reset link has been sent.");
      setForgotMode(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setLoading(true);
    try {
      await supabase.auth.signInAnonymously();
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "apple" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        {forgotMode ? "Reset Password" : "Sign In"}
      </h1>

      {message && (
        <p style={{ color: "var(--color-center)", marginBottom: 16 }}>{message}</p>
      )}

      <form onSubmit={forgotMode ? handleForgotPassword : handleLogin}>
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

        {!forgotMode && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
        )}

        {error && <p style={{ color: "var(--color-left)", marginBottom: 12, fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "..." : forgotMode ? "Send Reset Link" : "Sign In"}
        </button>
      </form>

      {!forgotMode && (
        <button
          onClick={() => { setForgotMode(true); setError(null); }}
          style={{ ...linkBtnStyle, marginTop: 8 }}
        >
          Forgot password?
        </button>
      )}
      {forgotMode && (
        <button onClick={() => setForgotMode(false)} style={{ ...linkBtnStyle, marginTop: 8 }}>
          Back to sign in
        </button>
      )}

      <div style={{ margin: "24px 0", borderTop: "1px solid #333", paddingTop: 24 }}>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Or continue with</p>
        {(["google", "apple", "facebook"] as const).map((p) => (
          <button key={p} onClick={() => handleSocialLogin(p)} style={{ ...btnStyle, background: "#222", marginBottom: 8 }}>
            Sign in with {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={handleGuest} style={{ ...linkBtnStyle, display: "block", marginTop: 12 }}>
          Continue as Guest
        </button>
      </div>

      <p style={{ fontSize: 14, marginTop: 16 }}>
        No account?{" "}
        <Link href="/auth/signup" style={{ color: "var(--color-center)" }}>Sign Up</Link>
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

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-center)",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
  textDecoration: "underline",
};
