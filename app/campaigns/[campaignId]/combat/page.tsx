"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { DeleteModal } from "@/components/DeleteModal";

interface CampaignDetail {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string | null; displayName: string | null };
  members: {
    id: string;
    role: string;
    user: { id: string; name: string | null; displayName: string | null; image: string | null };
  }[];
  characters: {
    id: string;
    name: string;
    level: number;
    currentHp: number;
    maxHp: number;
    race: { name: string } | null;
    classes: { level: number; class: { name: string } }[];
    user: { id: string; displayName: string | null; name: string | null };
  }[];
  sessions: { id: string; active: boolean; round: number; createdAt: string }[];
}

interface SessionUser {
  id: string;
  name?: string | null;
  displayName?: string | null;
  image?: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

export default function CampaignPage() {
  const params            = useParams();
  const router            = useRouter();
  const campaignId        = params.campaignId as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [currentUser, setCurrentUser]     = useState<SessionUser | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [showDelete, setShowDelete]       = useState(false);

  useEffect(() => {
    Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}`).then((r) => {
        if (!r.ok) throw new Error("Campaign not found");
        return r.json();
      }),
    ])
      .then(([session, data]) => {
        if (!session?.data?.user) { router.push("/login"); return; }
        setCurrentUser(session.data.user);
        setCampaign(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaignId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-ink mb-2">Campaign not found</p>
          <Link href="/dashboard" className="font-sans text-sm text-blush underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch px-6 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">
            ← Dashboard
          </Link>
          <span className="text-tan">/</span>
          {loading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="font-display text-lg text-ink">
              {campaign?.emoji} {campaign?.name}
            </span>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Campaign header */}
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
                  DM: {campaign.owner.displayName ?? campaign.owner.name} ·{" "}
                  Created {timeAgo(campaign.createdAt)}
                </p>
              </div>
            </div>

            {/* Create character CTA */}
            <Link href={`/characters/create?campaignId=${campaign.id}`}>
              <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-5 py-2.5 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 flex items-center gap-2">
                🧙 Create Character
              </button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Characters ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Characters</h2>
              <Link href={`/characters/create?campaignId=${campaignId}`}>
                <span className="font-sans text-xs text-blush underline decoration-dotted underline-offset-2 hover:text-ink transition-colors">
                  + Add Character
                </span>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : campaign?.characters.length === 0 ? (
              <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-8 text-center">
                <p className="text-3xl mb-2">🧙</p>
                <p className="font-display text-lg text-ink">No characters yet</p>
                <p className="font-sans text-xs text-ink-faded mt-1 mb-4">
                  Be the first to bring a character into this campaign.
                </p>
                <Link href={`/characters/create?campaignId=${campaignId}`}>
                  <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-4 py-2 hover:-translate-x-px hover:-translate-y-px transition-all duration-150">
                    Create a Character ✦
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaign?.characters.map((character) => {
                  const primaryClass = character.classes[0];
                  const hpPercent    = Math.round((character.currentHp / character.maxHp) * 100);
                  const hpColor      = hpPercent > 60 ? "bg-sage" : hpPercent > 30 ? "bg-gold" : "bg-blush";
                  const isMyChar     = character.user.id === currentUser?.id;

                  return (
                    <Link key={character.id} href={`/characters/${character.id}`}>
                      <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px transition-all duration-150">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-display text-lg text-ink">{character.name}</p>
                              {isMyChar && (
                                <span className="font-sans text-[0.6rem] font-bold uppercase tracking-wider bg-blush/10 text-blush border border-blush/30 rounded px-1.5 py-0.5">
                                  Yours
                                </span>
                              )}
                            </div>
                            <p className="font-sans text-xs text-ink-faded mt-0.5">
                              {character.race?.name ?? "Unknown"}{" "}
                              {primaryClass ? `· ${primaryClass.class.name}` : ""} ·{" "}
                              Played by {character.user.displayName ?? character.user.name}
                            </p>
                          </div>
                          <div className="font-mono text-xs text-ink-faded bg-parchment border border-sketch rounded px-2 py-1">
                            Lv.{character.level}
                          </div>
                        </div>

                        {/* HP bar */}
                        <div className="mt-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
                            <span className="font-mono text-[0.6rem] text-ink-faded">
                              {character.currentHp}/{character.maxHp}
                            </span>
                          </div>
                          <div className="h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 w-pct-${Math.min(100, Math.round(hpPercent / 5) * 5)} ${hpColor}`}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">

            {/* Members */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                Members
              </p>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {campaign?.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-parchment border border-sketch rounded-sketch flex items-center justify-center text-sm overflow-hidden shrink-0">
                        {member.user.image
                          ? (
                              // eslint-disable-next-line @next/next/no-img-element -- external avatar URL
                              <img src={member.user.image} className="w-full h-full object-cover" alt="" />
                            )
                          : "🧙"
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs text-ink truncate">
                          {member.user.displayName ?? member.user.name ?? "Player"}
                        </p>
                      </div>
                      <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                        member.role === "DM"
                          ? "bg-blush/10 text-blush border-blush/30"
                          : "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30"
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sessions */}
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                Combat Sessions
              </p>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : campaign?.sessions.length === 0 ? (
                <p className="font-display text-sm text-ink-faded text-center py-2">
                  No sessions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {campaign?.sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${session.active ? "bg-sage" : "bg-tan"}`} />
                      <p className="font-sans text-xs text-ink-soft">
                        Round {session.round} · {timeAgo(session.createdAt)}
                      </p>
                      {session.active && (
                        <span className="font-sans text-[0.6rem] text-sage border border-sage/30 rounded px-1 ml-auto">
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign stats */}
            {!loading && campaign && (
              <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                  Campaign Stats
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Characters", value: campaign.characters.length },
                    { label: "Sessions",   value: campaign.sessions.length },
                    { label: "Members",    value: campaign.members.length },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="font-sans text-xs text-ink-faded">{stat.label}</span>
                      <span className="font-mono text-sm font-bold text-ink">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DM Tools */}
            {!loading && campaign && currentUser?.id === campaign.ownerId && (
              <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
                  DM Tools
                </p>
                <button
                  onClick={() => setShowDelete(true)}
                  className="w-full font-sans font-semibold text-sm text-blush bg-blush/5 border-2 border-blush/30 rounded-sketch px-3 py-2 hover:bg-blush/10 hover:border-blush/50 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch flex items-center gap-2"
                >
                  <span>🗑️</span> Delete Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDelete && campaign && (
        <DeleteModal
          label="Campaign"
          confirmText={campaign.name}
          warning="Deleting this campaign will permanently remove all characters, sessions, and combat history associated with it."
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete campaign");
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}
