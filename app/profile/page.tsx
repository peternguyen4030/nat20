"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AvatarUpload } from "@/components/AvatarUpload";

interface UserProfile {
  id:          string;
  name:        string | null;
  email:       string;
  displayName: string | null;
  bio:         string | null;
  avatarUrl:   string | null;
  image:       string | null;
  createdAt:   string;
  _count: { characters: number; campaignsOwned: number };
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Editable draft state
  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then((data) => {
        setProfile(data);
        setDisplayName(data.displayName ?? "");
        setBio(data.bio ?? "");
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, []);

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() || null, bio: bio.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = profile?.avatarUrl ?? profile?.image;

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch px-6 py-3 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">
              ← Dashboard
            </Link>
            <span className="text-sketch">/</span>
            <span className="font-display text-lg text-ink">Profile</span>
          </div>
          {saving && (
            <span className="font-sans text-xs text-ink-faded flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-ink-faded border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          )}
          {saved && !saving && (
            <span className="font-sans text-xs text-sage font-semibold">✓ Saved</span>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="border-b-2 border-sketch p-5">
          <h1 className="font-display text-4xl text-ink">Your Profile</h1>
          <p className="font-sans text-sm text-ink-faded mt-1">
            Manage your account details and how you appear to others.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── Left: avatar + stats ── */}
          <div className="space-y-4">

            {/* Avatar */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5 flex flex-col items-center gap-3">
              {loading ? (
                <Skeleton className="w-24 h-24 rounded-sketch" />
              ) : (
                <AvatarUpload
                  currentUrl={displayAvatar}
                  endpoint="userAvatar"
                  size={96}
                  onUploadComplete={(url) => {
                    setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
                    fetch("/api/profile", {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ avatarUrl: url }),
                    });
                  }}
                />
              )}
              <div className="text-center">
                {loading ? (
                  <Skeleton className="h-5 w-32 mx-auto" />
                ) : (
                  <>
                    <p className="font-display text-xl text-ink">
                      {profile?.displayName ?? profile?.name ?? "Adventurer"}
                    </p>
                    <p className="font-sans text-xs text-ink-faded mt-0.5 truncate max-w-[160px]">
                      {profile?.email}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Account Stats</p>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    { label: "Campaigns",   value: profile?._count.campaignsOwned ?? 0 },
                    { label: "Characters",  value: profile?._count.characters ?? 0 },
                    { label: "Member since", value: profile ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-1 border-b border-sketch/50 last:border-0">
                      <span className="font-sans text-xs text-ink-faded">{stat.label}</span>
                      <span className="font-mono text-sm font-bold text-ink">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: editable fields ── */}
          <div className="md:col-span-2 space-y-4">

            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 space-y-5">
              <h2 className="font-display text-xl text-ink">Account Details</h2>

              {/* Display name */}
              <div>
                <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">
                  Display Name
                </label>
                {loading ? <Skeleton className="h-10" /> : (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={profile?.name ?? "Your display name"}
                    maxLength={50}
                    className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
                  />
                )}
                <p className="font-sans text-xs text-ink-faded mt-1">
                  This is how your name appears to other players. Defaults to your account name if blank.
                </p>
              </div>

              {/* Email — read only */}
              <div>
                <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">
                  Email <span className="text-ink-faded font-normal normal-case tracking-normal">(read only)</span>
                </label>
                {loading ? <Skeleton className="h-10" /> : (
                  <input
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                    className="w-full font-sans text-base bg-parchment/50 text-ink-faded border-2 border-sketch/50 rounded-input px-3 py-2.5 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">
                  Bio
                </label>
                {loading ? <Skeleton className="h-24" /> : (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other adventurers a little about yourself..."
                    rows={4}
                    maxLength={280}
                    className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded resize-none leading-relaxed"
                  />
                )}
                <p className="font-sans text-xs text-ink-faded mt-1 text-right">
                  {bio.length}/280
                </p>
              </div>

              {error && (
                <div className="bg-blush/10 border border-blush/30 rounded-input px-3 py-2">
                  <p className="font-sans text-sm text-blush">✗ {error}</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className={`font-sans font-bold text-sm text-white rounded-sketch px-6 py-2.5 border-2 transition-all flex items-center gap-2 ${
                  saving || loading
                    ? "bg-tan border-sketch opacity-60 cursor-not-allowed"
                    : "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                }`}
              >
                {saving ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : "Save Changes ✦"}
              </button>
            </div>

            {/* Danger zone */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6">
              <h2 className="font-display text-xl text-ink mb-1">Danger Zone</h2>
              <p className="font-sans text-xs text-ink-faded mb-4">
                These actions are permanent and cannot be undone.
              </p>
              <button
                onClick={() => authClient.signOut().then(() => router.push("/login"))}
                className="font-sans font-semibold text-sm text-ink-soft border-2 border-sketch rounded-sketch px-4 py-2 bg-parchment hover:bg-paper shadow-sketch transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
