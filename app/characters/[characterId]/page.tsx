"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteModal } from "@/components/DeleteModal";
import { Avatar, Skeleton, SectionCard, Tooltip, StatPip } from "@/components/sheet-ui";
import {
  PersonalityDrawer, SpellSlotsDrawer, SpellsDrawer, InventoryDrawer,
} from "@/components/sheet-drawers";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  Character, ABILITY_KEYS, SKILLS_MAP, SAVING_THROW_ABILITY,
  CONDITIONS, CATEGORY_COLOR, STANDARD_ACTIONS, SPELL_CATEGORY_LABELS,
  mod, modNum,
} from "@/types/character-sheet";

// ── REST TOOLTIP CONTENT ──────────────────────────────────────────────────────

function ShortRestTooltip() {
  return (
    <div className="space-y-2">
      <p className="font-sans font-bold text-sm text-warm-white">Short Rest</p>
      <p className="font-sans text-xs text-warm-white/80 leading-relaxed">
        A breather of at least 1 hour. You can spend Hit Dice to recover HP —
        roll a hit die and add your CON modifier, then regain that many hit points.
      </p>
      <div className="border-t border-warm-white/20 pt-2 space-y-1">
        <p className="font-sans text-xs text-warm-white/70">✦ Recover HP by spending Hit Dice</p>
        <p className="font-sans text-xs text-warm-white/70">✦ Some abilities recharge (e.g. Second Wind, Bardic Inspiration)</p>
        <p className="font-sans text-xs text-warm-white/70">✦ Does not restore spell slots</p>
      </div>
    </div>
  );
}

function LongRestTooltip() {
  return (
    <div className="space-y-2">
      <p className="font-sans font-bold text-sm text-warm-white">Long Rest</p>
      <p className="font-sans text-xs text-warm-white/80 leading-relaxed">
        At least 8 hours of sleep or light activity. You wake up fully restored
        and ready for the next adventure.
      </p>
      <div className="border-t border-warm-white/20 pt-2 space-y-1">
        <p className="font-sans text-xs text-warm-white/70">✦ Restore all HP to maximum</p>
        <p className="font-sans text-xs text-warm-white/70">✦ Restore all spent spell slots</p>
        <p className="font-sans text-xs text-warm-white/70">✦ Restore all Hit Dice (up to half your level)</p>
        <p className="font-sans text-xs text-warm-white/70">✦ Reset all long-rest abilities</p>
      </div>
    </div>
  );
}

// ── Inspiration Badge ────────────────────────────────────────────────────────

