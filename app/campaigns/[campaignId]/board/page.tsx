"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionUser {
  id: string;
  displayName?: string | null;
  name?: string | null;
}

interface MapAsset {
  id: string;
  name: string;
  url: string;
}

interface Board {
  id: string;
  campaignId: string;
  activeMapId: string | null;
  combatActive: boolean;
  activeMap: MapAsset | null;
}

interface Character {
  id: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
  armorClass: number;
  speed: number;
  avatarUrl: string | null;
  conditions: string[];
  inspiration: boolean;
  user: { id: string; displayName: string | null; name: string | null };
  race: { name: string } | null;
  classes: { level: number; class: { name: string } }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function Avatar({ src, size = 36, className = "" }: {
  src?: string | null; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-tan/30 border-2 border-sketch rounded-sketch text-base ${className}`}
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

// ── HP Bar ────────────────────────────────────────────────────────────────────

function HpBar({ current, max, temporary = 0 }: { current: number; max: number; temporary?: number }) {
  const pct     = Math.min(100, Math.round((current / max) * 100));
  const color   = pct > 60 ? "bg-sage" : pct > 30 ? "bg-gold" : "bg-blush";
  const hasTmp  = temporary > 0;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
        <span className="font-mono text-[0.6rem] text-ink-faded">
          {current}/{max}{hasTmp ? ` +${temporary}` : ""}
        </span>
      </div>
      <div className="h-2 bg-parchment border border-sketch rounded-full overflow-hidden flex">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
        {hasTmp && (
          <div className="h-full bg-dusty-blue/60 rounded-full" style={{ width: `${Math.min(100 - pct, Math.round((temporary / max) * 100))}%` }} />
        )}
      </div>
    </div>
  );
}

// ── Character Status Card ─────────────────────────────────────────────────────

function CharacterStatusCard({ character, isCurrentUser }: {
  character: Character; isCurrentUser: boolean;
}) {
  const primaryClass = character.classes?.[0];
  const isDowned     = character.currentHp <= 0;

  return (
    <div className={`bg-warm-white border-2 rounded-sketch shadow-sketch p-3 transition-all ${
      isDowned ? "border-blush/50 bg-blush/5 opacity-75" : isCurrentUser ? "border-blush/30" : "border-sketch"
    }`}>
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar src={character.avatarUrl} size={40}
            className={`border-2 ${isDowned ? "border-blush/40 grayscale" : isCurrentUser ? "border-blush/40" : "border-sketch"}`}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ink border border-ink rounded-full flex items-center justify-center">
            <span className="font-mono text-[0.45rem] font-bold text-warm-white">{character.level}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <p className="font-display text-sm text-ink leading-tight truncate">{character.name}</p>
            {isCurrentUser && (
              <span className="font-sans text-[0.5rem] font-bold uppercase tracking-wider bg-blush/10 text-blush border border-blush/30 rounded p-0.5 shrink-0">You</span>
            )}
            {isDowned && (
              <span className="font-sans text-[0.5rem] font-bold uppercase tracking-wider bg-blush/20 text-blush border border-blush/40 rounded p-0.5 shrink-0">Down</span>
            )}
            {character.inspiration && (
              <span className="font-sans text-[0.5rem] font-bold uppercase tracking-wider bg-gold/20 text-gold border border-gold/40 rounded p-0.5 shrink-0">✦ Inspired</span>
            )}
          </div>
          <p className="font-sans text-[0.65rem] text-ink-faded mb-2">
            {character.race?.name ?? "?"}{primaryClass ? ` · ${primaryClass.class.name}` : ""}
            {" · "}{character.user.displayName ?? character.user.name ?? "Player"}
          </p>

          <HpBar current={character.currentHp} max={character.maxHp} temporary={character.temporaryHp} />

          {/* Stats row */}
          <div className="flex gap-3 mt-2">
            {[
              { label: "AC",  value: character.armorClass },
              { label: "SPD", value: `${character.speed}ft` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-xs font-bold text-ink">{s.value}</p>
                <p className="font-sans text-[0.55rem] text-ink-faded uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Conditions */}
          {character.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {character.conditions.map((c) => (
                <span key={c} className="font-sans text-[0.5rem] font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded p-0.5">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Map Picker (DM only) ──────────────────────────────────────────────────────

function MapPicker({ assets, activeMapId, campaignId, onChanged }: {
  assets: MapAsset[];
  activeMapId: string | null;
  campaignId: string;
  onChanged: () => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function selectMap(mapId: string | null) {
    setLoading(true);
    await fetch(`/api/campaigns/${campaignId}/board`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMapId: mapId }),
    });
    setLoading(false);
    setOpen(false);
    onChanged();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2"
      >
        <span>🗺️</span> {activeMapId ? "Change Map" : "Set Map"} {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] z-20">
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {assets.length === 0 ? (
              <p className="font-sans text-xs text-ink-faded p-2 text-center">No map assets uploaded yet.</p>
            ) : (
              <>
                {activeMapId && (
                  <button onClick={() => selectMap(null)}
                    className="w-full text-left font-sans text-xs text-blush p-2 rounded hover:bg-blush/5 transition-colors">
                    ✕ Clear map
                  </button>
                )}
                {assets.map((asset) => (
                  <button key={asset.id} onClick={() => selectMap(asset.id)}
                    className={`w-full text-left p-2 rounded transition-colors flex items-center gap-2 ${
                      asset.id === activeMapId ? "bg-blush/10 border border-blush/30" : "hover:bg-parchment"
                    }`}>
                    <div className="w-8 h-8 bg-sketch/20 rounded border border-sketch overflow-hidden shrink-0">
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-sans text-xs text-ink truncate">{asset.name}</span>
                    {asset.id === activeMapId && <span className="font-sans text-[0.55rem] text-blush ml-auto shrink-0">Active</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Board Page ────────────────────────────────────────────────────────────────

export default function CampaignBoardPage() {
  const params     = useParams();
  const router     = useRouter();
  const campaignId = params.campaignId as string;

  const [board,       setBoard]       = useState<Board | null>(null);
  const [characters,  setCharacters]  = useState<Character[]>([]);
  const [assets,      setAssets]      = useState<MapAsset[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isDM,        setIsDM]        = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [sessionRes, boardRes, campaignRes] = await Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}/board`).then((r) => {
        if (!r.ok) throw new Error("Failed to load board");
        return r.json();
      }),
      fetch(`/api/campaigns/${campaignId}`).then((r) => {
        if (!r.ok) throw new Error("Campaign not found");
        return r.json();
      }),
    ]);

    if (!sessionRes?.data?.user) { router.push("/login"); return null; }

    const user = sessionRes.data.user as SessionUser;
    const membership = campaignRes.members?.find((m: any) => m.user.id === user.id);

    return {
      user,
      isDM: membership?.role === "DM",
      campaignName: campaignRes.name,
      board: boardRes.board,
      characters: boardRes.characters,
      assets: boardRes.assets,
    };
  }, [campaignId, router]);

  useEffect(() => {
    let active = true;
    loadData()
      .then((result) => {
        if (!active || !result) return;
        setCurrentUser(result.user);
        setIsDM(result.isDM);
        setCampaignName(result.campaignName);
        setBoard(result.board);
        setCharacters(result.characters);
        setAssets(result.assets);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData().then((result) => {
      if (!result) return;
      setBoard(result.board);
      setCharacters(result.characters);
      setAssets(result.assets);
    });
  }, [loadData]);

  if (error) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-ink mb-2">Failed to load board</p>
        <Link href={`/campaigns/${campaignId}`} className="font-sans text-sm text-blush underline">Back to campaign</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased flex flex-col">

      {/* ── Nav ── */}
      <nav className="bg-warm-white border-b-2 border-sketch p-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <Link href={`/campaigns/${campaignId}`} className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">
            ← Campaign
          </Link>
          <span className="text-sketch">/</span>
          {loading ? <Skeleton className="h-4 w-32" /> : (
            <span className="font-display text-lg text-ink">{campaignName}</span>
          )}
          <span className="text-sketch">/</span>
          <span className="font-display text-lg text-ink">Session Board</span>

          {isDM && !loading && board && (
            <div className="ml-auto flex items-center gap-2">
              <MapPicker
                assets={assets}
                activeMapId={board.activeMapId}
                campaignId={campaignId}
                onChanged={refresh}
              />
              <Link href={`/campaigns/${campaignId}/board/combat`}>
                <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all flex items-center gap-2">
                  ⚔️ Start Combat
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3"><Skeleton className="h-96" /></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

            {/* ── Map area ── */}
            <div className="lg:col-span-3">
              <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch overflow-hidden" style={{ minHeight: "520px" }}>
                {board?.activeMap ? (
                  <div className="relative w-full h-full" style={{ minHeight: "520px" }}>
                    <img
                      src={board.activeMap.url}
                      alt={board.activeMap.name}
                      className="w-full h-full object-contain"
                      style={{ minHeight: "520px" }}
                    />
                    <div className="absolute bottom-3 left-3 bg-ink/60 backdrop-blur-sm rounded-sketch p-2">
                      <p className="font-sans text-xs text-warm-white">🗺️ {board.activeMap.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: "520px" }}>
                    <p className="text-5xl mb-4">🗺️</p>
                    <p className="font-display text-xl text-ink mb-1">No map active</p>
                    <p className="font-sans text-sm text-ink-faded text-center max-w-xs">
                      {isDM
                        ? "Upload map assets and set one as active using the map picker above."
                        : "The Dungeon Master hasn't set a map yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Party status ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Party Status</p>
                <span className="font-mono text-xs text-ink-faded">{characters.length} active</span>
              </div>

              {characters.length === 0 ? (
                <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-6 text-center">
                  <p className="text-2xl mb-2">🧙</p>
                  <p className="font-sans text-sm text-ink-faded">No active characters yet.</p>
                  <p className="font-sans text-xs text-ink-faded mt-1">Players must set an active character from the campaign page.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {characters.map((character) => (
                    <CharacterStatusCard
                      key={character.id}
                      character={character}
                      isCurrentUser={character.user.id === currentUser?.id}
                    />
                  ))}
                </div>
              )}

              {isDM && (
                <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-3 mt-2">
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">DM Tools</p>
                  <Link href={`/campaigns/${campaignId}/board/combat`}>
                    <button className="w-full font-sans font-semibold text-sm text-white bg-blush border-2 border-blush rounded-sketch p-2 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch-accent flex items-center gap-2">
                      ⚔️ Start Combat
                    </button>
                  </Link>
                  <Link href={`/campaigns/${campaignId}/board/npcs`}>
                    <button className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2 mt-2">
                      👹 Manage NPCs
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}