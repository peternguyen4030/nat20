"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    avatarUrl: string | null;
  };
}

interface Character {
  id: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  avatarUrl: string | null;
  conditions: string[];
  race: { name: string } | null;
  classes: { level: number; class: { name: string } }[];
  user: { id: string; displayName: string | null; name: string | null };
}

interface Session {
  id: string;
  active: boolean;
  round: number;
  createdAt: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  bannerUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; displayName: string | null };
  members: Member[];
  characters: Character[];
  sessions: Session[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function Avatar({ src, size = 36, className = "" }: {
  src?: string | null; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-tan/30 border-2 border-sketch rounded-sketch text-lg ${className}`}
        style={{ width: size, height: size }}>
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

// ── Edit Campaign Modal (DM only) ─────────────────────────────────────────────

const EMOJI_OPTIONS = [
  "⚔️", "🐉", "🏰", "🗡️", "🛡️", "🧙", "🧝", "🧛", "🗺️", "🌋",
  "🏔️", "🌊", "🔮", "📜", "💀", "🪄", "🎲", "⚗️", "🌙", "🔥",
];

function EditCampaignModal({ campaign, onClose, onSaved }: {
  campaign: CampaignDetail;
  onClose: () => void;
  onSaved: (updated: Partial<CampaignDetail>) => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [emoji, setEmoji] = useState(campaign.emoji ?? "⚔️");
  const [description, setDescription] = useState(campaign.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return setError("Name is required");
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji, description }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      onSaved({ name, emoji, description });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-sketch">
          <h2 className="font-display text-2xl text-ink">Edit Campaign</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="bg-blush/10 border border-blush/30 rounded-input px-3 py-2"><p className="font-sans text-sm text-blush">✗ {error}</p></div>}
          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={`w-9 h-9 text-lg rounded-input border-2 transition-all flex items-center justify-center ${emoji === e ? "border-blush bg-blush/10" : "border-sketch bg-parchment hover:border-blush/50"}`}
                >{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors"
            />
          </div>
          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this campaign about?"
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors resize-none placeholder:text-ink-faded"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch px-4 py-2 bg-parchment hover:bg-paper shadow-sketch transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className={`font-sans font-bold text-sm text-white rounded-sketch px-5 py-2 border-2 transition-all flex items-center gap-2 ${saving ? "bg-tan border-sketch opacity-60 cursor-not-allowed" : "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"}`}>
            {saving ? "Saving..." : "Save Changes ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Character Card ────────────────────────────────────────────────────────────

function CharacterCard({ character, currentUserId, isDM }: {
  character: Character; currentUserId: string; isDM: boolean;
}) {
  const primaryClass = character.classes?.[0];
  const hpPercent = Math.round((character.currentHp / character.maxHp) * 100);
  const hpColor = hpPercent > 60 ? "bg-sage" : hpPercent > 30 ? "bg-[#D4A853]" : "bg-blush";
  const isMyChar = character.user.id === currentUserId;

  return (
    <Link href={`/characters/${character.id}`}>
      <div className={`group bg-warm-white border-2 rounded-sketch shadow-sketch p-4 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 cursor-pointer ${isMyChar ? "border-blush/30 bg-blush/5" : "border-sketch hover:border-blush/40"
        }`}>
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar src={character.avatarUrl} size={44}
              className={`border-2 ${isMyChar ? "border-blush/40" : "border-sketch group-hover:border-blush/30"} transition-colors`}
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-ink border border-ink rounded-full flex items-center justify-center">
              <span className="font-mono text-[0.5rem] font-bold text-warm-white">{character.level}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-base text-ink leading-tight">{character.name}</p>
              {isMyChar && (
                <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider bg-blush/10 text-blush border border-blush/30 rounded px-1.5 py-0.5">Yours</span>
              )}
            </div>
            <p className="font-sans text-xs text-ink-faded mt-0.5">
              {character.race?.name ?? "Unknown"}{primaryClass ? ` · ${primaryClass.class.name}` : ""}
            </p>
            {!isMyChar && (
              <p className="font-sans text-xs text-ink-faded/70 mt-0.5">
                {character.user.displayName ?? character.user.name ?? "Player"}
              </p>
            )}
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
                <span className="font-mono text-[0.6rem] text-ink-faded">{character.currentHp}/{character.maxHp}</span>
              </div>
              <div className="h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${hpColor}`} style={{ width: `${hpPercent}%` }} />
              </div>
            </div>
            {(character.conditions?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {character.conditions.slice(0, 2).map((c) => (
                  <span key={c} className="font-sans text-[0.5rem] font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded px-1 py-0.5">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── DM View ───────────────────────────────────────────────────────────────────

function DMView({ campaign, currentUserId, onEdit, onRefresh }: {
  campaign: CampaignDetail; currentUserId: string;
  onEdit: () => void; onRefresh: () => void;
}) {
  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the campaign?")) return;
    await fetch(`/api/campaigns/${campaign.id}/members/${userId}`, { method: "DELETE" });
    onRefresh();
  }

  async function promoteMember(userId: string) {
    if (!confirm("Promote this player to DM?")) return;
    await fetch(`/api/campaigns/${campaign.id}/members/${userId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "DM" }),
    });
    onRefresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left: characters ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Party</h2>
          <Link href={`/characters/create?campaignId=${campaign.id}`}>
            <span className="font-sans text-xs text-blush underline decoration-dotted underline-offset-2 hover:text-ink transition-colors">+ Add Character</span>
          </Link>
        </div>

        {campaign.characters.length === 0 ? (
          <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-8 text-center">
            <p className="text-3xl mb-2">🧙</p>
            <p className="font-display text-lg text-ink">No characters yet</p>
            <p className="font-sans text-xs text-ink-faded mt-1 mb-4">Invite players to join and create their characters.</p>
            <Link href={`/characters/create?campaignId=${campaign.id}`}>
              <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-4 py-2 hover:-translate-x-px hover:-translate-y-px transition-all">
                Create a Character ✦
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campaign.characters.map((character) => (
              <CharacterCard key={character.id} character={character} currentUserId={currentUserId} isDM={true} />
            ))}
          </div>
        )}

        {/* Session history */}
        {campaign.sessions.length > 0 && (
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Session History</p>
            <div className="space-y-2">
              {campaign.sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${session.active ? "bg-sage" : "bg-sketch"}`} />
                  <p className="font-sans text-xs text-ink-soft">Round {session.round} · {timeAgo(session.createdAt)}</p>
                  {session.active && <span className="font-sans text-[0.6rem] text-sage border border-sage/30 rounded px-1 ml-auto">Active</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: members + stats ── */}
      <div className="space-y-4">

        {/* Campaign stats */}
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Campaign Stats</p>
          {[
            { label: "Characters", value: campaign.characters.length },
            { label: "Members", value: campaign.members.length },
            { label: "Sessions", value: campaign.sessions.length },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between py-1.5 border-b border-sketch/50 last:border-0">
              <span className="font-sans text-xs text-ink-faded">{stat.label}</span>
              <span className="font-mono text-sm font-bold text-ink">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Member management */}
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Members</p>
          <div className="space-y-2">
            {campaign.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar src={member.user.avatarUrl ?? member.user.image} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-ink truncate">{member.user.displayName ?? member.user.name ?? "Player"}</p>
                </div>
                <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${member.role === "DM" ? "bg-blush/10 text-blush border-blush/30" : "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30"
                  }`}>{member.role}</span>
                {/* DM management controls — don't show for self */}
                {member.user.id !== currentUserId && (
                  <div className="flex gap-1 shrink-0">
                    {member.role === "PLAYER" && (
                      <button onClick={() => promoteMember(member.user.id)} title="Promote to DM"
                        className="w-6 h-6 rounded border border-sketch text-ink-faded hover:text-[#D4A853] hover:border-[#D4A853]/40 transition-all flex items-center justify-center text-xs">
                        ↑
                      </button>
                    )}
                    <button onClick={() => removeMember(member.user.id)} title="Remove member"
                      className="w-6 h-6 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DM tools */}
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 space-y-2">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">DM Tools</p>
          <button onClick={onEdit}
            className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch px-3 py-2 hover:bg-paper hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch flex items-center gap-2">
            <span>✏️</span> Edit Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Player View ───────────────────────────────────────────────────────────────

function PlayerView({ campaign, currentUserId }: {
  campaign: CampaignDetail; currentUserId: string;
}) {
  const myCharacters = campaign.characters.filter((c) => c.user.id === currentUserId);
  const partyCharacters = campaign.characters.filter((c) => c.user.id !== currentUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left: my characters + party ── */}
      <div className="lg:col-span-2 space-y-6">

        {/* My characters */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-ink">My Characters</h2>
            <Link href={`/characters/create?campaignId=${campaign.id}`}>
              <span className="font-sans text-xs text-blush underline decoration-dotted underline-offset-2 hover:text-ink transition-colors">+ New Character</span>
            </Link>
          </div>

          {myCharacters.length === 0 ? (
            <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-8 text-center">
              <p className="text-3xl mb-2">🧙</p>
              <p className="font-display text-lg text-ink">You haven't created a character yet</p>
              <p className="font-sans text-xs text-ink-faded mt-1 mb-4">Create a character to join the adventure.</p>
              <Link href={`/characters/create?campaignId=${campaign.id}`}>
                <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-4 py-2 hover:-translate-x-px hover:-translate-y-px transition-all">
                  Create a Character ✦
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} currentUserId={currentUserId} isDM={false} />
              ))}
            </div>
          )}
        </div>

        {/* Party members */}
        {partyCharacters.length > 0 && (
          <div>
            <h2 className="font-display text-xl text-ink mb-3">The Party</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partyCharacters.map((character) => (
                <CharacterCard key={character.id} character={character} currentUserId={currentUserId} isDM={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: campaign info + members ── */}
      <div className="space-y-4">

        {/* Campaign info */}
        {campaign.description && (
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">About This Campaign</p>
            <p className="font-sans text-sm text-ink-soft leading-relaxed">{campaign.description}</p>
          </div>
        )}

        {/* Party roster */}
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Party Roster</p>
          <div className="space-y-2">
            {campaign.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar src={member.user.avatarUrl ?? member.user.image} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-ink truncate">
                    {member.user.displayName ?? member.user.name ?? "Player"}
                    {member.user.id === currentUserId && <span className="text-ink-faded ml-1">(you)</span>}
                  </p>
                </div>
                <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${member.role === "DM" ? "bg-blush/10 text-blush border-blush/30" : "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30"
                  }`}>{member.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session history */}
        {campaign.sessions.length > 0 && (
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">Sessions</p>
            <div className="space-y-2">
              {campaign.sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${session.active ? "bg-sage" : "bg-sketch"}`} />
                  <p className="font-sans text-xs text-ink-soft">Round {session.round} · {timeAgo(session.createdAt)}</p>
                  {session.active && <span className="font-sans text-[0.6rem] text-sage border border-sage/30 rounded px-1 ml-auto">Active</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  async function loadData() {
    const [sessionRes, campaignRes, profileRes] = await Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}`).then((r) => {
        if (!r.ok) throw new Error("Campaign not found");
        return r.json();
      }),
      fetch("/api/profile").then((r) => r.ok ? r.json() : {}),
    ]);
    if (!sessionRes?.data?.user) { router.push("/login"); return; }
    setCurrentUser({ ...sessionRes.data.user, ...profileRes });
    setCampaign(campaignRes);
  }

  useEffect(() => {
    loadData()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (error) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-ink mb-2">Campaign not found</p>
        <Link href="/dashboard" className="font-sans text-sm text-blush underline">Back to dashboard</Link>
      </div>
    </div>
  );

  // Determine role from CampaignMember.role
  const myMembership = campaign?.members.find((m) => m.user.id === currentUser?.id);
  const isDM = myMembership?.role === "DM";

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch px-6 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">← Dashboard</Link>
          <span className="text-sketch">/</span>
          {loading ? <Skeleton className="h-4 w-32" /> : (
            <span className="font-display text-lg text-ink">{campaign?.emoji} {campaign?.name}</span>
          )}
          {isDM && !loading && (
            <span className="font-sans text-[0.6rem] font-bold uppercase tracking-wider bg-blush/10 text-blush border border-blush/30 rounded px-1.5 py-0.5 ml-1">DM</span>
          )}
        </div>
      </nav>

      {/* Header band */}
      <div className="bg-warm-white border-b-2 border-sketch">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : campaign && (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch flex items-center justify-center text-3xl">
                  {campaign.emoji ?? "⚔️"}
                </div>
                <div>
                  <h1 className="font-display text-4xl text-ink">{campaign.name}</h1>
                  <p className="font-sans text-sm text-ink-faded mt-0.5">
                    DM: {campaign.owner.displayName ?? campaign.owner.name} · Created {timeAgo(campaign.createdAt)}
                  </p>
                  {campaign.description && (
                    <p className="font-sans text-sm text-ink-soft mt-1 max-w-lg leading-relaxed">{campaign.description}</p>
                  )}
                </div>
              </div>

              {/* Primary CTA */}
              <Link href={`/characters/create?campaignId=${campaign.id}`}>
                <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-5 py-2.5 hover:-translate-x-px hover:-translate-y-px transition-all flex items-center gap-2">
                  🧙 {isDM ? "Add Character" : "Create Character"}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
        ) : campaign && currentUser && (
          isDM
            ? <DMView campaign={campaign} currentUserId={currentUser.id} onEdit={() => setShowEdit(true)} onRefresh={() => { setLoading(true); loadData().finally(() => setLoading(false)); }} />
            : <PlayerView campaign={campaign} currentUserId={currentUser.id} />
        )}
      </div>

      {/* Edit modal — DM only */}
      {showEdit && campaign && (
        <EditCampaignModal
          campaign={campaign}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setCampaign((prev) => prev ? { ...prev, ...updated } : prev)}
        />
      )}
    </div>
  );
}