"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  user_id: string;
  email: string;
  display_name: string;
  email_verified: boolean;
  preferences: { default_perspective: string | null; notification_prefs: Record<string, unknown> };
  linked_providers: string[];
  created_at: string;
  last_login_at: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [perspective, setPerspective] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth/login?next=/profile"); return; }

      const res = await fetch("/api/v1/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setError("Failed to load profile"); return; }
      const data: Profile = await res.json();
      setProfile(data);
      setDisplayName(data.display_name);
      setPerspective(data.preferences.default_perspective ?? "");
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ display_name: displayName, preferences: { default_perspective: perspective || null } }),
    });
    setSaving(false);
    if (res.ok) setSaveMsg("Saved!");
    else setSaveMsg("Save failed.");
  }

  async function handleExport() {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/v1/profile/export", {
      method: "POST",
      headers: { Authorization: `Bearer ${session!.access_token}` },
    });
    if (!res.ok) { alert("Export failed."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-data.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/v1/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ confirm: true }),
    });
    setDeleting(false);
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/?deleted=1");
    } else {
      alert("Deletion failed. Please try again.");
    }
  }

  if (error) return <div style={{ padding: 32, color: "var(--color-left)" }}>{error}</div>;
  if (!profile) return <div style={{ padding: 32, color: "#888" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 560, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Your Profile</h1>

      <form onSubmit={handleSave}>
        <section style={sectionStyle}>
          <h2 style={h2Style}>Account</h2>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>{profile.email}</p>

          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>Default Perspective</label>
          <select value={perspective} onChange={(e) => setPerspective(e.target.value)} style={inputStyle}>
            <option value="">No preference</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>

          {saveMsg && <p style={{ color: saveMsg === "Saved!" ? "#5a5" : "var(--color-left)", marginTop: 8, fontSize: 14 }}>{saveMsg}</p>}

          <button type="submit" disabled={saving} style={{ ...btnStyle, marginTop: 16 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </section>
      </form>

      {profile.linked_providers.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={h2Style}>Linked Accounts</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {profile.linked_providers.map((p) => (
              <span key={p} style={{ background: "#222", padding: "4px 10px", borderRadius: 4, fontSize: 13 }}>
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      <section style={sectionStyle}>
        <h2 style={h2Style}>Data & Privacy</h2>
        <button onClick={handleExport} style={{ ...btnStyle, background: "#222", marginBottom: 12 }}>
          Export My Data
        </button>
        <p style={{ fontSize: 13, color: "#888" }}>
          Downloads a ZIP of your profile, conversations, and debate history.
        </p>
      </section>

      <section style={{ ...sectionStyle, borderColor: "#5a1a1a" }}>
        <h2 style={{ ...h2Style, color: "var(--color-left)" }}>Danger Zone</h2>
        <button onClick={() => setShowDeleteModal(true)} style={{ ...btnStyle, background: "var(--color-left)" }}>
          Delete Account
        </button>
        <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
          This will permanently delete your account and all private data within 30 days.
        </p>
      </section>

      {showDeleteModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginBottom: 12 }}>Delete your account?</h2>
            <p style={{ color: "#aaa", marginBottom: 24, fontSize: 14 }}>
              Your account will be scheduled for deletion. Chat history will be removed.
              Debate contributions will be anonymized. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleDelete} disabled={deleting} style={{ ...btnStyle, background: "var(--color-left)", flex: 1 }}>
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button onClick={() => setShowDeleteModal(false)} style={{ ...btnStyle, background: "#333", flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #222",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
};

const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, color: "#aaa", marginBottom: 4 };

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
  padding: "10px 20px",
  background: "var(--color-center)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 600,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
};

const modalStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: 10,
  padding: 28,
  maxWidth: 440,
  width: "90%",
};
