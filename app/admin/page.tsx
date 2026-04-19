"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { validatePasswordStrength } from "@/lib/password-validation";

interface AdminUser {
  id: string; name: string | null; displayName: string | null;
  email: string; role: "USER" | "ADMIN"; createdAt: string; image: string | null;
  _count: { campaignsOwned: number; characters: number; memberships: number };
}

interface AdminMember {
  role: string;
  user: { id: string; displayName: string | null; name: string | null; email: string; image: string | null };
}

interface AdminCampaign {
  id: string; name: string; emoji: string | null; createdAt: string;
  owner: { id: string; displayName: string | null; email: string; image: string | null };
  members: AdminMember[];
  _count: { members: number; characters: number };
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function UserAvatar({ src, name, size = 32 }: { src: string | null; name: string | null; size?: number }) {
  const [error, setError] = useState(false);
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  if (!src || error) return (
    <div className="flex items-center justify-center bg-blush/10 border border-sketch rounded-sketch font-sans font-bold text-ink-faded text-xs shrink-0"
      style={{ width: size, height: size }}>
      {initials}
    </div>
  );
  return (
    <img src={src} alt={name ?? ""} onError={() => setError(true)}
      className="rounded-sketch object-cover shrink-0 border border-sketch"
      style={{ width: size, height: size }} />
  );
}

// ── Edit Password Modal ───────────────────────────────────────────────────────

function EditPasswordModal({ user, onClose, onSaved }: {
  user: AdminUser; onClose: () => void; onSaved: () => void;
}) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSave() {
    const strength = validatePasswordStrength(password);
    if (strength) return setError(strength);
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/users/password", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A]">
        <div className="flex items-center justify-between p-5 border-b border-sketch">
          <div>
            <h2 className="font-display text-xl text-ink">Reset Password</h2>
            <p className="font-sans text-xs text-ink-faded mt-0.5">{user.displayName ?? user.name ?? user.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="font-sans text-xs text-blush bg-blush/10 border border-blush/30 rounded p-2">✗ {error}</p>}
          <div>
            <label className="block font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
          </div>
          <div>
            <label className="block font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
          </div>
        </div>
        <div className="p-5 border-t border-sketch flex gap-3 justify-end">
          <button onClick={onClose} className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-parchment hover:bg-paper transition-all shadow-sketch">Cancel</button>
          <button onClick={handleSave} disabled={!password || !confirm || loading}
            className={`font-sans font-bold text-sm text-white rounded-sketch p-2 border-2 transition-all flex items-center gap-2 ${
              password && confirm && !loading ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px" : "bg-tan border-sketch opacity-50 cursor-not-allowed"
            }`}>
            {loading ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : "Save Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Accordion ────────────────────────────────────────────────────────

function CampaignAccordion({ campaign, onDelete }: {
  campaign: AdminCampaign;
  onDelete: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`bg-warm-white border-2 rounded-sketch shadow-sketch transition-all ${open ? "border-blush/40" : "border-sketch"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-center gap-3 text-left">
        <span className="text-xl shrink-0">{campaign.emoji ?? "⚔️"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base text-ink leading-tight truncate">{campaign.name}</p>
          <p className="font-sans text-xs text-ink-faded mt-0.5">
            {campaign._count.members} members · {campaign._count.characters} characters · {timeAgo(campaign.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UserAvatar src={campaign.owner.image} name={campaign.owner.displayName ?? campaign.owner.email} size={24} />
          <span className="font-sans text-[0.6rem] text-ink-faded hidden sm:block truncate max-w-[120px]">
            {campaign.owner.displayName ?? campaign.owner.email}
          </span>
          <span className={`font-sans text-xs text-ink-faded transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-sketch">
          <div className="p-4 space-y-2">
            <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Members</p>
            {campaign.members.length === 0 ? (
              <p className="font-sans text-xs text-ink-faded italic">No members yet.</p>
            ) : (
              campaign.members.map((m) => (
                <div key={m.user.id} className="flex items-center gap-2.5 bg-parchment border border-sketch rounded p-2">
                  <UserAvatar src={m.user.image} name={m.user.displayName ?? m.user.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs font-semibold text-ink truncate">
                      {m.user.displayName ?? m.user.name ?? "Unknown"}
                    </p>
                    <p className="font-sans text-[0.55rem] text-ink-faded truncate">{m.user.email}</p>
                  </div>
                  <span className={`font-sans text-[0.6rem] font-bold uppercase border rounded p-0.5 shrink-0 ${
                    m.role === "DM"
                      ? "text-blush border-blush/30 bg-blush/5"
                      : "text-dusty-blue border-dusty-blue/30 bg-dusty-blue/5"
                  }`}>{m.role}</span>
                </div>
              ))
            )}
          </div>
          <div className="p-4 pt-0 flex gap-2 justify-end border-t border-sketch">
            <Link href={`/campaigns/${campaign.id}`}>
              <button type="button" className="font-sans text-xs text-ink-faded border border-sketch rounded p-1.5 hover:bg-parchment transition-all">
                View Campaign
              </button>
            </Link>
            <button type="button" onClick={() => onDelete(campaign.id, campaign.name)}
              className="font-sans text-xs text-blush border border-blush/20 rounded p-1.5 hover:bg-blush/10 transition-all">
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab,           setTab]           = useState<"users" | "campaigns">("users");
  const [users,         setUsers]         = useState<AdminUser[]>([]);
  const [campaigns,     setCampaigns]     = useState<AdminCampaign[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [actionMsg,     setActionMsg]     = useState<string | null>(null);
  const [userSearch,    setUserSearch]    = useState("");
  const [campSearch,    setCampSearch]    = useState("");
  const [editPwUser,    setEditPwUser]    = useState<AdminUser | null>(null);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await authClient.getSession();
      if (!session?.data?.user) { router.push("/login"); return; }

      const [usersRes, campaignsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/campaigns"),
      ]);

      if (usersRes.status === 401 || campaignsRes.status === 401) {
        router.push("/login");
        return;
      }
      if (usersRes.status === 403 || campaignsRes.status === 403) {
        router.push("/dashboard");
        return;
      }

      if (usersRes.ok) setUsers(await usersRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());

      if (!usersRes.ok || !campaignsRes.ok) {
        const failed = !usersRes.ok ? usersRes : campaignsRes;
        let msg = "Failed to load admin data";
        try {
          const body = (await failed.json()) as { error?: string };
          if (body?.error) msg = body.error;
          else msg = `${msg} (${failed.status})`;
        } catch {
          msg = `${msg} (${failed.status})`;
        }
        setError(msg);
      }
    } catch {
      setError("Failed to load admin data (network or unexpected error)");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function updateRole(userId: string, role: "USER" | "ADMIN") {
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      flash(`Role updated to ${role}`);
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This will remove all their data.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) { setUsers((prev) => prev.filter((u) => u.id !== userId)); flash("User deleted"); }
  }

  async function deleteCampaign(campaignId: string, name: string) {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/campaigns", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    if (res.ok) { setCampaigns((prev) => prev.filter((c) => c.id !== campaignId)); flash("Campaign deleted"); }
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return !q || (u.email + (u.displayName ?? "") + (u.name ?? "")).toLowerCase().includes(q);
  });

  const filteredCampaigns = campaigns.filter((c) => {
    const q = campSearch.toLowerCase();
    return !q || (c.name + (c.owner.displayName ?? "") + (c.owner.email)).toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">
      <nav className="bg-warm-white border-b-2 border-sketch p-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">← Dashboard</Link>
          <span className="text-sketch">/</span>
          <span className="font-display text-lg text-ink">⚙️ Admin</span>
          <span className="font-sans text-xs text-blush border border-blush/30 bg-blush/5 rounded p-1 font-bold uppercase ml-auto">Admin</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Users",     value: users.length },
              { label: "Total Campaigns", value: campaigns.length },
            ].map((s) => (
              <div key={s.label} className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 text-center">
                <p className="font-mono text-3xl font-bold text-ink">{s.value}</p>
                <p className="font-sans text-xs text-ink-faded uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {actionMsg && (
          <div className="bg-sage/10 border border-sage/30 rounded-sketch p-3">
            <p className="font-sans text-sm text-sage font-semibold">✓ {actionMsg}</p>
          </div>
        )}
        {error && (
          <div className="bg-blush/10 border border-blush/30 rounded-sketch p-3">
            <p className="font-sans text-sm text-blush">✗ {error}</p>
          </div>
        )}

        <div className="flex border-b-2 border-sketch">
          {(["users", "campaigns"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`font-sans font-semibold text-sm p-3 transition-colors capitalize ${
                tab === t ? "text-ink border-b-2 border-blush bg-parchment" : "text-ink-faded hover:text-ink"
              }`}>
              {t === "users" ? `👤 Users (${users.length})` : `⚔️ Campaigns (${campaigns.length})`}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="space-y-3">
            <input
              type="search" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full font-sans text-sm bg-warm-white text-ink border-2 border-sketch rounded-sketch p-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
            />
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />) :
              filteredUsers.length === 0 ? (
                <p className="font-sans text-sm text-ink-faded text-center py-8">No users found.</p>
              ) :
              filteredUsers.map((user) => (
                <div key={user.id} className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <UserAvatar src={user.image} name={user.displayName ?? user.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display text-base text-ink">{user.displayName ?? user.name ?? "—"}</p>
                        <span className={`font-sans text-[0.6rem] font-bold uppercase border rounded p-0.5 ${
                          user.role === "ADMIN" ? "text-blush border-blush/30 bg-blush/5" : "text-ink-faded border-sketch"
                        }`}>{user.role}</span>
                      </div>
                      <p className="font-sans text-xs text-ink-faded">{user.email}</p>
                      <p className="font-sans text-[0.6rem] text-ink-faded mt-1">
                        {user._count.campaignsOwned} campaigns owned · {user._count.characters} characters · {user._count.memberships} memberships · joined {timeAgo(user.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button type="button" onClick={() => setEditPwUser(user)}
                        className="font-sans text-xs text-ink-faded border border-sketch rounded p-1.5 hover:bg-parchment hover:border-blush/40 transition-all">
                        🔑 Password
                      </button>
                      {user.role === "USER" ? (
                        <button type="button" onClick={() => updateRole(user.id, "ADMIN")}
                          className="font-sans text-xs text-blush border border-blush/30 rounded p-1.5 hover:bg-blush/10 transition-all">
                          Make Admin
                        </button>
                      ) : (
                        <button type="button" onClick={() => updateRole(user.id, "USER")}
                          className="font-sans text-xs text-ink-faded border border-sketch rounded p-1.5 hover:bg-parchment transition-all">
                          Remove Admin
                        </button>
                      )}
                      <button type="button" onClick={() => deleteUser(user.id, user.email)}
                        className="font-sans text-xs text-blush border border-blush/20 rounded p-1.5 hover:bg-blush/10 transition-all">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "campaigns" && (
          <div className="space-y-3">
            <input
              type="search" value={campSearch} onChange={(e) => setCampSearch(e.target.value)}
              placeholder="Search by campaign or owner name..."
              className="w-full font-sans text-sm bg-warm-white text-ink border-2 border-sketch rounded-sketch p-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
            />
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />) :
              filteredCampaigns.length === 0 ? (
                <p className="font-sans text-sm text-ink-faded text-center py-8">No campaigns found.</p>
              ) :
              filteredCampaigns.map((c) => (
                <CampaignAccordion key={c.id} campaign={c} onDelete={deleteCampaign} />
              ))
            }
          </div>
        )}
      </div>

      {editPwUser && (
        <EditPasswordModal
          user={editPwUser}
          onClose={() => setEditPwUser(null)}
          onSaved={() => flash("Password updated")}
        />
      )}
    </div>
  );
}