function InspirationBadge({ active, onSpend }: {
  active:  boolean;
  onSpend: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!active) {
    return (
      <span className="font-sans text-xs font-bold text-ink-faded border border-sketch/40 bg-parchment rounded px-2 p-1 opacity-50 cursor-default select-none">
        ⭐ No Inspiration
      </span>
    );
  }

  return (
    <div className="relative inline-flex" onMouseLeave={() => setShowConfirm(false)}>
      <button
        type="button"
        onClick={() => setShowConfirm((v) => !v)}
        className="font-sans text-xs font-bold text-[#D4A853] border border-[#D4A853]/40 bg-[#D4A853]/10 rounded px-2 p-1 hover:bg-[#D4A853]/20 transition-all cursor-pointer"
      >
        ⭐ Inspired
      </button>

      {showConfirm && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-ink text-warm-white rounded-sketch shadow-[0_4px_16px_rgba(0,0,0,0.25)] p-3 border border-ink-soft/20">
          <p className="font-sans font-bold text-sm text-warm-white mb-1">Spend Inspiration?</p>
          <p className="font-sans text-xs text-warm-white/80 leading-relaxed mb-3">
            Inspiration lets you add advantage to one ability check, attack roll, or saving throw. Once spent it must be re-awarded by your DM.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onSpend(); setShowConfirm(false); }}
              className="flex-1 font-sans font-bold text-xs text-white bg-blush border border-blush rounded p-1.5 hover:opacity-90 transition-opacity"
            >
              Spend it
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="flex-1 font-sans font-semibold text-xs text-warm-white/70 border border-warm-white/20 rounded p-1.5 hover:bg-warm-white/10 transition-colors"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HP WIDGET ─────────────────────────────────────────────────────────────────

function HpWidget({ character, onUpdate }: {
  character: Character;
  onUpdate:  (updates: Partial<Character>) => void;
}) {
  const [input, setInput] = useState("");
  const { currentHp, maxHp, temporaryHp } = character;
  const pct   = Math.min(100, Math.round((currentHp / maxHp) * 100));
  const color = pct > 60 ? "bg-sage" : pct > 30 ? "bg-[#D4A853]" : "bg-blush";

  function apply(delta: number) {
    // Temp HP absorbs damage first
    if (delta < 0 && temporaryHp > 0) {
      const absorbed = Math.min(temporaryHp, Math.abs(delta));
      const remaining = Math.abs(delta) - absorbed;
      onUpdate({
        temporaryHp: temporaryHp - absorbed,
        currentHp: Math.max(0, currentHp - remaining),
      });
    } else {
      onUpdate({ currentHp: Math.max(0, Math.min(maxHp, currentHp + delta)) });
    }
  }

  function handleSubmit() {
    const n = parseInt(input);
    if (isNaN(n)) return setInput("");
    apply(n);
    setInput("");
  }

  return (
    <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Hit Points</p>
        {temporaryHp > 0 && (
          <span className="font-sans text-xs text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/10 rounded px-2 py-0.5">
            +{temporaryHp} temp
          </span>
        )}
      </div>

      {/* HP bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-display text-4xl text-ink font-bold">{currentHp}</span>
          <span className="font-sans text-sm text-ink-faded">/ {maxHp}</span>
        </div>
        <div className="h-3 bg-parchment border border-sketch rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Quick adjust */}
      <div className="flex items-center gap-2">
        <button onClick={() => apply(-1)} className="w-9 h-9 rounded-sketch border-2 border-sketch bg-parchment text-ink font-bold hover:border-blush hover:bg-blush/5 transition-all duration-150 flex items-center justify-center text-lg">−</button>
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="±"
          className="flex-1 font-mono text-sm text-center bg-parchment border-2 border-sketch rounded-input px-2 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
        />
        <button onClick={() => apply(1)} className="w-9 h-9 rounded-sketch border-2 border-sketch bg-parchment text-ink font-bold hover:border-sage hover:bg-sage/5 transition-all duration-150 flex items-center justify-center text-lg">+</button>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="flex-1 font-sans text-xs font-bold text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all duration-150">
          Apply
        </button>
        <Tooltip content={<ShortRestTooltip />} side="top">
          <button
            onClick={() => {
              const hitDie = character.classes?.[0]?.class.hitDie ?? 8;
              const conMod = modNum(character.abilityScores?.constitution ?? 10);
              const roll   = Math.ceil(Math.random() * hitDie) + conMod;
              const healed = Math.max(1, roll);
              onUpdate({ currentHp: Math.min(maxHp, currentHp + healed) });
            }}
            className="flex-1 font-sans text-xs font-semibold text-[#D4A853] border-2 border-[#D4A853]/40 rounded-sketch bg-[#D4A853]/10 p-2 hover:bg-[#D4A853]/20 transition-all duration-150 flex items-center justify-center gap-1"
          >
            ☀️ Short
          </button>
        </Tooltip>
        <Tooltip content={<LongRestTooltip />} side="top">
          <button
            onClick={() => {
              const newSlots = character.spellSlots
                ? Object.fromEntries(Object.entries(character.spellSlots).map(([k, v]) => [k, { ...v, used: 0 }]))
                : null;
              onUpdate({
                currentHp: maxHp,
                hitDice: { total: character.level, used: 0 },
                spellSlots: newSlots ?? character.spellSlots,
              });
            }}
            className="flex-1 font-sans text-xs font-semibold text-dusty-blue border-2 border-dusty-blue/40 rounded-sketch bg-dusty-blue/10 p-2 hover:bg-dusty-blue/20 transition-all duration-150 flex items-center justify-center gap-1"
          >
            🌙 Long
          </button>
        </Tooltip>
      </div>

      {/* Death saves */}
      {currentHp === 0 && (
        <div className="border-t border-sketch pt-3 space-y-2">
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Death Saves</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-xs text-sage">Successes</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <StatPip key={i} filled={i < (character.deathSaves?.successes ?? 0)} color="bg-sage" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-xs text-blush">Failures</span>
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <StatPip key={i} filled={i < (character.deathSaves?.failures ?? 0)} color="bg-blush" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

type DrawerType =
  | "personality" | "spellSlots" | "spells" | "inventory" | null;

export default function CharacterSheetPage() {
  const params      = useParams();
  const router      = useRouter();
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [drawer, setDrawer]       = useState<DrawerType>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [expandedAction,  setExpandedAction]  = useState<string | null>(null);
  const [actionFilter,    setActionFilter]    = useState<string>("ALL");
  const [noteFilter,      setNoteFilter]      = useState<string>("ALL");
  const [col1Tab,         setCol1Tab]         = useState<"scores" | "saves" | "skills">("scores");
  const [showNoteForm,    setShowNoteForm]    = useState(false);
  const [noteTitle,       setNoteTitle]       = useState("");
  const [noteBody,        setNoteBody]        = useState("");
  const [noteTags,        setNoteTags]        = useState("");
  const [editingNoteId,   setEditingNoteId]   = useState<string | null>(null);
  const [viewingNoteId,   setViewingNoteId]   = useState<string | null>(null);
  const [editInModal,     setEditInModal]     = useState(false);
  const [showDelete,      setShowDelete]      = useState(false);

  useEffect(() => {
    fetch(`/api/characters/${characterId}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setCharacter(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [characterId]);

  // ── Save helpers ────────────────────────────────────────────────────────────

  async function save(updates: Record<string, unknown>) {
    if (!character) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setCharacter((prev) => prev ? { ...prev, ...updated } : prev);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  function updateLocal(updates: Partial<Character>) {
    setCharacter((prev) => prev ? { ...prev, ...updates } : prev);
    save(updates as Record<string, unknown>);
  }

  // ── Note helpers ──────────────────────────────────────────────────────────────

  interface NoteEntry {
    id:    string;
    title: string;
    body:  string;
    tags:  string[];
    createdAt: string;
  }

  function parseNotes(): NoteEntry[] {
    if (!character?.notes) return [];
    // Legacy plain text — not JSON
    if (!character.notes.startsWith("[")) return [];
    try { return JSON.parse(character.notes) as NoteEntry[]; }
    catch { return []; }
  }

  function saveNotes(entries: NoteEntry[]) {
    const json = JSON.stringify(entries);
    setCharacter((prev) => prev ? { ...prev, notes: json } : prev);
    save({ notes: json });
  }

  function addNote() {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    const entries = parseNotes();
    const tags    = noteTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const entry: NoteEntry = {
      id:        crypto.randomUUID(),
      title:     noteTitle.trim() || "Untitled",
      body:      noteBody.trim(),
      tags,
      createdAt: new Date().toISOString(),
    };
    saveNotes([...entries, entry]);
    setNoteTitle(""); setNoteBody(""); setNoteTags("");
    setShowNoteForm(false);
  }

  function deleteNote(id: string) {
    saveNotes(parseNotes().filter((n) => n.id !== id));
  }

  function updateNote(id: string) {
    const tags    = noteTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const entries = parseNotes().map((n) => n.id === id
      ? { ...n, title: noteTitle.trim() || "Untitled", body: noteBody.trim(), tags }
      : n
    );
    saveNotes(entries);
    setEditingNoteId(null);
    setNoteTitle(""); setNoteBody(""); setNoteTags("");
  }

  async function saveAbilityScores(scores: Record<string, number>) {
    setCharacter((prev) => prev ? { ...prev, abilityScores: scores } : prev);
    await save({ abilityScores: scores });
  }

  async function saveCombatStats(data: Partial<Character>) {
    setCharacter((prev) => prev ? { ...prev, ...data } : prev);
    await save(data);
  }

  async function savePersonality(data: Partial<Character>) {
    setCharacter((prev) => prev ? { ...prev, ...data } : prev);
    await save(data);
  }

  async function saveConditions(conditions: string[]) {
    setCharacter((prev) => prev ? { ...prev, conditions } : prev);
    await save({ conditions });
  }

  async function saveSpellSlots(slots: Record<string, { max: number; used: number }>) {
    setCharacter((prev) => prev ? { ...prev, spellSlots: slots } : prev);
    await save({ spellSlots: slots });
  }

  async function saveSkills(
    profChanges: { add: string[]; remove: string[]; expertise: string[] },
    bonuses: Record<string, number>
  ) {
    // Save skill bonuses to character
    await save({ skillBonuses: bonuses });
    // Update proficiencies via dedicated route
    const res = await fetch(`/api/characters/${characterId}/proficiencies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profChanges),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacter((prev) => prev ? {
        ...prev, skillBonuses: bonuses, proficiencies: updated
      } : prev);
    }
  }

  async function saveSavingThrows(
    profChanges: { add: string[]; remove: string[] },
    bonuses: Record<string, number>
  ) {
    await save({ savingThrowBonuses: bonuses });
    const res = await fetch(`/api/characters/${characterId}/proficiencies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profChanges),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacter((prev) => prev ? {
        ...prev, savingThrowBonuses: bonuses, proficiencies: updated
      } : prev);
    }
  }

  async function saveProficiencies(data: { add: string[]; remove: string[]; languages: string[] }) {
    await save({ languages: data.languages });
    const res = await fetch(`/api/characters/${characterId}/proficiencies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add: data.add, remove: data.remove, expertise: [] }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacter((prev) => prev ? {
        ...prev, languages: data.languages, proficiencies: updated
      } : prev);
    }
  }

  // ── Spell CRUD ──────────────────────────────────────────────────────────────

  async function addSpell(spellIndex: string) {
    const res = await fetch(`/api/characters/${characterId}/spells`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spellIndex }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacter((prev) => prev ? { ...prev, spells: updated } : prev);
    }
  }

  async function removeSpell(characterSpellId: string) {
    const res = await fetch(`/api/characters/${characterId}/spells/${characterSpellId}`, { method: "DELETE" });
    if (res.ok) {
      setCharacter((prev) => prev ? {
        ...prev, spells: prev.spells?.filter((s) => s.id !== characterSpellId)
      } : prev);
    }
  }

  async function togglePrepared(characterSpellId: string, current: string) {
    const next = current === "PREPARED" ? "KNOWN" : "PREPARED";
    const res = await fetch(`/api/characters/${characterId}/spells/${characterSpellId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setCharacter((prev) => prev ? {
        ...prev,
        spells: prev.spells?.map((s) => s.id === characterSpellId ? { ...s, status: next } : s)
      } : prev);
    }
  }

  // ── Inventory CRUD ──────────────────────────────────────────────────────────

  async function toggleEquipped(id: string, equipped: boolean) {
    const res = await fetch(`/api/characters/${characterId}/inventory/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipped: !equipped }),
    });
    if (res.ok) {
      setCharacter((prev) => prev ? {
        ...prev,
        inventory: prev.inventory?.map((i) => i.id === id ? { ...i, equipped: !equipped } : i)
      } : prev);
    }
  }

  async function updateQuantity(id: string, quantity: number) {
    const res = await fetch(`/api/characters/${characterId}/inventory/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) {
      setCharacter((prev) => prev ? {
        ...prev,
        inventory: prev.inventory?.map((i) => i.id === id ? { ...i, quantity } : i)
      } : prev);
    }
  }

  async function removeItem(id: string) {
    const res = await fetch(`/api/characters/${characterId}/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCharacter((prev) => prev ? {
        ...prev, inventory: prev.inventory?.filter((i) => i.id !== id)
      } : prev);
    }
  }

  async function addItemFromList(itemIndex: string) {
    const res = await fetch(`/api/characters/${characterId}/inventory`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIndex }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setCharacter((prev) => prev ? {
        ...prev,
        inventory: prev.inventory?.some((i) => i.id === newItem.id)
          ? prev.inventory?.map((i) => i.id === newItem.id ? newItem : i)
          : [...prev.inventory, newItem],
      } : prev);
    }
  }

  async function addCustomItem(data: { name: string; description: string; type: string }) {
    const res = await fetch(`/api/characters/${characterId}/inventory`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName: data.name, customDescription: data.description, customType: data.type }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setCharacter((prev) => prev ? {
        ...prev, inventory: [...prev.inventory, newItem]
      } : prev);
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  if (error) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="font-display text-2xl text-ink">Character not found</p>
        <Link href="/dashboard" className="font-sans text-sm text-blush underline">Back to dashboard</Link>
      </div>
    </div>
  );

  const scores         = character?.abilityScores;
  const primaryClass   = character?.classes?.[0];
  const classIndex     = primaryClass?.class.name.toLowerCase() ?? "";
  const profBonus      = character?.proficiencyBonus ?? 2;
  const SPELLCASTING_CLASSES = ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"];
  const isSpellcaster  = SPELLCASTING_CLASSES.includes(classIndex);

  const proficientSkills = new Set(
    character?.proficiencies
      ?.filter((p) => p.proficiency.type === "Skills")
      .map((p) => p.proficiency.name.toLowerCase().replace(/\s+/g, "-")) ?? []
  );
  const expertiseSkills = new Set(
    character?.proficiencies
      ?.filter((p) => p.expertise)
      .map((p) => p.proficiency.name.toLowerCase().replace(/\s+/g, "-")) ?? []
  );

  const activeConditions = CONDITIONS.filter((c) => character?.conditions?.includes(c.key));

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased">

      {/* ── Nav ── */}
      <nav className="bg-warm-white border-b-2 border-sketch px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loading ? <Skeleton className="h-4 w-48" /> : (
              <Link href={`/campaigns/${character?.campaign?.id}`} className="font-sans text-sm text-ink-faded hover:text-ink transition-colors flex items-center gap-1.5">
                ← {character?.campaign?.emoji} {character?.campaign?.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="font-sans text-xs text-ink-faded flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-ink-faded border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="font-sans text-xs text-ink-faded hover:text-blush transition-colors border border-sketch rounded px-2.5 p-1 hover:border-blush/40"
            >
              Delete Character
            </button>
          </div>
        </div>
      </nav>

      {/* ── Header band ── */}
      <div className="bg-warm-white border-b-2 border-sketch">
        <div className="max-w-7xl mx-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-5">
              <Skeleton className="w-20 h-20 rounded-sketch" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          ) : character && (
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-start gap-5">

                {/* Character avatar */}
                <AvatarUpload
                  currentUrl={character.avatarUrl}
                  endpoint="characterAvatar"
                  size={80}
                  onUploadComplete={(url) => {
                    setCharacter((prev) => prev ? { ...prev, avatarUrl: url } : prev);
                    save({ avatarUrl: url });
                  }}
                />

                <div>
                  {/* Name + pronouns */}
                  <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                    <h1 className="font-display text-4xl text-ink leading-none">{character.name}</h1>
                    {character.pronouns && (
                      <span className="font-sans text-sm text-ink-faded">{character.pronouns}</span>
                    )}
                    <InspirationBadge
                      active={character.inspiration}
                      onSpend={() => {
                        setCharacter((prev) => prev ? { ...prev, inspiration: false } : prev);
                        save({ inspiration: false });
                      }}
                    />
                  </div>

                  {/* Identity line */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="font-display text-lg text-ink-soft">Level {character.level}</span>
                    {character.race && (<><span className="text-tan">·</span><span className="font-sans text-sm text-ink-soft">{character.race.name}</span></>)}
                    {primaryClass && (<><span className="text-tan">·</span><span className="font-sans text-sm text-ink-soft">{primaryClass.class.name}</span></>)}
                    {character.background && (<><span className="text-tan">·</span><span className="font-sans text-sm text-ink-faded italic">{character.background.name}</span></>)}
                  </div>

                  {/* Active conditions in header */}
                  {activeConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeConditions.map((cond) => (
                        <span key={cond.key} className={`font-sans text-xs font-semibold px-2 py-0.5 rounded border ${cond.bg} ${cond.color} ${cond.border}`}>
                          {cond.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Header stat pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { label: "AC",      value: character.armorClass,      accent: false },
                  { label: "Speed",   value: `${character.speed}ft`,    accent: false },
                  { label: "Init",    value: character.initiative >= 0 ? `+${character.initiative}` : character.initiative, accent: false },
                  { label: "Prof",    value: `+${character.proficiencyBonus}`, accent: false },
                  { label: "Hit Die", value: `d${primaryClass?.class.hitDie ?? 8}`, accent: false },
                ].map((stat) => (
                  <div key={stat.label} className="text-center bg-parchment border-2 border-sketch rounded-sketch px-3 py-2 shadow-sketch min-w-[52px]">
                    <p className="font-mono text-xl font-bold text-ink leading-none">{stat.value}</p>
                    <p className="font-sans text-[0.55rem] text-ink-faded uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                ))}
                {/* Edit button in header */}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Three column grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── COLUMN 1: Tabbed reference panel (3 cols) ── */}
          <div className="lg:col-span-3">
            <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch overflow-hidden">

              {/* Tab header */}
              <div className="flex border-b-2 border-sketch">
                {([
                  { id: "scores", label: "Scores", icon: "🎯" },
                  { id: "saves",  label: "Saves",  icon: "🛡️" },
                  { id: "skills", label: "Skills",  icon: "⚡" },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCol1Tab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 p-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-r border-sketch last:border-r-0 ${
                      col1Tab === tab.id
                        ? "bg-parchment text-ink border-b-2 border-b-blush -mb-0.5"
                        : "text-ink-faded hover:bg-parchment/50 hover:text-ink"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">
                {loading ? (
                  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : col1Tab === "scores" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {ABILITY_KEYS.map(({ key, abbr }) => {
                      const score = scores?.[key as keyof typeof scores] ?? 10;
                      const m     = mod(score);
                      const mn    = modNum(score);
                      return (
                        <div key={key} className="bg-parchment border border-sketch rounded-sketch p-2 text-center relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${mn >= 0 ? "bg-sage/30" : "bg-blush/30"}`} />
                          <p className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-ink-faded mb-1">{abbr}</p>
                          <p className="font-mono text-2xl font-bold text-ink leading-none">{score}</p>
                          <p className={`font-mono text-sm font-bold mt-1 ${mn >= 0 ? "text-sage" : "text-blush"}`}>{m}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : col1Tab === "saves" ? (
                  <div className="space-y-1.5">
                    {ABILITY_KEYS.map(({ key, abbr }) => {
                      const score        = scores?.[key as keyof typeof scores] ?? 10;
                      const isProficient = SAVING_THROW_ABILITY[classIndex] === key;
                      const bonus        = modNum(score) + (isProficient ? profBonus : 0) + (character?.savingThrowBonuses?.[key] ?? 0);
                      return (
                        <div key={key} className="flex items-center gap-2 p-1">
                          <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${isProficient ? "bg-blush border-blush" : "bg-parchment border-sketch"}`} />
                          <span className="font-mono text-xs text-ink-faded w-7">{abbr}</span>
                          <div className="flex-1 h-px bg-sketch/40" />
                          <span className={`font-mono text-sm font-bold ${bonus >= 0 ? "text-sage" : "text-blush"}`}>
                            {bonus >= 0 ? `+${bonus}` : bonus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {SKILLS_MAP.map((skill) => {
                      const score      = scores?.[skill.ability as keyof typeof scores] ?? 10;
                      const proficient = proficientSkills.has(skill.key);
                      const expertise  = expertiseSkills.has(skill.key);
                      const bonus      = modNum(score) + (expertise ? profBonus * 2 : proficient ? profBonus : 0) + ((character?.skillBonuses?.[skill.key] ?? 0));
                      return (
                        <div key={skill.key} className="flex items-center gap-1.5 p-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                            expertise  ? "bg-blush border-blush" :
                            proficient ? "bg-blush/50 border-blush/60" :
                            "bg-parchment border-sketch"
                          }`} />
                          <span className="font-sans text-xs text-ink-soft flex-1 leading-tight">{skill.label}</span>
                          <span className="font-mono text-[0.6rem] text-ink-faded/60">{skill.ability.slice(0,3).toUpperCase()}</span>
                          <span className={`font-mono text-xs font-bold w-7 text-right ${bonus >= 0 ? "text-sage" : "text-blush"}`}>
                            {bonus >= 0 ? `+${bonus}` : bonus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            <SectionCard title="Conditions" icon="⚠️">
              {loading ? <Skeleton className="h-12" /> : activeConditions.length === 0 ? (
                <p className="font-sans text-sm text-ink-faded italic">No active conditions</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeConditions.map((cond) => (
                    <Tooltip key={cond.key} content={
                      <div>
                        <p className="font-sans font-bold text-sm text-warm-white mb-1">{cond.label}</p>
                        <p className="font-sans text-xs text-warm-white/80 leading-relaxed">{cond.description}</p>
                      </div>
                    } side="top">
                      <span className={`font-sans text-xs font-semibold px-2.5 p-1 rounded-badge border cursor-help ${cond.bg} ${cond.color} ${cond.border}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${cond.dot} mr-1.5`} />
                        {cond.label}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Proficiencies & Languages */}
            <SectionCard title="Proficiencies & Languages" icon="📚">
              {loading ? <Skeleton className="h-16" /> : (
                <div className="space-y-3">
                  {(character?.languages?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {character?.languages?.map((lang) => (
                          <span key={lang} className="font-sans text-xs text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/5 rounded-badge px-2 p-0.5">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {character?.proficiencies?.map((p) => (
                      <span key={p.proficiency.name} className={`font-sans text-xs px-2 p-0.5 rounded-badge border capitalize ${
                        p.expertise ? "text-blush border-blush/30 bg-blush/10 font-semibold" : "text-ink-soft border-sketch bg-parchment"
                      }`}>
                        {p.expertise ? "★ " : ""}{p.proficiency.name}
                      </span>
                    ))}
                    {(character?.proficiencies?.length ?? 0) === 0 && (character?.languages?.length ?? 0) === 0 && (
                      <p className="font-sans text-sm text-ink-faded">None recorded</p>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ── COLUMN 2: HP + Combat + Spells slots (4 cols) ── */}
          <div className="lg:col-span-4 space-y-4">

            {/* HP widget */}
            {loading ? <Skeleton className="h-64" /> : character && (
              <HpWidget character={character} onUpdate={updateLocal} />
            )}

            {/* Hit dice */}
            <SectionCard title="Hit Dice" icon="🎲">
              {loading ? <Skeleton className="h-16" /> : character && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {Array.from({ length: character?.hitDice?.total ?? character?.level ?? 1 }, (_, i) => (
                      <StatPip
                        key={i}
                        filled={i >= (character.hitDice?.used ?? 0)}
                        color="bg-[#D4A853]"
                        onClick={() => {
                          const current = character?.hitDice ?? { total: character?.level ?? 1, used: 0 };
                          const newUsed = i < current.used ? i : i + 1;
                          updateLocal({ hitDice: { ...current, used: Math.min(newUsed, current.total) } });
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-ink">d{primaryClass?.class.hitDie ?? 8}</p>
                    <p className="font-sans text-[0.6rem] text-ink-faded">
                      {(character?.hitDice?.total ?? character?.level ?? 1) - (character?.hitDice?.used ?? 0)} left
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Spell slots */}
            {isSpellcaster && (
              <SectionCard title="Spell Slots" icon="✨" onEdit={() => setDrawer("spellSlots")}>
                {loading ? <Skeleton className="h-24" /> : character?.spellSlots ? (
                  <div className="space-y-2">
                    {Object.entries(character.spellSlots ?? {})
                      .filter(([, v]) => v.max > 0)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([level, slot]) => (
                        <div key={level} className="flex items-center gap-2">
                          <span className="font-sans text-xs text-ink-faded w-14 shrink-0">Level {level}</span>
                          <div className="flex gap-1 flex-wrap flex-1">
                            {Array.from({ length: slot.max }, (_, i) => (
                              <StatPip
                                key={i}
                                filled={i >= slot.used}
                                color="bg-dusty-blue"
                                onClick={() => {
                                  const newUsed = i < slot.used ? i : i + 1;
                                  const updated = {
                                    ...character.spellSlots,
                                    [level]: { ...slot, used: Math.min(newUsed, slot.max) }
                                  };
                                  updateLocal({ spellSlots: updated });
                                }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-xs text-ink-faded shrink-0">
                            {slot.max - slot.used}/{slot.max}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setDrawer("spellSlots")}
                    className="w-full font-sans text-sm text-blush underline decoration-dotted underline-offset-2"
                  >
                    Set up spell slots
                  </button>
                )}
              </SectionCard>
            )}

            {/* Actions */}
            <SectionCard title="Actions & Abilities" icon="⚔️">
              {loading ? <Skeleton className="h-32" /> : (() => {
                const ACTION_TYPES = ["ALL", "ACTION", "BONUS ACTION", "REACTION", "FREE", "PASSIVE"];

                const allActions = [
                  ...STANDARD_ACTIONS.map((a) => ({
                    id:          a.name,
                    name:        a.name,
                    actionType:  a.actionType,
                    category:    a.category,
                    description: a.description,
                    source:      "Standard",
                  })),
                  ...(character?.features
                    ?.filter((f) => f.feature.combatUsable)
                    .map((f) => ({
                      id:          f.id,
                      name:        f.feature.name,
                      actionType:  f.feature.actionType?.replace("_", " ") ?? "ACTION",
                      category:    f.feature.category ?? "",
                      description: f.feature.description,
                      source:      f.feature.type,
                    })) ?? []),
                ];

                const filtered = actionFilter === "ALL"
                  ? allActions
                  : allActions.filter((a) => a.actionType.replace("_", " ") === actionFilter);

                return (
                  <div className="space-y-3">
                    {/* Filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {ACTION_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActionFilter(type)}
                          className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-2 p-1 rounded border transition-all ${
                            actionFilter === type
                              ? "bg-ink text-warm-white border-ink"
                              : "bg-parchment text-ink-faded border-sketch hover:border-ink/40"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Action list */}
                    <div className="space-y-1.5">
                      {filtered.length === 0 ? (
                        <p className="font-sans text-sm text-ink-faded italic">No actions match this filter.</p>
                      ) : filtered.map((action) => {
                        const isExpanded = expandedAction === action.id;
                        return (
                          <div key={action.id} className="border border-sketch rounded-input overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                              className="w-full p-2 flex items-center gap-2 bg-parchment hover:bg-paper transition-colors duration-150 text-left"
                            >
                              <span className={`font-sans text-[0.55rem] font-bold uppercase tracking-wider px-1.5 p-0.5 rounded border shrink-0 ${CATEGORY_COLOR[action.category] ?? "text-ink-faded border-sketch bg-parchment"}`}>
                                {action.actionType.replace("_", " ")}
                              </span>
                              <span className="font-sans text-sm text-ink flex-1 truncate">{action.name}</span>
                              {action.source !== "Standard" && (
                                <span className={`font-sans text-[0.5rem] font-bold uppercase shrink-0 px-1 p-0.5 rounded border ${
                                  action.source === "CLASS" ? "text-blush border-blush/30 bg-blush/10" : "text-sage border-sage/30 bg-sage/10"
                                }`}>{action.source}</span>
                              )}
                              <span className="text-ink-faded text-xs shrink-0">{isExpanded ? "▲" : "▼"}</span>
                            </button>
                            {isExpanded && (
                              <div className="p-2 border-t border-sketch bg-warm-white">
                                <p className="font-sans text-xs text-ink-soft leading-relaxed">{action.description}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </SectionCard>


          </div>

          {/* ── COLUMN 3: Features + Spells + Inventory + Personality (5 cols) ── */}
          <div className="lg:col-span-5 space-y-4">

            {/* Features accordion */}
            <SectionCard title="Features & Traits" icon="📜">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : (character?.features?.length ?? 0) === 0 ? (
                <p className="font-sans text-sm text-ink-faded">No features recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {character?.features?.map((f) => (
                    <div key={f.id} className="border border-sketch rounded-input overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedFeature(expandedFeature === f.id ? null : f.id)}
                        className="w-full px-3 py-2.5 flex items-center justify-between gap-2 bg-parchment hover:bg-paper transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-sans text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                            f.feature.type === "CLASS" ? "text-blush border-blush/30 bg-blush/10" :
                            f.feature.type === "RACE"  ? "text-sage border-sage/30 bg-sage/10" :
                            "text-ink-faded border-sketch bg-parchment"
                          }`}>{f.feature.type}</span>
                          <span className="font-sans text-sm font-semibold text-ink truncate">{f.feature.name}</span>
                          {f.feature.combatUsable && (
                            <span className="font-sans text-[0.5rem] font-bold uppercase text-blush border border-blush/20 bg-blush/5 rounded px-1 py-0.5 shrink-0">
                              ⚔ Combat
                            </span>
                          )}
                        </div>
                        <span className="text-ink-faded text-xs shrink-0">{expandedFeature === f.id ? "▲" : "▼"}</span>
                      </button>
                      {expandedFeature === f.id && (
                        <div className="px-3 py-3 border-t border-sketch bg-warm-white">
                          <p className="font-sans text-xs text-ink-soft leading-relaxed">{f.feature.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Spells + inventory buttons */}
            <div className={`grid gap-3 ${isSpellcaster ? "grid-cols-2" : "grid-cols-1"}`}>
              {isSpellcaster && (
                <button
                  type="button"
                  onClick={() => setDrawer("spells")}
                  className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 text-left hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-150">✨</span>
                    <span className="font-mono text-sm font-bold text-ink-faded">{character?.spells?.length ?? 0}</span>
                  </div>
                  <p className="font-display text-lg text-ink">Spells</p>
                  <p className="font-sans text-xs text-ink-faded mt-0.5">View, add, remove</p>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDrawer("inventory")}
                className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 text-left hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-150">🎒</span>
                  <span className="font-mono text-sm font-bold text-ink-faded">{character?.inventory?.length ?? 0}</span>
                </div>
                <p className="font-display text-lg text-ink">Inventory</p>
                <p className="font-sans text-xs text-ink-faded mt-0.5">Items & equipment</p>
              </button>
            </div>

            {/* Personality */}
            <SectionCard title="Personality" icon="🎭" onEdit={() => setDrawer("personality")} accent>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : (
                <div className="space-y-3">
                  {[
                    { key: "personalityTrait", label: "Trait",  icon: "🎭" },
                    { key: "ideal",            label: "Ideal",  icon: "⭐" },
                    { key: "bond",             label: "Bond",   icon: "🔗" },
                    { key: "flaw",             label: "Flaw",   icon: "⚡" },
                  ].map(({ key, label, icon }) => {
                    const value = character?.[key as keyof Character] as string | null;
                    return (
                      <div key={key} className="bg-parchment border border-sketch rounded-input px-3 py-2.5">
                        <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1">{icon} {label}</p>
                        <p className="font-sans text-sm text-ink-soft leading-relaxed">
                          {value || <span className="text-ink-faded italic">Not set</span>}
                        </p>
                      </div>
                    );
                  })}

                </div>
              )}
            </SectionCard>

            {/* Notes */}
            {!loading && character && (() => {
              const entries  = parseNotes();
              const allTags  = Array.from(new Set(entries.flatMap((n) => n.tags))).sort();
              const filtered = noteFilter === "ALL" ? entries : entries.filter((n) => n.tags.includes(noteFilter));

              return (
                <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-sketch">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <h2 className="font-display text-xl text-ink">Notes</h2>
                      {entries.length > 0 && (
                        <span className="font-mono text-xs text-ink-faded border border-sketch rounded px-1.5 p-0.5">{entries.length}</span>
                      )}
                    </div>
                    {entries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowNoteForm(true); setEditingNoteId(null); setNoteTitle(""); setNoteBody(""); setNoteTags(""); }}
                        className="font-sans text-xs font-bold text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-3 p-1.5 hover:-translate-x-px hover:-translate-y-px transition-all"
                      >
                        + Add Note
                      </button>
                    )}
                  </div>

                  {entries.length === 0 && !showNoteForm ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <span className="text-3xl mb-2">📝</span>
                      <p className="font-display text-lg text-ink mb-1">No notes yet</p>
                      <p className="font-sans text-xs text-ink-faded mb-4">Track quests, NPCs, discoveries, and anything worth remembering.</p>
                      <button
                        type="button"
                        onClick={() => setShowNoteForm(true)}
                        className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-4 p-2 hover:-translate-x-px hover:-translate-y-px transition-all"
                      >
                        Make a Note ✦
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {["ALL", ...allTags].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setNoteFilter(tag)}
                              className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-2 p-1 rounded border transition-all ${
                                noteFilter === tag ? "bg-ink text-warm-white border-ink" : "bg-parchment text-ink-faded border-sketch hover:border-ink/40"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {showNoteForm && (
                        <div className="bg-parchment border-2 border-blush/40 rounded-sketch p-3 space-y-2">
                          <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title"
                            className="w-full font-display text-base bg-warm-white text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
                          <textarea rows={3} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write your note..."
                            className="w-full font-sans text-sm bg-warm-white text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors resize-none placeholder:text-ink-faded leading-relaxed" />
                          <input type="text" value={noteTags} onChange={(e) => setNoteTags(e.target.value)} placeholder="Tags — comma separated (e.g. quest, npc)"
                            className="w-full font-sans text-sm bg-warm-white text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => { setShowNoteForm(false); setEditingNoteId(null); setNoteTitle(""); setNoteBody(""); setNoteTags(""); }}
                              className="font-sans text-xs font-semibold text-ink-faded border-2 border-sketch rounded-sketch px-3 p-1.5 bg-parchment hover:bg-paper transition-all">Cancel</button>
                            <button type="button" onClick={() => editingNoteId ? updateNote(editingNoteId) : addNote()}
                              className="font-sans text-xs font-bold text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-3 p-1.5 hover:-translate-x-px hover:-translate-y-px transition-all">
                              {editingNoteId ? "Save Changes" : "Add Note"} ✦
                            </button>
                          </div>
                        </div>
                      )}

                      {filtered.length === 0 ? (
                        <p className="font-sans text-sm text-ink-faded italic text-center p-2">No notes match this tag.</p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {filtered.map((note) => {
                            const preview = note.body.length > 100 ? note.body.slice(0, 100) + "…" : note.body;
                            return (
                              <div
                                key={note.id}
                                className="bg-parchment border border-sketch rounded-sketch p-3 space-y-1.5 group cursor-pointer hover:border-blush/40 hover:bg-blush/5 hover:shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px transition-all duration-150"
                                onClick={() => setViewingNoteId(note.id)}
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-display text-sm text-ink leading-tight">{note.title}</p>
                                  <span className="font-sans text-[0.5rem] font-bold uppercase tracking-wider text-blush/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    View →
                                  </span>
                                </div>
                                {/* Preview */}
                                {note.body && (
                                  <p className="font-sans text-xs text-ink-faded leading-relaxed line-clamp-2">{preview}</p>
                                )}
                                {/* Tags */}
                                {note.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                                    {note.tags.map((tag) => (
                                      <button key={tag} type="button" onClick={() => setNoteFilter(tag)}
                                        className="font-sans text-[0.5rem] font-bold uppercase tracking-wider text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/10 rounded px-1 p-0.5 hover:bg-dusty-blue/20 transition-colors">
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <p className="font-sans text-[0.5rem] text-ink-faded/50">{new Date(note.createdAt).toLocaleDateString()}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Note view modal */}
                      {viewingNoteId && (() => {
                        const note = entries.find((n) => n.id === viewingNoteId);
                        if (!note) return null;
                        return (
                          <div
                            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => { setViewingNoteId(null); setEditInModal(false); }}
                          >
                            <div
                              className="w-full max-w-lg bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Modal header */}
                              <div className="flex items-start justify-between p-5 border-b border-sketch">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="font-display text-2xl text-ink leading-tight">{note.title}</h2>
                                    {note.tags.map((tag) => (
                                      <span key={tag} className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/10 rounded px-1.5 p-0.5">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="font-sans text-[0.6rem] text-ink-faded mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setViewingNoteId(null); setEditInModal(false); }}
                                  className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm shrink-0"
                                >✕</button>
                              </div>

                              {/* Modal body — view or edit mode */}
                              <div className="p-5 max-h-[28rem] overflow-y-auto">
                                {editInModal ? (
                                  <div className="space-y-3">
                                    <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title"
                                      className="w-full font-display text-lg bg-parchment text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
                                    <textarea rows={6} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write your note..."
                                      className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors resize-none placeholder:text-ink-faded leading-relaxed" />
                                    <input type="text" value={noteTags} onChange={(e) => setNoteTags(e.target.value)} placeholder="Tags — comma separated (e.g. quest, npc)"
                                      className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input p-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {note.body ? (
                                      <p className="font-sans text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{note.body}</p>
                                    ) : (
                                      <p className="font-sans text-sm text-ink-faded italic">No content.</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Modal footer */}
                              <div className="flex gap-2 p-4 border-t border-sketch bg-parchment">
                                {editInModal ? (
                                  <>
                                    <button type="button"
                                      onClick={() => { setEditInModal(false); setNoteTitle(""); setNoteBody(""); setNoteTags(""); }}
                                      className="flex-1 font-sans font-semibold text-xs text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-warm-white hover:bg-paper transition-all">
                                      Cancel
                                    </button>
                                    <button type="button"
                                      onClick={() => {
                                        const tags = noteTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
                                        const updated = entries.map((n) => n.id === note.id
                                          ? { ...n, title: noteTitle.trim() || "Untitled", body: noteBody.trim(), tags }
                                          : n
                                        );
                                        saveNotes(updated);
                                        setEditInModal(false);
                                        setViewingNoteId(null);
                                      }}
                                      className="flex-1 font-sans font-bold text-xs text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all">
                                      Save Changes ✦
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button type="button"
                                      onClick={() => { setEditInModal(true); setNoteTitle(note.title); setNoteBody(note.body); setNoteTags(note.tags.join(", ")); }}
                                      className="flex-1 font-sans font-semibold text-xs text-ink border-2 border-sketch rounded-sketch p-2 bg-warm-white hover:border-blush/50 hover:bg-paper transition-all flex items-center justify-center gap-1.5">
                                      ✏ Edit
                                    </button>
                                    <button type="button"
                                      onClick={() => { deleteNote(note.id); setViewingNoteId(null); setEditInModal(false); }}
                                      className="flex-1 font-sans font-semibold text-xs text-blush border-2 border-blush/30 rounded-sketch p-2 bg-blush/5 hover:bg-blush/10 transition-all flex items-center justify-center gap-1.5">
                                      ✕ Delete
                                    </button>
                                    <button type="button"
                                      onClick={() => { setViewingNoteId(null); setEditInModal(false); }}
                                      className="flex-1 font-sans font-semibold text-xs text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-warm-white hover:bg-paper transition-all">
                                      Close
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

            {/* ── Edit drawers ── */}


      {drawer === "personality" && character && (
        <PersonalityDrawer character={character} onClose={() => setDrawer(null)} onSave={savePersonality} />
      )}

      {drawer === "spellSlots" && character && (
        <SpellSlotsDrawer character={character} onClose={() => setDrawer(null)} onSave={saveSpellSlots} />
      )}
      {drawer === "spells" && character && (
        <SpellsDrawer
          spells={character.spells}
          classIndex={classIndex}
          onClose={() => setDrawer(null)}
          onAdd={addSpell}
          onRemove={removeSpell}
          onTogglePrepared={togglePrepared}
        />
      )}
      {showDelete && character && (
        <DeleteModal
          label="Character"
          confirmText={character.name}
          warning="This will permanently delete the character and all their spells, inventory, and combat history."
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            const res = await fetch(`/api/characters/${characterId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete character");
            router.push(`/campaigns/${character.campaign.id}`);
          }}
        />
      )}

      {drawer === "inventory" && character && (
        <InventoryDrawer
          inventory={character.inventory}
          onClose={() => setDrawer(null)}
          onToggleEquipped={toggleEquipped}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
          onAddFromList={addItemFromList}
          onAddCustom={addCustomItem}
        />
      )}



    </div>
  );
}