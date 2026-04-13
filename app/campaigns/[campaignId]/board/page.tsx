"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { getPusherClient } from "@/lib/pusher-client";
import { PUSHER_EVENTS } from "@/lib/pusher-events";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionUser { id: string; displayName?: string | null; name?: string | null; }
interface MapAsset { id: string; name: string; url: string; }

interface InitiativeEntry {
  key:             string;
  name:            string;
  initiative:      number;
  type:            "character" | "npc";
  rolled:          boolean;
  actionUsed:      boolean;
  bonusActionUsed: boolean;
  reactionUsed:    boolean;
}

interface BoardState {
  tokens:            Record<string, { col: number; row: number }>;
  combatActive?:     boolean;
  currentTurnIndex?: number;
  round?:            number;
  combatSessionId?:  string | null;
  initiativeOrder?:  InitiativeEntry[];
}

interface Board {
  id: string; campaignId: string; activeMapId: string | null;
  combatActive: boolean; boardState: BoardState | null; activeMap: MapAsset | null;
}

interface Character {
  id: string; name: string; level: number; currentHp: number; maxHp: number;
  temporaryHp: number; armorClass: number; speed: number; initiative: number;
  avatarUrl: string | null; conditions: string[]; inspiration: boolean;
  user: { id: string; displayName: string | null; name: string | null };
  race: { name: string } | null;
  classes: { level: number; class: { name: string } }[];
  features: { feature: { name: string; actionType: string | null; combatUsable: boolean } }[];
  spells:   { spell: { id: string; name: string; level: number; castingTime: string } }[];
}

interface NPC {
  id: string; name: string; currentHp: number; maxHp: number;
  armorClass: number; speed: number; initiativeModifier: number; avatarUrl: string | null;
  attacks: { name: string; toHit: number; damageDice: string; damageType: string }[] | null;
}

interface ActionLogEntry {
  id: string; actionType: string; description: string; result: string | null;
  createdAt: string;
  user:      { displayName: string | null; name: string | null };
  character: { name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function Avatar({ src, size = 36, className = "" }: { src?: string | null; size?: number; className?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) return (
    <div className={`flex items-center justify-center bg-tan/30 border-2 border-sketch rounded-sketch text-base ${className}`}
      style={{ width: size, height: size }}>👤</div>
  );
  return <img src={src} alt="" onError={() => setError(true)} className={`object-cover rounded-sketch ${className}`} style={{ width: size, height: size }} />;
}

function HpBar({ current, max, temporary = 0 }: { current: number; max: number; temporary?: number }) {
  const pct   = Math.min(100, Math.round((current / max) * 100));
  const color = pct > 60 ? "bg-sage" : pct > 30 ? "bg-gold" : "bg-blush";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
        <span className="font-mono text-[0.6rem] text-ink-faded">{current}/{max}{temporary > 0 ? ` +${temporary}` : ""}</span>
      </div>
      <div className="h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ── Dice Roller ───────────────────────────────────────────────────────────────

function DiceRoller({ sides, modifier = 0, label, onRoll }: {
  sides: number; modifier?: number; label: string; onRoll: (total: number, roll: number) => void;
}) {
  const [result,  setResult]  = useState<{ roll: number; total: number } | null>(null);
  const [rolling, setRolling] = useState(false);

  function roll() {
    setRolling(true);
    setTimeout(() => {
      const r = Math.floor(Math.random() * sides) + 1;
      const t = r + modifier;
      setResult({ roll: r, total: t });
      setRolling(false);
      onRoll(t, r);
    }, 400);
  }

  const modStr = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : "";

  return (
    <div className="flex items-center gap-2">
      <button onClick={roll} disabled={rolling}
        className="font-sans font-bold text-xs text-white bg-ink border border-ink rounded p-1.5 hover:bg-ink/80 transition-all flex items-center gap-1 disabled:opacity-50">
        🎲 {rolling ? "..." : `d${sides}${modStr}`}
      </button>
      {result ? (
        <span className="font-mono text-sm font-bold text-ink">
          {result.total}
          <span className="font-sans text-[0.6rem] text-ink-faded ml-1">({result.roll}{modStr})</span>
        </span>
      ) : (
        <span className="font-sans text-xs text-ink-faded">{label}</span>
      )}
    </div>
  );
}

// ── Upload Map Modal ──────────────────────────────────────────────────────────

function UploadMapModal({ campaignId, onUploaded, onClose }: {
  campaignId: string; onUploaded: (asset: MapAsset) => void; onClose: () => void;
}) {
  const [name,    setName]    = useState("");
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    if (!file || !name.trim()) return setError("Name and file are required");
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const utRes = await fetch("/api/uploadthing", { method: "POST", body: formData });
      if (!utRes.ok) throw new Error("Upload failed");
      const utData = await utRes.json();
      const url = utData?.[0]?.ufsUrl ?? utData?.[0]?.url ?? utData?.[0]?.fileUrl;
      if (!url) throw new Error("No URL returned");
      const res = await fetch(`/api/campaigns/${campaignId}/assets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url, type: "MAP" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      onUploaded(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A]">
        <div className="flex items-center justify-between p-5 border-b border-sketch">
          <h2 className="font-display text-2xl text-ink">Upload Map</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-blush/10 border border-blush/30 rounded-input p-3"><p className="font-sans text-xs text-blush">✗ {error}</p></div>}
          <div onClick={() => fileRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-sketch cursor-pointer overflow-hidden ${preview ? "border-blush/40" : "border-sketch hover:border-blush/40"}`}
            style={{ minHeight: "120px" }}>
            {preview
              ? <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: "180px" }} />
              : <div className="flex flex-col items-center justify-center p-6 text-center"><p className="text-2xl mb-2">🗺️</p><p className="font-sans text-sm text-ink-faded">Click to select an image</p></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <div>
            <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Name *</label>
            <input type="text" value={name} placeholder="e.g. Tavern Interior" onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input p-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
          </div>
        </div>
        <div className="p-5 flex gap-3 justify-end border-t border-sketch">
          <button onClick={onClose} className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-parchment hover:bg-paper transition-all shadow-sketch">Cancel</button>
          <button onClick={handleUpload} disabled={!file || !name.trim() || loading}
            className={`font-sans font-bold text-sm text-white rounded-sketch p-2 border-2 transition-all flex items-center gap-2 ${
              file && name.trim() && !loading ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px" : "bg-tan border-sketch opacity-50 cursor-not-allowed"
            }`}>
            {loading ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</> : "Upload Map ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Map Picker ────────────────────────────────────────────────────────────────

function MapPicker({ assets: initialAssets, activeMapId, campaignId, onChanged }: {
  assets: MapAsset[]; activeMapId: string | null; campaignId: string; onChanged: (newAssets?: MapAsset[]) => void;
}) {
  const [open,       setOpen]       = useState(false);
  const [assets,     setAssets]     = useState<MapAsset[]>(initialAssets);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  useEffect(() => { setAssets(initialAssets); }, [initialAssets]);

  async function selectMap(mapId: string | null) {
    await fetch(`/api/campaigns/${campaignId}/board`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMapId: mapId }),
    });
    setOpen(false);
    onChanged();
  }

  async function deleteAsset(e: React.MouseEvent, assetId: string) {
    e.stopPropagation();
    if (!confirm("Delete this map asset?")) return;
    setDeleting(assetId);
    await fetch(`/api/campaigns/${campaignId}/assets/${assetId}`, { method: "DELETE" });
    const updated = assets.filter((a) => a.id !== assetId);
    setAssets(updated); setDeleting(null); onChanged(updated);
  }

  function handleUploaded(asset: MapAsset) {
    const updated = [asset, ...assets];
    setAssets(updated); setShowUpload(false); onChanged(updated);
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)}
          className="font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">
          <span>🗺️</span> {activeMapId ? "Change Map" : "Set Map"} {open ? "▲" : "▼"}
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] z-20">
            <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
              <button onClick={() => { setOpen(false); setShowUpload(true); }}
                className="w-full text-left p-2 rounded flex items-center gap-2 hover:bg-parchment transition-colors border border-dashed border-sketch">
                <div className="w-8 h-8 bg-parchment rounded border border-sketch flex items-center justify-center text-sm shrink-0">+</div>
                <span className="font-sans text-xs text-blush font-semibold">Upload new map...</span>
              </button>
              {assets.length > 0 && <div className="border-t border-sketch/50 my-1" />}
              {activeMapId && (
                <button onClick={() => selectMap(null)} className="w-full text-left font-sans text-xs text-blush p-2 rounded hover:bg-blush/5">
                  ✕ Clear active map
                </button>
              )}
              {assets.map((a) => (
                <div key={a.id} className={`flex items-center gap-2 p-1.5 rounded transition-colors ${a.id === activeMapId ? "bg-blush/10 border border-blush/30" : "hover:bg-parchment"}`}>
                  <button onClick={() => selectMap(a.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                    <div className="w-10 h-10 bg-sketch/20 rounded border border-sketch overflow-hidden shrink-0">
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs text-ink truncate">{a.name}</p>
                      {a.id === activeMapId && <p className="font-sans text-[0.55rem] text-blush">Active</p>}
                    </div>
                  </button>
                  <button onClick={(e) => deleteAsset(e, a.id)} disabled={deleting === a.id}
                    className="w-6 h-6 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs shrink-0">
                    {deleting === a.id ? "…" : "✕"}
                  </button>
                </div>
              ))}
              {assets.length === 0 && <p className="font-sans text-xs text-ink-faded p-2 text-center">No maps uploaded yet.</p>}
            </div>
          </div>
        )}
      </div>
      {showUpload && <UploadMapModal campaignId={campaignId} onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />}
    </>
  );
}

