"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { timeAgo } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  updatedAt: string;
  lastPlayedAt: string | null;
  _count: { characters: number; sessions: number };
  members: { role: string; user: { id: string; displayName: string | null; name: string | null } }[];
}

interface Character {
  id: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  avatarUrl: string | null;
  conditions: string[];
  campaign: { id: string; name: string; emoji: string | null };
  race: { name: string } | null;
  classes: { level: number; class: { name: string } }[];
}

interface DashboardData {
  ownedCampaigns: Campaign[];
  joinedCampaigns: Campaign[];
  characters: Character[];
}

interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, size = 40, className = "" }: {
  src?: string | null; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-tan/30 border-2 border-sketch rounded-sketch text-2xl ${className}`}
        style={{ width: size, height: size }}
      >
        👤
      </div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setError(true)}
      className={`object-cover rounded-sketch ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── Create Campaign Modal ─────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  "⚔️", "🐉", "🏰", "🗡️", "🛡️", "🧙", "🧝", "🧛", "🗺️", "🌋",
  "🏔️", "🌊", "🔮", "📜", "💀", "🪄", "🎲", "⚗️", "🌙", "🔥",
];

function CreateCampaignModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚔️");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return setError("Campaign name is required");
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const campaign = await res.json();
      onCreated();
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sketch">
          <h2 className="font-display text-2xl text-ink">New Campaign</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:text-ink hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-blush/10 border border-blush/30 rounded-input px-3 py-2">
              <p className="font-sans text-sm text-blush">✗ {error}</p>
            </div>
          )}

          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Campaign Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`w-9 h-9 text-lg rounded-input border-2 transition-all flex items-center justify-center ${emoji === e ? "border-blush bg-blush/10 shadow-sketch-accent" : "border-sketch bg-parchment hover:border-blush/50"
                    }`}
                >{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">
              Campaign Name <span className="text-blush">*</span>
            </label>
            <input
              type="text" placeholder="e.g. The Sunken City" value={name} autoFocus
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
            />
          </div>

          {name && (
            <div className="bg-parchment border-2 border-sketch rounded-sketch p-3 flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className="font-display text-lg text-ink leading-tight">{name}</p>
                <p className="font-sans text-xs text-ink-faded">Your new campaign</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch px-4 py-2 bg-parchment hover:bg-paper transition-all shadow-sketch">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || loading}
            className={`font-sans font-bold text-sm text-white rounded-sketch px-5 py-2 border-2 transition-all flex items-center gap-2 ${name.trim() && !loading ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px" : "bg-tan border-sketch opacity-50 cursor-not-allowed"
              }`}
          >
            {loading ? (<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>) : "Begin the Quest ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, isOwner }: { campaign: Campaign; isOwner: boolean }) {
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="group relative bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 cursor-pointer overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sketch to-transparent opacity-60" />

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-parchment border-2 border-sketch rounded-sketch flex items-center justify-center text-xl shrink-0 group-hover:border-blush/40 transition-colors shadow-sketch-sm">
            {campaign.emoji ?? "⚔️"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-lg text-ink leading-tight">{campaign.name}</p>
              <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${isOwner ? "bg-blush/10 text-blush border-blush/30" : "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30"
                }`}>
                {isOwner ? "DM" : "Player"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="font-sans text-xs text-ink-faded">{campaign._count.characters} adventurer{campaign._count.characters !== 1 ? "s" : ""}</span>
              <span className="text-sketch">·</span>
              <span className="font-sans text-xs text-ink-faded">{campaign._count.sessions} session{campaign._count.sessions !== 1 ? "s" : ""}</span>
              <span className="text-sketch">·</span>
              <span className="font-sans text-xs text-ink-faded">{timeAgo(campaign.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Character Card ────────────────────────────────────────────────────────────

function CharacterCard({ character }: { character: Character }) {
  const primaryClass = character.classes?.[0];
  const hpPercent = Math.round((character.currentHp / character.maxHp) * 100);
  const hpColor = hpPercent > 60 ? "bg-sage" : hpPercent > 30 ? "bg-gold" : "bg-blush";
  const hasConditions = character.conditions?.length > 0;

  return (
    <Link href={`/characters/${character.id}`}>
      <div className="group bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Portrait medallion */}
          <div className="shrink-0 relative">
            <Avatar
              src={character.avatarUrl}
              size={44}
              className="rounded-sketch border-2 border-sketch group-hover:border-blush/40 transition-colors"
            />
            {/* Level badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-ink border border-ink rounded-full flex items-center justify-center">
              <span className="font-mono text-[0.5rem] font-bold text-warm-white leading-none">{character.level}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-lg text-ink leading-tight truncate">{character.name}</p>
            <p className="font-sans text-xs text-ink-faded mt-0.5 truncate">
              {character.race?.name ?? "Unknown"}{primaryClass ? ` · ${primaryClass.class.name}` : ""}
            </p>

            {/* HP bar */}
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
                <span className="font-mono text-[0.6rem] text-ink-faded">{character.currentHp}/{character.maxHp}</span>
              </div>
              <div className="h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${hpColor}`} style={{ width: `${hpPercent}%` }} />
              </div>
            </div>

            {/* Active conditions */}
            {hasConditions && (
              <div className="flex flex-wrap gap-1 mt-2">
                {character.conditions.slice(0, 3).map((c) => (
                  <span key={c} className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-blush border border-blush/30 bg-blush/5 rounded px-1 py-0.5">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Campaign tag */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-sketch/50">
          <span className="text-xs">{character.campaign.emoji ?? "⚔️"}</span>
          <span className="font-sans text-xs text-ink-faded truncate">{character.campaign.name}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyJournal({ onCreateCampaign }: { onCreateCampaign: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-24 h-24 bg-parchment border-2 border-sketch rounded-sketch shadow-sketch flex items-center justify-center text-5xl mb-6">
        📖
      </div>
      <h2 className="font-display text-3xl text-ink mb-2">Your journal is empty</h2>
      <p className="font-sans text-sm text-ink-faded max-w-xs leading-relaxed mb-6">
        Every great quest needs a first entry. Create your first campaign to begin the adventure.
      </p>
      <button
        onClick={onCreateCampaign}
        className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-6 py-2.5 hover:-translate-x-px hover:-translate-y-px transition-all duration-150"
      >
        Begin the Quest ✦
      </button>
      <p className="font-display text-xs text-ink-faded mt-4 italic">
        "Not all those who wander are lost — but they do need a good map."
      </p>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function ChapterHeader({ title, icon, action }: {
  title: string; icon?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <div className="h-0.5 w-8 bg-blush/40 rounded-full ml-1 self-end mb-1" />
      </div>
      {action}
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  useEffect(() => {
    Promise.all([
      authClient.getSession(),
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ])
      .then(([session, dashData, profileData]) => {
        if (!session?.data?.user) { router.push("/login"); return; }
        setUser({ ...session.data.user, ...profileData });
        setData(dashData);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  const allCampaigns = [
    ...(data?.ownedCampaigns ?? []).map((c) => ({ ...c, isOwner: true })),
    ...(data?.joinedCampaigns ?? []).map((c) => ({ ...c, isOwner: false })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const isEmpty = !loading && allCampaigns.length === 0;

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* ── Top nav ── */}
      <nav className="bg-warm-white border-b-2 border-sketch px-6 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blush border-2 border-blush-dark rounded-logo shadow-logo flex items-center justify-center text-base">
              ⚔️
            </div>
            <span className="font-display text-2xl text-ink">Nat20</span>
          </div>
          <div className="flex items-center gap-3">
            {!isEmpty && (
              <button onClick={() => setShowNewCampaign(true)}
                className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-4 py-1.5 hover:-translate-x-px hover:-translate-y-px transition-all duration-150"
              >
                + New Campaign
              </button>
            )}
            {user && (
              <button onClick={() => authClient.signOut().then(() => router.push("/login"))}
                className="font-sans text-xs text-ink-faded hover:text-ink transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile card — compact identity row */}
            <Link href="/profile">
              <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-3 flex items-center gap-3 hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 cursor-pointer group">
                {loading ? (
                  <>
                    <Skeleton className="w-9 h-9 rounded-sketch shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 bg-blush/10 border-2 border-sketch rounded-sketch overflow-hidden flex items-center justify-center text-lg shrink-0 group-hover:border-blush/40 transition-colors">
                      {user?.avatarUrl || user?.image
                        ? <img src={user.avatarUrl ?? user.image ?? undefined} className="w-full h-full object-cover" alt="avatar" />
                        : "👤"
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-l font-semibold text-ink truncate">
                        {user?.displayName ?? user?.name ?? "Adventurer"}
                      </p>
                    </div>
                    <span className="text-ink-faded text-xs group-hover:text-blush transition-colors shrink-0">→</span>
                  </>
                )}
              </div>
            </Link>

            {/* Quick actions */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 space-y-2">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                Quick Actions
              </p>
              <button onClick={() => setShowNewCampaign(true)}
                className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch px-3 py-2 hover:bg-paper hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch flex items-center gap-2"
              >
                <span>🏰</span> New Campaign
              </button>
              <Link href="/profile">
                <button className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch px-3 py-2 hover:bg-paper hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch flex items-center gap-2">
                  <span>👤</span> My Profile
                </button>
              </Link>

              {/* Compact stats */}
              {!loading && (
                <div className="pt-2 mt-1 border-t border-sketch grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="font-mono text-lg font-bold text-ink">{allCampaigns.length}</p>
                    <p className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">Campaigns</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-ink">{data?.characters?.length ?? 0}</p>
                    <p className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">Characters</p>
                  </div>
                </div>
              )}
            </div>

            {/* Last played */}
            {!loading && allCampaigns.length > 0 && (
              <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                  Continue Where You Left Off
                </p>
                <Link href={`/campaigns/${allCampaigns[0].id}`}>
                  <div className="flex items-center gap-2.5 p-2.5 bg-parchment border border-sketch rounded-sketch hover:border-blush/40 transition-colors cursor-pointer">
                    <span className="text-xl">{allCampaigns[0].emoji ?? "⚔️"}</span>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-ink truncate">{allCampaigns[0].name}</p>
                      <p className="font-sans text-xs text-ink-faded">{timeAgo(allCampaigns[0].updatedAt)}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Welcome header */}
            {!loading && user && (
              <div className="border-b-2 border-sketch pl-2 pt-2 pb-5">
                <p className="font-sans text-xs text-ink-faded uppercase tracking-widest mb-1">Welcome back</p>
                <h1 className="font-display text-5xl text-ink leading-none">
                  {user?.displayName ?? user?.name ?? "Adventurer"}
                </h1>
                <p className="font-sans text-sm text-ink-faded mt-2">
                  {allCampaigns.length === 0
                    ? "Your journal awaits its first entry."
                    : `${allCampaigns.length} active campaign${allCampaigns.length !== 1 ? "s" : ""} · ${data?.characters.length ?? 0} character${(data?.characters.length ?? 0) !== 1 ? "s" : ""}`
                  }
                </p>
              </div>
            )}

            {/* Empty state */}
            {isEmpty && (
              <EmptyJournal onCreateCampaign={() => setShowNewCampaign(true)} />
            )}

            {/* Campaigns */}
            {!isEmpty && (
              <div>
                <ChapterHeader
                  title="Campaigns"
                  icon="🏰"
                  action={
                    <button onClick={() => setShowNewCampaign(true)}
                      className="font-sans text-xs text-blush hover:text-ink transition-colors underline decoration-dotted underline-offset-2"
                    >
                      + New
                    </button>
                  }
                />
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allCampaigns.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} isOwner={campaign.isOwner} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Characters */}
            {!isEmpty && (
              <div>
                <ChapterHeader
                  title="Your Characters"
                  icon="🧙"
                />
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
                  </div>
                ) : (data?.characters.length ?? 0) === 0 ? (
                  <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-6 text-center">
                    <p className="text-3xl mb-2">🧙</p>
                    <p className="font-display text-lg text-ink">No characters yet</p>
                    <p className="font-sans text-xs text-ink-faded mt-1">
                      Head into a campaign to create your first character.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data?.characters.map((character) => (
                      <CharacterCard key={character.id} character={character} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewCampaign && (
        <CreateCampaignModal
          onClose={() => setShowNewCampaign(false)}
          onCreated={() => setShowNewCampaign(false)}
        />
      )}
    </div>
  );
}