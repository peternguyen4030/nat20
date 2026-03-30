"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attack {
  name:        string;
  toHit:       number;
  damageDice:  string;
  damageType:  string;
}

interface NPC {
  id:                 string;
  name:               string;
  maxHp:              number;
  currentHp:          number;
  armorClass:         number;
  speed:              number;
  initiativeModifier: number;
  attacks:            Attack[] | null;
  conditions:         string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function StatInput({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number;
}) {
  return (
    <div>
      <label className="block font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">{label}</label>
      <input
        type="number" min={min} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full font-mono text-sm bg-parchment text-ink border-2 border-sketch rounded-input p-1.5 outline-none focus:border-blush transition-colors text-center"
      />
    </div>
  );
}

// ── Attack Row ────────────────────────────────────────────────────────────────

function AttackRow({ attack, onChange, onRemove }: {
  attack: Attack;
  onChange: (a: Attack) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      <div className="col-span-4">
        <label className="block font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Name</label>
        <input
          type="text" value={attack.name} placeholder="Shortsword"
          onChange={(e) => onChange({ ...attack, name: e.target.value })}
          className="w-full font-sans text-xs bg-parchment text-ink border-2 border-sketch rounded-input p-1.5 outline-none focus:border-blush transition-colors"
        />
      </div>
      <div className="col-span-2">
        <label className="block font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">To Hit</label>
        <input
          type="number" value={attack.toHit} placeholder="+4"
          onChange={(e) => onChange({ ...attack, toHit: Number(e.target.value) })}
          className="w-full font-mono text-xs bg-parchment text-ink border-2 border-sketch rounded-input p-1.5 outline-none focus:border-blush transition-colors text-center"
        />
      </div>
      <div className="col-span-3">
        <label className="block font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Damage</label>
        <input
          type="text" value={attack.damageDice} placeholder="1d6+2"
          onChange={(e) => onChange({ ...attack, damageDice: e.target.value })}
          className="w-full font-mono text-xs bg-parchment text-ink border-2 border-sketch rounded-input p-1.5 outline-none focus:border-blush transition-colors"
        />
      </div>
      <div className="col-span-2">
        <label className="block font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Type</label>
        <input
          type="text" value={attack.damageType} placeholder="piercing"
          onChange={(e) => onChange({ ...attack, damageType: e.target.value })}
          className="w-full font-sans text-xs bg-parchment text-ink border-2 border-sketch rounded-input p-1.5 outline-none focus:border-blush transition-colors"
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button onClick={onRemove}
          className="w-7 h-7 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── NPC Form (inline) ─────────────────────────────────────────────────────────

function NPCForm({ campaignId, npc, onSaved, onCancel }: {
  campaignId: string;
  npc?: NPC;
  onSaved: (saved: NPC) => void;
  onCancel: () => void;
}) {
  const isEdit = !!npc;
  const [name,    setName]    = useState(npc?.name ?? "");
  const [maxHp,   setMaxHp]   = useState(npc?.maxHp ?? 10);
  const [ac,      setAc]      = useState(npc?.armorClass ?? 10);
  const [speed,   setSpeed]   = useState(npc?.speed ?? 30);
  const [init,    setInit]    = useState(npc?.initiativeModifier ?? 0);
  const [attacks, setAttacks] = useState<Attack[]>(npc?.attacks ?? []);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function addAttack() {
    setAttacks((prev) => [...prev, { name: "", toHit: 0, damageDice: "1d6", damageType: "slashing" }]);
  }

  function updateAttack(i: number, a: Attack) {
    setAttacks((prev) => prev.map((x, idx) => idx === i ? a : x));
  }

  function removeAttack(i: number) {
    setAttacks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!name.trim()) return setError("Name is required");
    if (maxHp < 1)    return setError("HP must be at least 1");
    setSaving(true); setError(null);
    try {
      const url    = isEdit
        ? `/api/campaigns/${campaignId}/npcs/${npc!.id}`
        : `/api/campaigns/${campaignId}/npcs`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxHp, armorClass: ac, speed, initiativeModifier: init, attacks }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved = await res.json();
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="bg-warm-white border-2 border-blush/40 rounded-sketch shadow-sketch p-4 space-y-4">
      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">
        {isEdit ? "Edit NPC" : "New NPC"}
      </p>

      {error && (
        <div className="bg-blush/10 border border-blush/30 rounded-input p-2">
          <p className="font-sans text-xs text-blush">✗ {error}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">
          Name <span className="text-blush">*</span>
        </label>
        <input
          type="text" value={name} autoFocus placeholder="e.g. Goblin Scout"
          onChange={(e) => { setName(e.target.value); setError(null); }}
          className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatInput label="Max HP"   value={maxHp} onChange={setMaxHp} min={1} />
        <StatInput label="AC"       value={ac}    onChange={setAc} />
        <StatInput label="Speed"    value={speed} onChange={setSpeed} />
        <StatInput label="Init Mod" value={init}  onChange={setInit} min={-10} />
      </div>

      {/* Attacks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Attacks</label>
          <button onClick={addAttack}
            className="font-sans text-xs text-blush underline decoration-dotted underline-offset-2 hover:text-ink transition-colors">
            + Add attack
          </button>
        </div>
        {attacks.length === 0 ? (
          <p className="font-sans text-xs text-ink-faded italic">No attacks added. Click &quot;+ Add attack&quot; to add one.</p>
        ) : (
          <div className="space-y-2">
            {attacks.map((atk, i) => (
              <AttackRow key={i} attack={atk} onChange={(a) => updateAttack(i, a)} onRemove={() => removeAttack(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 justify-end pt-1 border-t border-sketch">
        <button onClick={onCancel}
          className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-parchment hover:bg-paper transition-all">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className={`font-sans font-bold text-sm text-white rounded-sketch p-2 border-2 transition-all flex items-center gap-2 ${
            saving ? "bg-tan border-sketch opacity-60 cursor-not-allowed" : "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
          }`}>
          {saving ? "Saving..." : isEdit ? "Save Changes ✦" : "Create NPC ✦"}
        </button>
      </div>
    </div>
  );
}

// ── NPC Card ──────────────────────────────────────────────────────────────────

function NPCCard({ npc, campaignId, onEdit, onDeleted }: {
  npc: NPC; campaignId: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const hpPct   = Math.min(100, Math.round((npc.currentHp / npc.maxHp) * 100));
  const hpColor = hpPct > 60 ? "bg-sage" : hpPct > 30 ? "bg-gold" : "bg-blush";
  const attacks = (npc.attacks ?? []) as Attack[];

  async function handleDelete() {
    if (!confirm(`Delete ${npc.name}?`)) return;
    setDeleting(true);
    await fetch(`/api/campaigns/${campaignId}/npcs/${npc.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👹</span>
          <div>
            <p className="font-display text-base text-ink leading-tight">{npc.name}</p>
            <p className="font-sans text-xs text-ink-faded">
              AC {npc.armorClass} · Speed {npc.speed}ft · Init {npc.initiativeModifier >= 0 ? "+" : ""}{npc.initiativeModifier}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}
            className="w-7 h-7 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs">
            ✏️
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="w-7 h-7 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs">
            {deleting ? "…" : "🗑️"}
          </button>
        </div>
      </div>

      {/* HP */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
          <span className="font-mono text-[0.6rem] text-ink-faded">{npc.currentHp}/{npc.maxHp}</span>
        </div>
        <div className="h-1.5 bg-parchment border border-sketch rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      {/* Attacks */}
      {attacks.length > 0 && (
        <div className="border-t border-sketch/50 pt-2 space-y-1">
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Attacks</p>
          {attacks.map((atk, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-sans text-xs text-ink">{atk.name}</span>
              <span className="font-mono text-xs text-ink-faded">
                {atk.toHit >= 0 ? "+" : ""}{atk.toHit} · {atk.damageDice} {atk.damageType}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Conditions */}
      {npc.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {npc.conditions.map((c) => (
            <span key={c} className="font-sans text-[0.5rem] font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded p-0.5">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NPC Page ──────────────────────────────────────────────────────────────────

export default function NPCPage() {
  const params     = useParams();
  const router     = useRouter();
  const campaignId = params.campaignId as string;

  const [npcs,         setNpcs]         = useState<NPC[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editingNpc,   setEditingNpc]   = useState<NPC | null>(null);

  const loadData = useCallback(async () => {
    const [sessionRes, npcsRes, campaignRes] = await Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}/npcs`).then((r) => {
        if (!r.ok) throw new Error("Failed to load NPCs");
        return r.json();
      }),
      fetch(`/api/campaigns/${campaignId}`).then((r) => r.json()),
    ]);

    if (!sessionRes?.data?.user) { router.push("/login"); return null; }
    const user = sessionRes.data.user;

    const member = campaignRes.members?.find((m: any) => m.user.id === user.id);
    if (member?.role !== "DM") { router.push(`/campaigns/${campaignId}/board`); return null; }

    return { npcs: npcsRes, campaignName: campaignRes.name };
  }, [campaignId, router]);

  useEffect(() => {
    let active = true;
    loadData()
      .then((result) => {
        if (!active || !result) return;
        setNpcs(result.npcs);
        setCampaignName(result.campaignName);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData]);

  function handleSaved(saved: NPC) {
    setNpcs((prev) => {
      const exists = prev.find((n) => n.id === saved.id);
      return exists ? prev.map((n) => n.id === saved.id ? saved : n) : [...prev, saved];
    });
    setShowForm(false);
    setEditingNpc(null);
  }

  function handleDeleted(id: string) {
    setNpcs((prev) => prev.filter((n) => n.id !== id));
  }

  if (error) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-ink mb-2">Failed to load NPCs</p>
        <Link href={`/campaigns/${campaignId}/board`} className="font-sans text-sm text-blush underline">Back to board</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch p-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
          <Link href={`/campaigns/${campaignId}/board`} className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">
            ← Session Board
          </Link>
          <span className="text-sketch">/</span>
          {loading ? <Skeleton className="h-4 w-32" /> : (
            <span className="font-display text-lg text-ink">{campaignName}</span>
          )}
          <span className="text-sketch">/</span>
          <span className="font-display text-lg text-ink">NPCs</span>
          <div className="ml-auto">
            {!showForm && !editingNpc && (
              <button
                onClick={() => setShowForm(true)}
                className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all flex items-center gap-2"
              >
                👹 New NPC
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-4">

        {/* Inline create form */}
        {showForm && (
          <NPCForm
            campaignId={campaignId}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : npcs.length === 0 && !showForm ? (
          <div className="bg-warm-white border-2 border-dashed border-sketch rounded-sketch p-12 text-center">
            <p className="text-4xl mb-3">👹</p>
            <p className="font-display text-xl text-ink mb-1">No NPCs yet</p>
            <p className="font-sans text-sm text-ink-faded mb-4">Create monsters and NPCs to use in your encounters.</p>
            <button
              onClick={() => setShowForm(true)}
              className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all"
            >
              Create your first NPC ✦
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {npcs.map((npc) =>
              editingNpc?.id === npc.id ? (
                <NPCForm
                  key={npc.id}
                  campaignId={campaignId}
                  npc={npc}
                  onSaved={handleSaved}
                  onCancel={() => setEditingNpc(null)}
                />
              ) : (
                <NPCCard
                  key={npc.id}
                  npc={npc}
                  campaignId={campaignId}
                  onEdit={() => { setShowForm(false); setEditingNpc(npc); }}
                  onDeleted={() => handleDeleted(npc.id)}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}