// ── Start Combat Modal ────────────────────────────────────────────────────────

function StartCombatModal({ characters, npcs, campaignId, onStarted, onClose, externalRolls }: {
  characters: Character[]; npcs: NPC[]; campaignId: string;
  onStarted: (boardState: BoardState) => void; onClose: () => void;
  externalRolls: Record<string, number>; // charKey -> initiative total from player rolls
}) {
  type Entry = {
    key: string; name: string; type: "character" | "npc";
    modifier: number; initiative: number; excluded: boolean;
  };

  const [entries,   setEntries]   = useState<Entry[]>(() => [
    ...characters.map((c) => ({ key: `char_${c.id}`, name: c.name, type: "character" as const, modifier: c.initiative, initiative: 0, excluded: false })),
    ...npcs.map((n) => ({ key: `npc_${n.id}`, name: n.name, type: "npc" as const, modifier: n.initiativeModifier, initiative: 0, excluded: false })),
  ]);

  // Merge player rolls received via Pusher into entries
  useEffect(() => {
    if (Object.keys(externalRolls).length === 0) return;
    setEntries((prev) => prev.map((e) =>
      e.type === "character" && externalRolls[e.key] !== undefined
        ? { ...e, initiative: externalRolls[e.key] }
        : e
    ));
  }, [externalRolls]);
  const [loading,   setLoading]   = useState(false);
  const [notified,  setNotified]  = useState(false);
  const [notifying, setNotifying] = useState(false);

  function rollAllNPCs() {
    setEntries((prev) => prev.map((e) =>
      e.type === "npc" && !e.excluded
        ? { ...e, initiative: Math.floor(Math.random() * 20) + 1 + e.modifier }
        : e
    ));
  }

  function rollOne(key: string, modifier: number) {
    setEntries((prev) => prev.map((e) =>
      e.key === key ? { ...e, initiative: Math.floor(Math.random() * 20) + 1 + modifier } : e
    ));
  }

  function toggleExcluded(key: string) {
    setEntries((prev) => prev.map((e) => e.key === key ? { ...e, excluded: !e.excluded } : e));
  }

  const active     = entries.filter((e) => !e.excluded);
  const sorted     = [...active].sort((a, b) => b.initiative - a.initiative);
  const npcsDone   = entries.filter((e) => e.type === "npc" && !e.excluded).every((e) => e.initiative > 0);
  const playerKeys = active.filter((e) => e.type === "character").map((e) => e.key);

  async function handleNotify() {
    setNotifying(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/combat/notify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingKeys: playerKeys }),
      });
      setNotified(true);
    } finally {
      setNotifying(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/combat/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiativeOrder: active.map((e) => ({ key: e.key, name: e.name, initiative: e.initiative, type: e.type })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onStarted(data.boardState);
    } catch (err) { console.error(err); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-sketch">
          <h2 className="font-display text-2xl text-ink">⚔️ Start Combat</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-xs text-ink-faded">Roll NPCs below. Use "Notify Players" to prompt players to roll. Use ✕ to exclude a combatant.</p>
            <button onClick={rollAllNPCs}
              className="font-sans font-semibold text-xs text-white bg-ink border border-ink rounded p-1.5 hover:bg-ink/80 transition-all flex items-center gap-1 shrink-0 ml-2">
              🎲 Roll all NPCs
            </button>
          </div>

          {entries.map((entry) => (
            <div key={entry.key} className={`flex items-center gap-3 p-3 rounded-sketch border-2 transition-all ${
              entry.excluded
                ? "border-sketch/30 bg-parchment opacity-40"
                : entry.type === "npc" ? "border-blush/20 bg-blush/5" : "border-sketch bg-parchment"
            }`}>
              <span className="text-lg shrink-0">{entry.type === "npc" ? "👹" : "🧙"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-semibold text-ink truncate">{entry.name}</p>
                <p className="font-sans text-xs text-ink-faded">
                  {entry.type === "character"
                    ? notified ? "🔔 Prompted to roll" : "Player — click Notify to prompt"
                    : `Mod: ${entry.modifier >= 0 ? "+" : ""}${entry.modifier}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {entry.type === "npc" && !entry.excluded && (
                  <>
                    <button onClick={() => rollOne(entry.key, entry.modifier)}
                      className="font-sans text-xs border border-sketch rounded p-1 hover:bg-parchment transition-colors">🎲</button>
                    <span className={`font-mono text-sm font-bold w-8 text-center ${entry.initiative > 0 ? "text-ink" : "text-ink-faded"}`}>
                      {entry.initiative > 0 ? entry.initiative : "—"}
                    </span>
                  </>
                )}
                {entry.type === "character" && !entry.excluded && (
                  entry.initiative > 0
                    ? <span className="font-mono text-sm font-bold text-sage">{entry.initiative}</span>
                    : <span className={`font-sans text-[0.6rem] italic ${notified ? "text-gold" : "text-ink-faded"}`}>
                        {notified ? "rolling..." : "pending"}
                      </span>
                )}
                <button onClick={() => toggleExcluded(entry.key)}
                  title={entry.excluded ? "Include in combat" : "Exclude from combat"}
                  className={`w-6 h-6 rounded border text-xs flex items-center justify-center transition-all ${
                    entry.excluded ? "border-sage/40 text-sage hover:bg-sage/10" : "border-sketch text-ink-faded hover:border-blush/40 hover:text-blush"
                  }`}>
                  {entry.excluded ? "+" : "✕"}
                </button>
              </div>
            </div>
          ))}

          {sorted.some((e) => e.initiative > 0) && (
            <div className="border-t border-sketch p-3 mt-2">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Order Preview</p>
              {sorted.map((e, i) => (
                <div key={e.key} className="flex items-center gap-2 py-0.5">
                  <span className="font-mono text-xs text-ink-faded w-4">{i + 1}.</span>
                  <span className="font-sans text-xs text-ink flex-1">{e.name}</span>
                  <span className={`font-mono text-xs font-bold ${e.initiative > 0 ? "text-ink" : "text-ink-faded"}`}>{e.initiative > 0 ? e.initiative : "pending"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-sketch flex items-center gap-3">
          <button onClick={onClose}
            className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-parchment hover:bg-paper transition-all shadow-sketch">
            Cancel
          </button>
          <div className="flex-1" />
          <button type="button" onClick={handleNotify} disabled={notifying}
            className={`font-sans font-semibold text-sm rounded-sketch p-2 border-2 transition-all flex items-center gap-2 ${
              notified
                ? "text-sage border-sage/40 bg-sage/10"
                : "text-ink-soft bg-parchment border-sketch hover:bg-paper hover:border-blush/50 shadow-sketch"
            }`}>
            {notifying
              ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Notifying...</>
              : notified ? "🔔 Players Notified" : "🔔 Notify Players"}
          </button>
          <button type="button" onClick={handleStart} disabled={loading || !npcsDone}
            className={`font-sans font-bold text-sm text-white rounded-sketch p-2 border-2 transition-all flex items-center gap-2 ${
              !loading && npcsDone
                ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                : "bg-tan border-sketch opacity-60 cursor-not-allowed"
            }`}>
            {loading
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting...</>
              : "Begin Combat ⚔️"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Initiative Tracker ────────────────────────────────────────────────────────

function InitiativeTracker({ order, currentIndex, round, isDM, currentUserId, characters, npcs, campaignId, combatSessionId, onNextTurn, onEndCombat, onActionUsed, movementLeft, selectedTargetKey, selectedTargetName, onEndTurn }: {
  order: InitiativeEntry[]; currentIndex: number; round: number; isDM: boolean;
  currentUserId: string; characters: Character[]; npcs: NPC[]; campaignId: string; combatSessionId: string | null;
  onNextTurn: () => void; onEndCombat: () => void;
  onActionUsed: (slot: "action" | "bonus" | "reaction", actionName?: string) => void;
  movementLeft: number;
  selectedTargetKey: string | null;
  selectedTargetName: string | null;
  onEndTurn: () => void;
}) {
  const currentEntry = order[currentIndex];
  const myChar       = characters.find((c) => c.user.id === currentUserId);
  const myEntry      = myChar ? order.find((e) => e.key === `char_${myChar.id}`) : null;
  const isMyTurn     = currentEntry?.key === `char_${myChar?.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Combat</p>
          <p className="font-display text-lg text-ink">Round {round}</p>
        </div>
        {isDM && (
          <div className="flex gap-1">
            <button onClick={onNextTurn} className="font-sans font-bold text-xs text-white bg-sage border border-sage rounded p-1.5 hover:bg-sage/80 transition-all">Next Turn →</button>
            <button onClick={onEndCombat} className="font-sans font-bold text-xs text-blush border border-blush/40 rounded p-1.5 hover:bg-blush/10 transition-all">End</button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {order.map((entry, i) => {
          const isCurrent = i === currentIndex;
          const char = characters.find((c) => `char_${c.id}` === entry.key);
          const npc  = npcs.find((n) => `npc_${n.id}` === entry.key);
          const currentHp = char?.currentHp ?? npc?.currentHp ?? null;
          const maxHp     = char?.maxHp     ?? npc?.maxHp     ?? null;
          const hpPct     = currentHp !== null && maxHp ? Math.min(100, Math.round((currentHp / maxHp) * 100)) : null;
          const hpColor   = hpPct === null ? "bg-sketch" : hpPct > 60 ? "bg-sage" : hpPct > 30 ? "bg-gold" : "bg-blush";
          return (
            <div key={entry.key} className={`p-2 rounded-sketch border transition-all ${isCurrent ? "border-gold bg-gold/10" : "border-sketch bg-parchment"}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faded w-4">{i + 1}.</span>
                <span className="font-sans text-xs font-semibold text-ink flex-1 truncate">{entry.name}</span>
                <span className={`font-mono text-xs font-bold ${entry.rolled ? "text-ink" : "text-ink-faded"}`}>
                  {entry.rolled ? entry.initiative : "?"}
                </span>
                {isCurrent && <span className="font-sans text-[0.5rem] font-bold uppercase text-gold border border-gold/40 rounded p-0.5">Turn</span>}
                {!entry.rolled && <span className="font-sans text-[0.5rem] text-ink-faded italic">rolling</span>}
              </div>
              {hpPct !== null && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-warm-white border border-sketch/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
                  </div>
                  <span className="font-mono text-[0.5rem] text-ink-faded">{currentHp}/{maxHp}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action panel only on player's turn after rolling */}
      {isMyTurn && myChar && myEntry?.rolled && combatSessionId && (
        <PlayerActionPanel
          character={myChar}
          entry={currentEntry}
          order={order}
          characters={characters}
          npcs={npcs}
          campaignId={campaignId}
          combatSessionId={combatSessionId}
          movementLeft={movementLeft}
          onActionUsed={(slot, actionName) => onActionUsed(slot, actionName)}
          onEndTurn={onEndTurn}
        />
      )}

      {/* Selected target indicator */}
      {selectedTargetKey && selectedTargetName && (
        <div className="bg-blush/10 border border-blush/30 rounded-sketch p-2 flex items-center justify-between">
          <p className="font-sans text-xs text-ink">🎯 Target: <span className="font-semibold">{selectedTargetName}</span></p>
          <p className="font-sans text-[0.55rem] text-ink-faded">Click token or dropdown to change</p>
        </div>
      )}
    </div>
  );
}

// ── Initiative Roll Modal ─────────────────────────────────────────────────────

function InitiativeRollModal({ character, campaignId, onClose }: {
  character: Character; campaignId: string; onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [total,     setTotal]     = useState<number | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  async function submit(t: number) {
    setTotal(t);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/combat/initiative`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, total: t, modifier: character.initiative }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-warm-white border-2 border-gold rounded-sketch shadow-[4px_4px_0_#C1A86A]">
        <div className="p-5 border-b border-sketch flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">🎲 Roll Initiative!</h2>
          {submitted && (
            <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm">✕</button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar src={character.avatarUrl} size={44} className="border-2 border-sketch" />
            <div>
              <p className="font-display text-lg text-ink">{character.name}</p>
              <p className="font-sans text-xs text-ink-faded">
                Initiative modifier: {character.initiative >= 0 ? "+" : ""}{character.initiative}
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-sage/10 border border-sage/30 rounded-sketch p-4 text-center space-y-1">
              <p className="font-display text-3xl text-sage">{total}</p>
              <p className="font-sans text-sm font-semibold text-sage">Initiative submitted!</p>
              <p className="font-sans text-xs text-ink-faded">Waiting for the DM to begin combat...</p>
              <button onClick={onClose} className="mt-2 font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-parchment hover:bg-paper transition-all shadow-sketch">
                Dismiss
              </button>
            </div>
          ) : (
            <>
              <p className="font-sans text-sm text-ink-faded">
                The Dungeon Master has called for initiative. Roll your d20 and your result will be added to the initiative order.
              </p>
              {error && <p className="font-sans text-xs text-blush">✗ {error}</p>}
              <div className="bg-gold/10 border border-gold/30 rounded-sketch p-4">
                <DiceRoller
                  sides={20}
                  modifier={character.initiative}
                  label="Roll d20 + initiative modifier"
                  onRoll={(t) => submit(t)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Action Def ───────────────────────────────────────────────────────────────

interface ActionDef {
  name:           string;
  slot:           "ACTION" | "BONUS_ACTION" | "REACTION";
  type:           string;
  damageDice?:    string;
  damageType?:    string;
  toHit?:         number;
  requiresTarget: boolean;
  isSpell?:       boolean;
  spellLevel?:    number;
}

// ── Action Roll Panel (inline, no modal) ────────────────────────────────────────────────────────

function ActionRollPanel({ action, character, order, characters, npcs, campaignId, combatSessionId, onDone, onClose }: {
  action: ActionDef;
  character: Character;
  order: InitiativeEntry[];
  characters: Character[];
  npcs: NPC[];
  campaignId: string;
  combatSessionId: string;
  onDone: (slot: "action" | "bonus" | "reaction") => void;
  onClose: () => void;
}) {
  const [targetKey,  setTargetKey]  = useState<string | null>(null);
  const [attackRoll, setAttackRoll] = useState<number | null>(null);
  const [damageRoll, setDamageRoll] = useState<number | null>(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hitResult,  setHitResult]  = useState<"hit" | "miss" | null>(null);

  const needsAttack = action.type === "ATTACK";
  const needsDamage = !!action.damageDice;
  const needsTarget = action.requiresTarget;

  // Build combined target list from initiative order, resolving names to AC
  const targetOptions = order
    .filter((e) => e.key !== `char_${character.id}`)
    .map((e) => {
      const char = characters.find((c) => `char_${c.id}` === e.key);
      const npc  = npcs.find((n) => `npc_${n.id}` === e.key);
      return { key: e.key, name: e.name, ac: char?.armorClass ?? npc?.armorClass ?? null };
    });

  const selectedTarget = targetOptions.find((t) => t.key === targetKey) ?? null;

  function parseDice(dice: string): { count: number; sides: number; mod: number } {
    const m = dice.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!m) return { count: 1, sides: 6, mod: 0 };
    return { count: parseInt(m[1]), sides: parseInt(m[2]), mod: parseInt(m[3] ?? "0") };
  }

  function handleAttackRoll(total: number) {
    setAttackRoll(total);
    if (selectedTarget?.ac !== null && selectedTarget?.ac !== undefined) {
      setHitResult(total >= selectedTarget.ac ? "hit" : "miss");
    }
  }

  const canSubmit = (!needsTarget || targetKey) &&
                    (!needsAttack || attackRoll !== null) &&
                    (!needsDamage || damageRoll !== null || hitResult === "miss");

  const slotKey = action.slot === "ACTION" ? "action" : action.slot === "BONUS_ACTION" ? "bonus" : "reaction";

  async function handleSubmit() {
    setSubmitting(true);
    const desc = selectedTarget
      ? `${character.name} used ${action.name} on ${selectedTarget.name}${hitResult ? ` — ${hitResult}!` : ""}`
      : `${character.name} used ${action.name}`;

    await fetch(`/api/campaigns/${campaignId}/combat/action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId:   combatSessionId,
        actorId:     character.id,
        actionType:  action.type,
        actionSlot:  action.slot,
        description: desc,
        attackRoll,
        damageDealt: hitResult === "miss" ? 0 : damageRoll,
        notes:       selectedTarget ? `Target: ${selectedTarget.name} (AC ${selectedTarget.ac})` : undefined,
      }),
    });
    setSubmitted(true);
    setSubmitting(false);
    onDone(slotKey as "action" | "bonus" | "reaction");
  }

  if (submitted) return (
    <div className="bg-sage/10 border border-sage/30 rounded-sketch p-3 space-y-1">
      <p className="font-sans text-xs font-bold text-sage">✓ {action.name} used!</p>
      {hitResult && <p className="font-sans text-xs text-ink">Result: <span className={`font-bold ${hitResult === "hit" ? "text-sage" : "text-blush"}`}>{hitResult === "hit" ? "🎯 Hit!" : "💨 Miss"}</span></p>}
      {damageRoll !== null && hitResult !== "miss" && <p className="font-sans text-xs text-ink">Damage: <span className="font-mono font-bold">{damageRoll}</span></p>}
      <button onClick={onClose} className="font-sans text-xs text-ink-faded underline">Dismiss</button>
    </div>
  );

  return (
    <div className="bg-gold/5 border border-gold/40 rounded-sketch p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs font-bold text-ink">{action.isSpell ? "🔮" : "⚔️"} {action.name}</p>
        <button onClick={onClose} className="font-sans text-xs text-ink-faded hover:text-blush">✕</button>
      </div>

      {/* Target selector */}
      {needsTarget && (
        <div>
          <label className="block font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Target</label>
          <select value={targetKey ?? ""} onChange={(e) => { setTargetKey(e.target.value || null); setAttackRoll(null); setHitResult(null); }}
            className="w-full font-sans text-xs bg-parchment text-ink border-2 border-sketch rounded p-1.5 outline-none focus:border-blush">
            <option value="">— Select target —</option>
            {targetOptions.map((t) => (
              <option key={t.key} value={t.key}>{t.name}{t.ac !== null ? ` (AC ${t.ac})` : ""}</option>
            ))}
          </select>
          {selectedTarget && <p className="font-sans text-[0.55rem] text-ink-faded mt-0.5">🎯 {selectedTarget.name} · AC {selectedTarget.ac ?? "?"}</p>}
        </div>
      )}

      {/* Attack roll */}
      {needsAttack && (
        <div>
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">
            Attack Roll {action.toHit !== undefined ? `(+${action.toHit})` : ""}
            {selectedTarget?.ac !== null && <span className="normal-case font-normal ml-1">· needs {selectedTarget?.ac ?? "?"} to hit</span>}
          </p>
          <DiceRoller sides={20} modifier={action.toHit ?? 0} label="Roll to hit" onRoll={(t) => handleAttackRoll(t)} />
          {hitResult && (
            <p className={`font-sans text-xs font-bold mt-1 ${hitResult === "hit" ? "text-sage" : "text-blush"}`}>
              {hitResult === "hit" ? "🎯 Hit!" : "💨 Miss — no damage"}
            </p>
          )}
        </div>
      )}

      {/* Damage roll — only if hit or no attack needed */}
      {needsDamage && action.damageDice && hitResult !== "miss" && (
        <div>
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">
            Damage ({action.damageDice} {action.damageType ?? ""})
          </p>
          {(() => {
            const { count, sides, mod } = parseDice(action.damageDice);
            return (
              <DiceRoller sides={sides} modifier={mod}
                label={`Roll ${count}d${sides}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ""}`}
                onRoll={(t) => setDamageRoll(t * count)} />
            );
          })()}
        </div>
      )}

      {!needsAttack && !needsDamage && !needsTarget && (
        <p className="font-sans text-xs text-ink-faded italic">No rolls required.</p>
      )}

      <div className="flex gap-2">
        <button onClick={onClose} className="font-sans text-xs text-ink-faded border border-sketch rounded p-1.5 hover:bg-parchment flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className={`font-sans font-bold text-xs text-white rounded p-1.5 border transition-all flex-1 flex items-center justify-center gap-1 ${
            canSubmit && !submitting ? "bg-blush border-blush hover:-translate-x-px hover:-translate-y-px" : "bg-tan border-sketch opacity-50 cursor-not-allowed"
          }`}>
          {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> ...</> : "Confirm ✦"}
        </button>
      </div>
    </div>
  );
}

// ── Player Action Panel ───────────────────────────────────────────────────────

function PlayerActionPanel({ character, entry, order, characters, npcs, campaignId, combatSessionId, movementLeft, onActionUsed, onEndTurn }: {
  character: Character;
  entry: InitiativeEntry;
  order: InitiativeEntry[];
  characters: Character[];
  npcs: NPC[];
  campaignId: string;
  combatSessionId: string;
  movementLeft: number;
  onActionUsed: (slot: "action" | "bonus" | "reaction", actionName?: string) => void;
  onEndTurn: () => void;
}) {
  const [activeAction, setActiveAction] = useState<ActionDef | null>(null);

  const standardActions: ActionDef[] = [
    { name: "Attack",    slot: "ACTION", type: "ATTACK", requiresTarget: true,  damageDice: "1d6", damageType: "bludgeoning", toHit: 0 },
    { name: "Dash",      slot: "ACTION", type: "DASH",   requiresTarget: false },
    { name: "Dodge",     slot: "ACTION", type: "DODGE",  requiresTarget: false },
    { name: "Help",      slot: "ACTION", type: "HELP",   requiresTarget: true },
    { name: "Disengage", slot: "ACTION", type: "OTHER",  requiresTarget: false },
    { name: "Hide",      slot: "ACTION", type: "OTHER",  requiresTarget: false },
  ];

  const featureActions: ActionDef[] = character.features
    .filter((f) => f.feature.combatUsable)
    .map((f) => ({
      name:           f.feature.name,
      slot:           (f.feature.actionType?.toUpperCase().replace(" ", "_") ?? "ACTION") as "ACTION" | "BONUS_ACTION" | "REACTION",
      type:           "OTHER",
      requiresTarget: false,
    }));

  // Separate cantrips from leveled spells
  const cantrips:      ActionDef[] = character.spells.filter((s) => s.spell.level === 0).map((s) => ({
    name: s.spell.name, slot: s.spell.castingTime?.toLowerCase().includes("bonus") ? "BONUS_ACTION" : "ACTION",
    type: "CAST", requiresTarget: true, isSpell: true, spellLevel: 0,
  }));
  const leveledSpells: ActionDef[] = character.spells.filter((s) => s.spell.level > 0).map((s) => ({
    name: s.spell.name, slot: s.spell.castingTime?.toLowerCase().includes("bonus") ? "BONUS_ACTION" : "ACTION",
    type: "CAST", requiresTarget: true, isSpell: true, spellLevel: s.spell.level,
  }));

  const bonusStandard:    ActionDef[] = [{ name: "Off-hand Attack", slot: "BONUS_ACTION", type: "ATTACK", requiresTarget: true, damageDice: "1d6", damageType: "bludgeoning", toHit: 0 }];
  const reactionStandard: ActionDef[] = [
    { name: "Opportunity Attack", slot: "REACTION", type: "ATTACK", requiresTarget: true, damageDice: "1d6", damageType: "bludgeoning", toHit: 0 },
    { name: "Dodge (Reaction)",   slot: "REACTION", type: "DODGE",  requiresTarget: false },
  ];

  const SLOT_CONFIG = [
    {
      key: "action" as const, label: "Action", used: entry.actionUsed,
      actions: [...standardActions, ...featureActions.filter(f => f.slot === "ACTION")],
      cantrips: cantrips.filter(s => s.slot === "ACTION"),
      spells:   leveledSpells.filter(s => s.slot === "ACTION"),
    },
    {
      key: "bonus" as const, label: "Bonus Action", used: entry.bonusActionUsed,
      actions: [...bonusStandard, ...featureActions.filter(f => f.slot === "BONUS_ACTION")],
      cantrips: cantrips.filter(s => s.slot === "BONUS_ACTION"),
      spells:   leveledSpells.filter(s => s.slot === "BONUS_ACTION"),
    },
    {
      key: "reaction" as const, label: "Reaction", used: entry.reactionUsed,
      actions: [...reactionStandard, ...featureActions.filter(f => f.slot === "REACTION")],
      cantrips: [], spells: [],
    },
  ];

  const ftColor = movementLeft > 20 ? "text-sage" : movementLeft > 0 ? "text-gold" : "text-blush";
  const hpPct   = Math.min(100, Math.round((character.currentHp / character.maxHp) * 100));
  const hpColor = hpPct > 60 ? "bg-sage" : hpPct > 30 ? "bg-gold" : "bg-blush";

  function ActionButton({ a }: { a: ActionDef }) {
    const icon = a.isSpell ? "🔮" : a.type === "ATTACK" ? "⚔️" : a.type === "DASH" ? "💨" : a.type === "DODGE" ? "🛡️" : "✨";
    const isActive = activeAction?.name === a.name;
    return (
      <div className="relative group">
        <button onClick={() => setActiveAction(isActive ? null : a)}
          className={`w-full font-sans text-xs rounded p-1.5 border transition-all text-left truncate ${
            isActive
              ? a.isSpell ? "bg-dusty-blue/20 border-dusty-blue text-dusty-blue"
                          : "bg-blush/10 border-blush text-blush"
              : a.isSpell ? "text-dusty-blue bg-dusty-blue/5 border border-dusty-blue/30 hover:bg-dusty-blue/10"
                          : "text-ink bg-parchment border border-sketch hover:bg-paper hover:border-blush/40"
          }`}>
          {icon} {a.name}
        </button>
        {/* Tooltip for overflow */}
        <div className="absolute bottom-full left-0 mb-1 z-50 hidden group-hover:block pointer-events-none">
          <div className="bg-ink text-warm-white font-sans text-[0.6rem] rounded p-1.5 whitespace-nowrap shadow-lg">
            {icon} {a.name}{a.spellLevel !== undefined ? ` (${a.spellLevel === 0 ? "Cantrip" : `Lv ${a.spellLevel}`})` : ""}
            {a.requiresTarget && " · Requires target"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gold/5 border-2 border-gold/40 rounded-sketch p-3 space-y-3">
      {/* Header with HP and end turn */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-xs font-bold text-ink">Your Turn — {character.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-20 h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
            </div>
            <span className="font-mono text-[0.6rem] text-ink-faded">{character.currentHp}/{character.maxHp} HP</span>
          </div>
        </div>
        <button onClick={onEndTurn}
          className="font-sans font-bold text-xs text-white bg-sage border border-sage rounded p-1.5 hover:bg-sage/80 transition-all shrink-0">
          End Turn →
        </button>
      </div>

      {/* Movement counter */}
      <div className="bg-parchment border border-sketch rounded p-2 flex items-center justify-between">
        <div>
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded">Movement</p>
          <p className={`font-mono text-lg font-bold leading-none ${ftColor}`}>{movementLeft}ft</p>
        </div>
        <div className="text-right">
          <p className="font-sans text-[0.55rem] text-ink-faded">of {character.speed}ft</p>
          <p className="font-sans text-[0.55rem] text-ink-faded">5ft per cell</p>
        </div>
        <span className="text-xl">🦶</span>
      </div>

      {/* Active action inline panel */}
      {activeAction && (
        <ActionRollPanel
          action={activeAction}
          character={character}
          order={order}
          characters={characters}
          npcs={npcs}
          campaignId={campaignId}
          combatSessionId={combatSessionId}
          onDone={(slot) => { onActionUsed(slot, activeAction.name); setActiveAction(null); }}
          onClose={() => setActiveAction(null)}
        />
      )}

      {/* Action slots */}
      {!activeAction && SLOT_CONFIG.map((slot) => (
        <div key={slot.key}>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded flex-1">{slot.label}</p>
            {slot.used && <span className="font-sans text-[0.55rem] font-bold text-blush border border-blush/30 rounded p-0.5">✓ Used</span>}
          </div>
          {slot.used ? (
            <p className="font-sans text-xs text-ink-faded italic">Slot used this turn.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1">
                {slot.actions.map((a) => <ActionButton key={a.name} a={a} />)}
              </div>
              {slot.cantrips.length > 0 && (
                <>
                  <p className="font-sans text-[0.55rem] font-bold uppercase tracking-widest text-dusty-blue/70 mt-1">Cantrips</p>
                  <div className="grid grid-cols-2 gap-1">
                    {slot.cantrips.map((a) => <ActionButton key={a.name} a={a} />)}
                  </div>
                </>
              )}
              {slot.spells.length > 0 && (
                <>
                  <p className="font-sans text-[0.55rem] font-bold uppercase tracking-widest text-dusty-blue mt-1">Spells</p>
                  <div className="grid grid-cols-2 gap-1">
                    {slot.spells.map((a) => <ActionButton key={a.name} a={a} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Action Log Tab ────────────────────────────────────────────────────────────

function ActionLogTab({ campaignId }: { campaignId: string }) {
  const [logs,    setLogs]    = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    fetch(`/api/campaigns/${campaignId}/action-log`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: ActionLogEntry[]) => setLogs(data))
      .catch(() => setLogs([]));
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/campaigns/${campaignId}/action-log`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: ActionLogEntry[]) => { if (!cancelled) setLogs(data); })
      .catch(() => { if (!cancelled) setLogs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId]);

  const ACTION_ICONS: Record<string, string> = {
    COMBAT_ATTACK: "⚔️", COMBAT_SPELL: "🔮", COMBAT_MOVE: "💨",
    COMBAT_OTHER: "🎲", LEVEL_UP: "⬆️", INSPIRATION_AWARDED: "✦",
    INSPIRATION_SPENT: "✦", HP_CHANGE: "❤️", CAMPAIGN_EVENT: "📜",
  };

  if (loading) return (
    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
  );

  if (logs.length === 0) return (
    <div className="text-center py-8">
      <p className="text-2xl mb-2">📜</p>
      <p className="font-sans text-sm text-ink-faded">No actions recorded yet.</p>
    </div>
  );

  return (
    <div className="space-y-1">
      <button type="button" onClick={fetchLogs}
        className="w-full font-sans text-xs text-ink-faded border border-sketch rounded p-1.5 hover:bg-parchment transition-all mb-2">
        ↻ Refresh
      </button>
      {logs.map((log) => (
        <div key={log.id} className="bg-parchment border border-sketch rounded p-2">
          <div className="flex items-start gap-1.5">
            <span className="text-sm shrink-0">{ACTION_ICONS[log.actionType] ?? "📜"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs text-ink leading-snug">{log.description}</p>
              {log.result && <p className="font-mono text-xs text-ink-faded mt-0.5">{log.result}</p>}
              <p className="font-sans text-[0.55rem] text-ink-faded mt-0.5">
                {log.character?.name ?? log.user.displayName ?? log.user.name} · {timeAgo(log.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Canvas Board ──────────────────────────────────────────────────────────────

const CELL = 50;

interface Token {
  key: string; label: string; initials: string; color: string;
  avatarUrl: string | null; col: number; row: number;
  isDowned: boolean; isCurrentUser: boolean; canDrag: boolean; isActiveTurn: boolean;
  isTarget?: boolean;
}

function CanvasBoard({ board, characters, npcs, currentUserId, isDM, campaignId, onBoardUpdate, combatActive, isMyTurn, movementLeft, onMovementUsed, selectedTargetKey, onTokenClick, turnResetKey }: {
  board: Board; characters: Character[]; npcs: NPC[];
  currentUserId: string; isDM: boolean; campaignId: string;
  onBoardUpdate: (s: BoardState) => void;
  combatActive: boolean;
  isMyTurn: boolean;
  movementLeft: number;
  onMovementUsed: (ftUsed: number) => void;
  selectedTargetKey: string | null;
  onTokenClick: (key: string, name: string) => void;
  turnResetKey: number;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImgRef    = useRef<HTMLImageElement | null>(null);
  const mapLoadedRef = useRef(false);
  const offsetRef    = useRef({ x: 0, y: 0 });
  const scaleRef     = useRef(1);
  const draggingRef  = useRef<{ key: string; origCol: number; origRow: number } | null>(null);
  const dragPosRef   = useRef<{ col: number; row: number } | null>(null);
  const panningRef   = useRef(false);
  const panStartRef  = useRef({ x: 0, y: 0 });
  const originRef    = useRef<{ col: number; row: number } | null>(null);
  const lastPosRef   = useRef<{ col: number; row: number } | null>(null);

  // Reset movement origin when turn changes
  useEffect(() => {
    originRef.current  = null;
    lastPosRef.current = null;
  }, [turnResetKey]);

  const boardState = useMemo(
    (): BoardState => (board.boardState as BoardState | null) ?? { tokens: {} },
    [board.boardState],
  );

  const currentTurnKey = useMemo(() => {
    const order = boardState.initiativeOrder ?? [];
    return order[boardState.currentTurnIndex ?? 0]?.key ?? null;
  }, [boardState]);

  const buildTokens = useCallback((): Token[] => {
    const COLORS = ["#C1636A","#6A8FC1","#6AC18A","#C1A86A","#9B6AC1","#6AC1BB","#C16A9B"];
    const tokens: Token[] = [];
    characters.forEach((c, i) => {
      const key = `char_${c.id}`;
      const pos = boardState.tokens?.[key] ?? { col: i % 8, row: 0 };
      const isMe = c.user.id === currentUserId;
      const canDragChar = isDM ? true : (isMe && (!combatActive || isMyTurn));
      tokens.push({ key, label: c.name, initials: c.name.slice(0, 2).toUpperCase(), color: COLORS[i % COLORS.length], avatarUrl: c.avatarUrl, col: pos.col, row: pos.row, isDowned: c.currentHp <= 0, isCurrentUser: isMe, canDrag: canDragChar, isActiveTurn: key === currentTurnKey });
    });
    npcs.forEach((n, i) => {
      const key = `npc_${n.id}`;
      const pos = boardState.tokens?.[key] ?? { col: (characters.length + i) % 8, row: 0 };
      tokens.push({ key, label: n.name, initials: n.name.slice(0, 2).toUpperCase(), color: "#8B4040", avatarUrl: n.avatarUrl, col: pos.col, row: pos.row, isDowned: n.currentHp <= 0, isCurrentUser: false, canDrag: isDM, isActiveTurn: key === currentTurnKey, isTarget: key === selectedTargetKey });
    });
    return tokens;
  }, [boardState, characters, npcs, currentUserId, isDM, currentTurnKey, combatActive, isMyTurn, selectedTargetKey]);

  const tokensRef = useRef<Token[]>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);
    ctx.fillStyle = "#F5F0E8";
    ctx.fillRect(0, 0, W / scaleRef.current + 200, H / scaleRef.current + 200);
    if (mapImgRef.current && mapLoadedRef.current) {
      ctx.drawImage(mapImgRef.current, 0, 0, W / scaleRef.current, H / scaleRef.current);
    }
    const cols = Math.ceil(W / (CELL * scaleRef.current)) + 4;
    const rows = Math.ceil(H / (CELL * scaleRef.current)) + 4;
    ctx.strokeStyle = "rgba(100,90,80,0.18)"; ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, rows * CELL); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(cols * CELL, r * CELL); ctx.stroke(); }
    // Draw movement range highlight when it's the player's turn
    if (combatActive && isMyTurn && originRef.current && movementLeft > 0) {
      const maxCells = Math.floor(movementLeft / 5);
      const { col: oc, row: or_ } = originRef.current;
      ctx.fillStyle = "rgba(106, 193, 138, 0.15)"; // sage green, semi-transparent
      ctx.strokeStyle = "rgba(106, 193, 138, 0.4)";
      ctx.lineWidth = 0.5;
      // Draw reachable cells using manhattan distance from origin
      for (let dc = -maxCells; dc <= maxCells; dc++) {
        for (let dr = -maxCells; dr <= maxCells; dr++) {
          if (Math.abs(dc) + Math.abs(dr) <= maxCells) {
            const cellCol = oc + dc;
            const cellRow = or_ + dr;
            if (cellCol >= 0 && cellRow >= 0) {
              ctx.fillRect(cellCol * CELL + 1, cellRow * CELL + 1, CELL - 2, CELL - 2);
              ctx.strokeRect(cellCol * CELL + 1, cellRow * CELL + 1, CELL - 2, CELL - 2);
            }
          }
        }
      }
    }

    tokensRef.current.forEach((t) => {
      const isDragging = draggingRef.current?.key === t.key;
      const col = isDragging && dragPosRef.current ? dragPosRef.current.col : t.col;
      const row = isDragging && dragPosRef.current ? dragPosRef.current.row : t.row;
      const cx = col * CELL + CELL / 2; const cy = row * CELL + CELL / 2; const r = CELL * 0.38;
      if (t.isActiveTurn) {
        ctx.save(); ctx.shadowColor = "#C1A86A"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#C1A86A"; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }
      if (t.isTarget) {
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#C1636A"; ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = isDragging ? 12 : 4; ctx.shadowOffsetY = isDragging ? 4 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = t.isDowned ? "#888" : t.color; ctx.fill();
      ctx.strokeStyle = t.isCurrentUser ? "#fff" : "rgba(255,255,255,0.6)";
      ctx.lineWidth = t.isCurrentUser ? 2.5 : 1.5; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.round(CELL * 0.28)}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.initials, cx, cy);
      if (t.isDowned) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - r * 0.4, cy - r * 0.4); ctx.lineTo(cx + r * 0.4, cy + r * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + r * 0.4, cy - r * 0.4); ctx.lineTo(cx - r * 0.4, cy + r * 0.4); ctx.stroke();
      }
      ctx.fillStyle = "rgba(30,25,20,0.85)"; ctx.font = `${Math.round(CELL * 0.18)}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(t.label.length > 10 ? t.label.slice(0, 9) + "…" : t.label, cx, cy + r + 3);
    });
    ctx.restore();
  }, [combatActive, isMyTurn, movementLeft]);

  useEffect(() => { tokensRef.current = buildTokens(); draw(); }, [buildTokens, draw]);

  useEffect(() => {
    if (!board.activeMap) { mapImgRef.current = null; mapLoadedRef.current = false; draw(); return; }
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { mapImgRef.current = img; mapLoadedRef.current = true; draw(); };
    img.src = board.activeMap.url;
  }, [board.activeMap, draw]);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current; const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth; canvas.height = container.clientHeight;
      draw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  function canvasToWorld(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      wx: (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current,
      wy: (e.clientY - rect.top  - offsetRef.current.y) / scaleRef.current,
    };
  }

  function hitToken(wx: number, wy: number): Token | null {
    for (let i = tokensRef.current.length - 1; i >= 0; i--) {
      const t = tokensRef.current[i];
      const cx = t.col * CELL + CELL / 2; const cy = t.row * CELL + CELL / 2;
      if (Math.hypot(wx - cx, wy - cy) <= CELL * 0.38) return t;
    }
    return null;
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { wx, wy } = canvasToWorld(e);
    if (e.button === 1 || e.button === 2) {
      panningRef.current = true;
      panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
      return;
    }
    const token = hitToken(wx, wy);
    if (token) {
      if (token.canDrag) {
        // Set origin on first drag of turn
        if (!originRef.current) {
          originRef.current = { col: token.col, row: token.row };
          lastPosRef.current = { col: token.col, row: token.row };
        }
        draggingRef.current = { key: token.key, origCol: token.col, origRow: token.row };
        dragPosRef.current  = { col: token.col, row: token.row };
        return;
      } else {
        // Clicking a non-draggable token = target selection
        onTokenClick(token.key, token.label);
        return;
      }
    }
    panningRef.current  = true;
    panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      offsetRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
      draw(); return;
    }
    if (draggingRef.current) {
      const { wx, wy } = canvasToWorld(e);
      dragPosRef.current = { col: Math.floor(wx / CELL), row: Math.floor(wy / CELL) };
      draw();
    }
  }

  async function onMouseUp() {
    if (panningRef.current) { panningRef.current = false; return; }
    if (draggingRef.current && dragPosRef.current) {
      const { key } = draggingRef.current;
      const { col, row } = dragPosRef.current;
      const token = tokensRef.current.find((t) => t.key === key);

      // Movement cost: manhattan distance from last position × 5ft per cell
      if (combatActive && isMyTurn && token?.isCurrentUser && lastPosRef.current) {
        const ftUsed = (Math.abs(col - lastPosRef.current.col) + Math.abs(row - lastPosRef.current.row)) * 5;
        if (ftUsed > 0) onMovementUsed(ftUsed);
        lastPosRef.current = { col, row };
      }

      if (token) { token.col = col; token.row = row; }
      const newTokens = { ...(boardState.tokens ?? {}), [key]: { col, row } };
      const newState: BoardState = { ...boardState, tokens: newTokens };
      draggingRef.current = null; dragPosRef.current = null; draw();
      onBoardUpdate(newState);
      await fetch(`/api/campaigns/${campaignId}/board`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardState: newState }),
      });
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta    = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(4, Math.max(0.25, scaleRef.current * delta));
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
    offsetRef.current = {
      x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale; draw();
  }

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: "520px" }}>
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ display: "block", touchAction: "none" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onWheel={onWheel} onContextMenu={(e) => e.preventDefault()} />
      <div className="absolute bottom-3 left-3 bg-ink/50 backdrop-blur-sm rounded-sketch p-2 pointer-events-none">
        <p className="font-sans text-[0.6rem] text-warm-white">Scroll to zoom · Drag to pan · Drag tokens to move</p>
      </div>
      {board.activeMap && (
        <div className="absolute bottom-3 right-3 bg-ink/50 backdrop-blur-sm rounded-sketch p-2 pointer-events-none">
          <p className="font-sans text-xs text-warm-white">🗺️ {board.activeMap.name}</p>
        </div>
      )}
    </div>
  );
}

// ── Character Sheet Modal ─────────────────────────────────────────────────────

function CharacterSheetModal({ character, onClose }: { character: Character; onClose: () => void }) {
  const primaryClass = character.classes?.[0];
  const isDowned     = character.currentHp <= 0;
  const hpPct        = Math.min(100, Math.round((character.currentHp / character.maxHp) * 100));
  const hpColor      = hpPct > 60 ? "bg-sage" : hpPct > 30 ? "bg-gold" : "bg-blush";

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-sketch">
          <div className="flex items-center gap-3">
            <Avatar src={character.avatarUrl} size={44} className={`border-2 ${isDowned ? "grayscale border-blush/40" : "border-sketch"}`} />
            <div>
              <h2 className="font-display text-2xl text-ink leading-tight">{character.name}</h2>
              <p className="font-sans text-xs text-ink-faded">
                {character.race?.name ?? "Unknown"}{primaryClass ? ` · ${primaryClass.class.name}` : ""} · Level {character.level}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-ink-faded">Hit Points</span>
              <span className="font-mono text-sm font-bold text-ink">
                {character.currentHp}/{character.maxHp}
                {character.temporaryHp > 0 && <span className="text-dusty-blue"> +{character.temporaryHp}</span>}
              </span>
            </div>
            <div className="h-3 bg-parchment border border-sketch rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
            </div>
            {isDowned && <p className="font-sans text-xs text-blush mt-1 font-semibold">⚠️ Character is down</p>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "AC",    value: character.armorClass },
              { label: "Speed", value: `${character.speed}ft` },
              { label: "Init",  value: `${character.initiative >= 0 ? "+" : ""}${character.initiative}` },
              { label: "Level", value: character.level },
            ].map((s) => (
              <div key={s.label} className="bg-parchment border border-sketch rounded-sketch p-2 text-center">
                <p className="font-mono text-base font-bold text-ink">{s.value}</p>
                <p className="font-sans text-[0.55rem] text-ink-faded uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
          {character.classes.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Classes</p>
              <div className="flex flex-wrap gap-1.5">
                {character.classes.map((cc, i) => (
                  <span key={i} className="font-sans text-xs bg-parchment border border-sketch rounded p-1.5">{cc.class.name} {cc.level}</span>
                ))}
              </div>
            </div>
          )}
          {character.conditions.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Conditions</p>
              <div className="flex flex-wrap gap-1">
                {character.conditions.map((c) => (
                  <span key={c} className="font-sans text-xs font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded p-1">{c}</span>
                ))}
              </div>
            </div>
          )}
          {character.features.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Features</p>
              <div className="space-y-1">
                {character.features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-parchment border border-sketch rounded p-2">
                    <span className="font-sans text-xs text-ink">✨ {f.feature.name}</span>
                    {f.feature.actionType && <span className="font-sans text-[0.55rem] text-ink-faded uppercase">{f.feature.actionType}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {character.spells.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Spells</p>
              <div className="space-y-1">
                {character.spells.map((s) => (
                  <div key={s.spell.id} className="flex items-center justify-between bg-dusty-blue/5 border border-dusty-blue/20 rounded p-2">
                    <span className="font-sans text-xs text-dusty-blue">🔮 {s.spell.name}</span>
                    <span className="font-sans text-[0.55rem] text-ink-faded">
                      {s.spell.level === 0 ? "Cantrip" : `Level ${s.spell.level}`} · {s.spell.castingTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {character.inspiration && (
            <div className="bg-gold/10 border border-gold/30 rounded-sketch p-3 text-center">
              <p className="font-sans text-sm font-bold text-gold">✦ Inspired</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Character Status Card ─────────────────────────────────────────────────────

function CharacterStatusCard({ character, isCurrentUser }: { character: Character; isCurrentUser: boolean }) {
  const primaryClass = character.classes?.[0];
  const isDowned     = character.currentHp <= 0;
  return (
    <div className={`bg-warm-white border-2 rounded-sketch shadow-sketch p-3 ${isDowned ? "border-blush/50 opacity-75" : isCurrentUser ? "border-blush/30" : "border-sketch"}`}>
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar src={character.avatarUrl} size={38} className={`border-2 ${isDowned ? "grayscale border-blush/40" : isCurrentUser ? "border-blush/40" : "border-sketch"}`} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ink border border-ink rounded-full flex items-center justify-center">
            <span className="font-mono text-[0.45rem] font-bold text-warm-white">{character.level}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <p className="font-display text-sm text-ink truncate">{character.name}</p>
            {isCurrentUser && <span className="font-sans text-[0.5rem] font-bold uppercase bg-blush/10 text-blush border border-blush/30 rounded p-0.5 shrink-0">You</span>}
            {isDowned      && <span className="font-sans text-[0.5rem] font-bold uppercase bg-blush/20 text-blush border border-blush/40 rounded p-0.5 shrink-0">Down</span>}
            {character.inspiration && <span className="font-sans text-[0.5rem] font-bold uppercase bg-gold/20 text-gold border border-gold/40 rounded p-0.5 shrink-0">✦</span>}
          </div>
          <p className="font-sans text-[0.6rem] text-ink-faded mb-1.5">
            {character.race?.name ?? "?"}{primaryClass ? ` · ${primaryClass.class.name}` : ""} · {character.user.displayName ?? character.user.name ?? "Player"}
          </p>
          <HpBar current={character.currentHp} max={character.maxHp} temporary={character.temporaryHp} />
          <div className="flex gap-3 mt-1.5">
            <div className="text-center"><p className="font-mono text-xs font-bold text-ink">{character.armorClass}</p><p className="font-sans text-[0.5rem] text-ink-faded uppercase">AC</p></div>
            <div className="text-center"><p className="font-mono text-xs font-bold text-ink">{character.speed}ft</p><p className="font-sans text-[0.5rem] text-ink-faded uppercase">SPD</p></div>
          </div>
          {character.conditions.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {character.conditions.map((c) => <span key={c} className="font-sans text-[0.45rem] font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded p-0.5">{c}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterCardWithModal({ character, isCurrentUser }: { character: Character; isCurrentUser: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
        <CharacterStatusCard character={character} isCurrentUser={isCurrentUser} />
      </div>
      {open && <CharacterSheetModal character={character} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Board Page ────────────────────────────────────────────────────────────────

export default function CampaignBoardPage() {
  const params     = useParams();
  const router     = useRouter();
  const campaignId = params.campaignId as string;

  const [board,           setBoard]           = useState<Board | null>(null);
  const [characters,      setCharacters]      = useState<Character[]>([]);
  const [npcs,            setNpcs]            = useState<NPC[]>([]);
  const [assets,          setAssets]          = useState<MapAsset[]>([]);
  const [currentUser,     setCurrentUser]     = useState<SessionUser | null>(null);
  const [isDM,            setIsDM]            = useState(false);
  const [campaignName,    setCampaignName]    = useState("");
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [sidebarTab,      setSidebarTab]      = useState<"party" | "log">("party");
  const [showStartCombat, setShowStartCombat] = useState(false);
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [movementLeft,       setMovementLeft]       = useState(0);
  const [turnResetKey,       setTurnResetKey]       = useState(0);
  const [selectedTargetKey,  setSelectedTargetKey]  = useState<string | null>(null);
  const [selectedTargetName, setSelectedTargetName] = useState<string | null>(null);
  const [externalRolls,      setExternalRolls]      = useState<Record<string, number>>({});
  const [notifyPendingKeys,   setNotifyPendingKeys]   = useState<string[]>([]);
  const isDMRef   = useRef(false);

  const loadData = useCallback(async () => {
    const [sessionRes, boardRes, campaignRes, npcsRes] = await Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}/board`).then((r) => { if (!r.ok) throw new Error("Failed to load board"); return r.json(); }),
      fetch(`/api/campaigns/${campaignId}`).then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
      fetch(`/api/campaigns/${campaignId}/npcs`).then((r) => r.ok ? r.json() : []),
    ]);
    if (!sessionRes?.data?.user) { router.push("/login"); return null; }
    const user       = sessionRes.data.user as SessionUser;
    const membership = campaignRes.members?.find((m: { user: { id: string }; role: string }) => m.user.id === user.id);
    return {
      user,
      isDM:        membership?.role === "DM",
      campaignName: campaignRes.name,
      board:       boardRes.board,
      characters:  boardRes.characters,
      assets:      boardRes.assets,
      npcs:        npcsRes,
    };
  }, [campaignId, router]);

  useEffect(() => {
    let active = true;
    loadData()
      .then((r) => {
        if (!active || !r) return;
        setCurrentUser(r.user); setIsDM(r.isDM); setCampaignName(r.campaignName);
        setBoard(r.board); setCharacters(r.characters); setAssets(r.assets); setNpcs(r.npcs);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData]);

  // Keep isDMRef in sync so Pusher callbacks always see current value
  useEffect(() => { isDMRef.current = isDM; }, [isDM]);

  // Derive modal visibility from notifyPendingKeys whenever characters/user loads
  useEffect(() => {
    if (isDM || notifyPendingKeys.length === 0) return;
    const myC = characters.find((c) => c.user.id === currentUser?.id);
    if (myC && notifyPendingKeys.includes(`char_${myC.id}`)) {
      setShowInitiativeModal(true);
    }
  }, [notifyPendingKeys, characters, currentUser, isDM]);

  // ── Pusher realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    // 30s background refresh for HP/conditions and NPC state
    const charInterval = setInterval(() => {
      Promise.all([
        fetch(`/api/campaigns/${campaignId}/board`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/campaigns/${campaignId}/npcs`).then((r) => r.ok ? r.json() : null),
      ]).then(([boardData, npcsData]) => {
        if (boardData) setCharacters(boardData.characters);
        if (npcsData)  setNpcs(npcsData);
      }).catch(() => { /* silent */ });
    }, 30000);

    const pusher = getPusherClient();
    if (!pusher) return () => clearInterval(charInterval);

    const channel = pusher.subscribe(`campaign-${campaignId}`);

    function applyBoardState(incoming: BoardState) {
      setBoard((prev) => {
        if (!prev) return prev;
        const prevState = prev.boardState ?? { tokens: {} };
        const merged: BoardState = {
          ...prevState,
          ...incoming,
          tokens:         { ...(prevState.tokens ?? {}), ...(incoming.tokens ?? {}) },
          initiativeOrder: incoming.initiativeOrder ?? prevState.initiativeOrder,
        };
        return { ...prev, boardState: merged };
      });
    }

    channel.bind(PUSHER_EVENTS.BOARD_UPDATED,     (data: { board: Board })          => { setBoard(data.board); });
    channel.bind(PUSHER_EVENTS.COMBAT_STARTED, (data: { board: Board }) => {
      setBoard(data.board);
      setShowInitiativeModal(false);
      setNotifyPendingKeys([]);
    });
    channel.bind(PUSHER_EVENTS.COMBAT_ENDED,      (data: { boardState: BoardState }) => { applyBoardState(data.boardState); });
    channel.bind(PUSHER_EVENTS.TURN_ADVANCED,     (data: { boardState: BoardState }) => { applyBoardState(data.boardState); });
    channel.bind(PUSHER_EVENTS.INITIATIVE_ROLLED, (data: { boardState: BoardState; characterId?: string; total?: number }) => {
      applyBoardState(data.boardState);
      // Update DM's modal with the player's roll
      if (data.characterId && data.total !== undefined) {
        setExternalRolls((prev) => ({ ...prev, [`char_${data.characterId}`]: data.total! }));
      }
    });
    channel.bind(PUSHER_EVENTS.INITIATIVE_NOTIFY, (data: { pendingKeys: string[] }) => {
      if (isDMRef.current) return;
      setNotifyPendingKeys(data.pendingKeys);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`campaign-${campaignId}`);
      clearInterval(charInterval);
    };
  }, [campaignId]);

  const refresh = useCallback(() => {
    loadData().then((r) => {
      if (!r) return;
      setBoard(r.board); setCharacters(r.characters); setAssets(r.assets); setNpcs(r.npcs);
    });
  }, [loadData]);

  function handleBoardUpdate(newState: BoardState) {
    setBoard((prev) => prev ? { ...prev, boardState: newState } : prev);
  }

  async function handleEndTurn() {
    const res  = await fetch(`/api/campaigns/${campaignId}/combat/turn`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next_turn" }),
    });
    const data = await res.json();
    if (data.boardState) {
      // Use same deep merge as applyBoardState so currentTurnIndex updates locally
      setBoard((prev) => {
        if (!prev) return prev;
        const prevState = prev.boardState ?? { tokens: {} };
        const merged: BoardState = {
          ...prevState,
          ...data.boardState,
          tokens: { ...(prevState.tokens ?? {}), ...(data.boardState.tokens ?? {}) },
          initiativeOrder: data.boardState.initiativeOrder ?? prevState.initiativeOrder,
        };
        return { ...prev, boardState: merged };
      });
    }
    setMovementLeft(0);
    setSelectedTargetKey(null);
  }

  async function handleNextTurn() {
    const res  = await fetch(`/api/campaigns/${campaignId}/combat/turn`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next_turn" }),
    });
    const data = await res.json();
    if (data.boardState) handleBoardUpdate(data.boardState);
  }

  async function handleEndCombat() {
    if (!confirm("End combat? This will close the current combat session.")) return;
    const res  = await fetch(`/api/campaigns/${campaignId}/combat/turn`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end_combat" }),
    });
    const data = await res.json();
    if (data.boardState) handleBoardUpdate(data.boardState);
  }

  function handleActionUsed(slot: "action" | "bonus" | "reaction", actionName?: string) {
    if (!myChar) return;
    const key = `char_${myChar.id}`;
    setBoard((prev) => {
      if (!prev?.boardState) return prev;
      const bs      = prev.boardState as BoardState;
      const updated = (bs.initiativeOrder ?? []).map((e) => e.key === key ? {
        ...e,
        actionUsed:      slot === "action"   ? true : e.actionUsed,
        bonusActionUsed: slot === "bonus"    ? true : e.bonusActionUsed,
        reactionUsed:    slot === "reaction" ? true : e.reactionUsed,
      } : e);
      return { ...prev, boardState: { ...bs, initiativeOrder: updated } };
    });
    // Dash adds movement equal to speed
    if (actionName === "Dash" && myChar) {
      setMovementLeft((prev) => prev + myChar.speed);
    }
  }

  const boardState       = board?.boardState as BoardState | null;
  const combatActive     = (boardState?.combatActive ?? board?.combatActive) ?? false;
  const initiativeOrder  = boardState?.initiativeOrder ?? [];
  const currentTurnIndex = boardState?.currentTurnIndex ?? 0;
  const round            = boardState?.round ?? 1;
  const combatSessionId  = boardState?.combatSessionId ?? null;

  const myChar   = characters.find((c) => c.user.id === currentUser?.id);
  const myEntry  = myChar ? initiativeOrder.find((e) => e.key === `char_${myChar.id}`) : null;
  const isMyTurn = !isDM && !!myEntry && initiativeOrder[currentTurnIndex]?.key === `char_${myChar?.id}`;

  // Reset movement, origin, and target when turn changes
  const prevTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    if (currentTurnIndex !== prevTurnIndexRef.current) {
      prevTurnIndexRef.current = currentTurnIndex;
      setMovementLeft(isMyTurn && myChar ? myChar.speed : 0);
      setSelectedTargetKey(null);
      setSelectedTargetName(null);
      setTurnResetKey((k) => k + 1);
    }
  }, [currentTurnIndex, isMyTurn, myChar]);

  // Set movement on combat start
  useEffect(() => {
    if (combatActive && isMyTurn && myChar) setMovementLeft(myChar.speed);
  }, [combatActive, isMyTurn, myChar]);

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

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch p-3 sticky top-0 z-40">
        <div className="max-w-full mx-auto flex items-center gap-3 flex-wrap">
          <Link href={`/campaigns/${campaignId}`} className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">← Campaign</Link>
          <span className="text-sketch">/</span>
          {loading ? <Skeleton className="h-4 w-32" /> : <span className="font-display text-lg text-ink">{campaignName}</span>}
          <span className="text-sketch">/</span>
          <span className="font-display text-lg text-ink">Session Board</span>
          {combatActive && <span className="font-sans text-[0.6rem] font-bold uppercase tracking-wider bg-blush/10 text-blush border border-blush/30 rounded p-0.5">⚔️ Combat</span>}

          {isDM && !loading && board && (
            <div className="ml-auto flex items-center gap-2">
              {!combatActive && <MapPicker assets={assets} activeMapId={board.activeMapId} campaignId={campaignId} onChanged={(newAssets) => { if (newAssets) setAssets(newAssets); refresh(); }} />}
              {!combatActive && (
                <Link href={`/campaigns/${campaignId}/board/npcs`}>
                  <button className="font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">👹 NPCs</button>
                </Link>
              )}
              {!combatActive && (
                <button onClick={() => setShowStartCombat(true)}
                  className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all flex items-center gap-2">
                  ⚔️ Start Combat
                </button>
              )}
              {combatActive && (
                <button onClick={handleEndCombat}
                  className="font-sans font-bold text-sm text-blush border-2 border-blush/40 rounded-sketch p-2 hover:bg-blush/10 transition-all flex items-center gap-2">
                  ✕ End Combat
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0" style={{ height: "calc(100vh - 57px)" }}>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? <Skeleton className="w-full h-full" /> : board ? (
            <CanvasBoard board={board} characters={characters} npcs={npcs}
              currentUserId={currentUser?.id ?? ""} isDM={isDM}
              campaignId={campaignId} onBoardUpdate={handleBoardUpdate}
              combatActive={combatActive} isMyTurn={isMyTurn}
              movementLeft={movementLeft}
              onMovementUsed={(ftUsed) => setMovementLeft((prev) => Math.max(0, prev - ftUsed))}
              selectedTargetKey={selectedTargetKey}
              onTokenClick={(key, name) => { setSelectedTargetKey(key); setSelectedTargetName(name); }}
              turnResetKey={turnResetKey}
            />
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 bg-warm-white border-l-2 border-sketch flex flex-col">
          <div className="flex border-b-2 border-sketch shrink-0">
            {(["party", "log"] as const).map((tab) => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 font-sans font-semibold text-xs uppercase tracking-wider p-3 transition-colors ${sidebarTab === tab ? "bg-parchment text-ink border-b-2 border-blush" : "text-ink-faded hover:text-ink"}`}>
                {tab === "party" ? "⚔️ Party" : "📜 Log"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {sidebarTab === "party" && (
              <>
                {/* Combat tracker */}
                {combatActive && initiativeOrder.length > 0 && (
                  <InitiativeTracker
                    order={initiativeOrder} currentIndex={currentTurnIndex}
                    round={round} isDM={isDM}
                    currentUserId={currentUser?.id ?? ""}
                    characters={characters} npcs={npcs} campaignId={campaignId}
                    combatSessionId={combatSessionId}
                    onNextTurn={handleNextTurn} onEndCombat={handleEndCombat}
                    onActionUsed={handleActionUsed}
                    movementLeft={movementLeft}
                    selectedTargetKey={selectedTargetKey}
                    selectedTargetName={selectedTargetName}
                    onEndTurn={handleEndTurn}
                  />
                )}

                {/* Party status (exploration mode) */}
                {!combatActive && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Party Status</p>
                      <span className="font-mono text-xs text-ink-faded">{characters.length} active</span>
                    </div>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                    ) : characters.length === 0 ? (
                      <div className="bg-parchment border-2 border-dashed border-sketch rounded-sketch p-4 text-center">
                        <p className="text-xl mb-1">🧙</p>
                        <p className="font-sans text-xs text-ink-faded">No active characters.</p>
                      </div>
                    ) : (
                      characters.map((c) => (
                        <CharacterCardWithModal key={c.id} character={c} isCurrentUser={c.user.id === currentUser?.id} />
                      ))
                    )}
                  </>
                )}

                {/* NPC list (DM only, exploration mode) */}
                {isDM && npcs.length > 0 && !combatActive && (
                  <div className="border-t border-sketch p-2">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">NPCs</p>
                    <div className="space-y-1">
                      {npcs.map((n) => {
                        const pct   = Math.min(100, Math.round((n.currentHp / n.maxHp) * 100));
                        const color = pct > 60 ? "bg-sage" : pct > 30 ? "bg-gold" : "bg-blush";
                        return (
                          <div key={n.id} className="bg-parchment border border-sketch rounded p-2 flex items-center gap-2">
                            <span className="text-sm shrink-0">👹</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-sans text-xs text-ink truncate">{n.name}</p>
                              <div className="h-1 bg-warm-white border border-sketch rounded-full overflow-hidden mt-0.5">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="font-mono text-[0.6rem] text-ink-faded shrink-0">{n.currentHp}/{n.maxHp}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DM Tools */}
                {isDM && !combatActive && (
                  <div className="border-t border-sketch p-2 space-y-2">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">DM Tools</p>
                    <button onClick={() => setShowStartCombat(true)}
                      className="w-full font-sans font-semibold text-sm text-white bg-blush border-2 border-blush rounded-sketch p-2 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch-accent flex items-center gap-2">
                      ⚔️ Start Combat
                    </button>
                    <button onClick={refresh}
                      className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">
                      ↻ Refresh Board
                    </button>
                  </div>
                )}
              </>
            )}

            {sidebarTab === "log" && <ActionLogTab campaignId={campaignId} />}
          </div>
        </div>
      </div>

      {showInitiativeModal && myChar && (
        <InitiativeRollModal
          character={myChar}
          campaignId={campaignId}
          onClose={() => { setShowInitiativeModal(false); setNotifyPendingKeys([]); }}
        />
      )}

      {showStartCombat && (
        <StartCombatModal
          characters={characters} npcs={npcs} campaignId={campaignId}
          externalRolls={externalRolls}
          onStarted={(bs) => {
            setBoard((prev) => prev ? { ...prev, combatActive: true, boardState: bs } : prev);
            setShowStartCombat(false);
            setSidebarTab("party");
            setShowInitiativeModal(false);
            setNotifyPendingKeys([]);
            setExternalRolls({});
          }}
          onClose={() => { setShowStartCombat(false); setExternalRolls({}); }}
        />
      )}
    </div>
  );
}