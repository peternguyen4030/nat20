"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Spell, Class, SpellCategory } from "@/types/character-creation";
import {
  isSpellcaster,
  getStarterSpells,
  SPELL_COUNTS,
} from "@/lib/starter-spells";

const SCHOOL_COLOR: Record<string, string> = {
  evocation:    "text-blush border-blush/30 bg-blush/10",
  abjuration:   "text-dusty-blue border-dusty-blue/30 bg-dusty-blue/10",
  conjuration:  "text-sage border-sage/30 bg-sage/10",
  divination:   "text-[#D4A853] border-[#D4A853]/30 bg-[#D4A853]/10",
  enchantment:  "text-blush border-blush/30 bg-blush/10",
  illusion:     "text-dusty-blue border-dusty-blue/30 bg-dusty-blue/10",
  necromancy:   "text-ink-soft border-ink-faded/30 bg-ink-faded/10",
  transmutation:"text-sage border-sage/30 bg-sage/10",
};


const CATEGORY_CONFIG: Record<SpellCategory, { label: string; emoji: string; color: string }> = {
  DAMAGING: { label: "Damaging", emoji: "🔥", color: "text-blush border-blush/40 bg-blush/10" },
  HEALING:  { label: "Healing",  emoji: "💚", color: "text-sage border-sage/40 bg-sage/10" },
  CONTROL:  { label: "Control",  emoji: "🕸️", color: "text-dusty-blue border-dusty-blue/40 bg-dusty-blue/10" },
  BUFF:     { label: "Buff",     emoji: "⬆️", color: "text-[#D4A853] border-[#D4A853]/40 bg-[#D4A853]/10" },
  DEBUFF:   { label: "Debuff",   emoji: "⬇️", color: "text-ink-soft border-sketch bg-parchment" },
  DEFENSE:  { label: "Defense",  emoji: "🛡️", color: "text-dusty-blue border-dusty-blue/40 bg-dusty-blue/10" },
  UTILITY:  { label: "Utility",  emoji: "🔧", color: "text-ink-faded border-sketch bg-parchment" },
};

function SpellCard({
  spell,
  isSelected,
  isDefault,
  onToggle,
  disabled,
}: {
  spell: Spell;
  isSelected: boolean;
  isDefault: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const schoolColor = SCHOOL_COLOR[spell.school.toLowerCase()] ?? "text-ink-faded border-sketch bg-parchment";

  return (
    <div
      className={`rounded-sketch border-2 transition-all duration-150 ${
        isSelected
          ? "bg-blush/10 border-blush shadow-sketch-accent"
          : "bg-warm-white border-sketch shadow-sketch"
      }`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Select checkbox */}
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled && !isSelected}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 ${
              isSelected
                ? "bg-blush border-blush text-white"
                : disabled
                ? "bg-parchment border-sketch opacity-40 cursor-not-allowed"
                : "bg-parchment border-sketch hover:border-blush cursor-pointer"
            }`}
          >
            {isSelected && <span className="text-xs leading-none">✓</span>}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5 flex-wrap">
              <p className={`font-display text-base leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>
                {spell.name}
                {isDefault && (
                  <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-sage border border-sage/30 bg-sage/10 rounded px-1 py-0.5 ml-1.5 align-middle">
                    Suggested
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {spell.category && (
                  <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    CATEGORY_CONFIG[spell.category as SpellCategory]?.color ?? "text-ink-faded border-sketch bg-parchment"
                  }`}>
                    {CATEGORY_CONFIG[spell.category as SpellCategory]?.emoji}{" "}
                    {CATEGORY_CONFIG[spell.category as SpellCategory]?.label ?? spell.category}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-1 flex-wrap">
              <span className="font-sans text-[0.65rem] text-ink-faded">⏱ {spell.castingTime}</span>
              <span className="font-sans text-[0.65rem] text-ink-faded">📏 {spell.range}</span>
              <span className="font-sans text-[0.65rem] text-ink-faded">⏳ {spell.duration}</span>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="font-sans text-xs text-ink-faded hover:text-ink transition-colors shrink-0 mt-0.5"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>

        {/* Expanded description */}
        {expanded && (
          <p className="font-sans text-xs text-ink-soft leading-relaxed mt-2 pt-2 border-t border-sketch">
            {spell.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function SpellsStep() {
  const { state, dispatch } = useWizard();
  const [allSpells, setAllSpells]   = useState<Spell[]>([]);
  const [classes, setClasses]       = useState<Class[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]         = useState<"cantrips" | "spells">("cantrips");
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState<SpellCategory | "ALL">("ALL");

  const selectedClass = classes.find((c) => c.id === state.classId);
  const classIndex    = selectedClass?.index ?? "";
  const spellcaster   = isSpellcaster(classIndex);
  const defaults      = getStarterSpells(classIndex);
  const counts        = SPELL_COUNTS[classIndex] ?? { cantrips: 0, spells: 0 };

  // Init default selections on mount / class change
  useEffect(() => {
    if (spellcaster && state.selectedCantrips.length === 0 && state.selectedSpells.length === 0) {
      dispatch({
        type: "SET_SPELLS",
        payload: { cantrips: defaults.cantrips, spells: defaults.spells },
      });
    }
  }, [classIndex]);

  useEffect(() => {
    Promise.all([
      fetch("/api/classes").then((r) => r.json()),
      fetch("/api/spells").then((r) => r.json()),
    ])
      .then(([cls, spells]) => { setClasses(cls); setAllSpells(spells); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!spellcaster) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl text-ink mb-1">Spells</h1>
          <p className="font-sans text-sm text-ink-faded">
            {selectedClass?.name ?? "Your class"} doesn't use magic at level 1.
          </p>
        </div>
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-8 text-center">
          <p className="text-4xl mb-3">⚔️</p>
          <p className="font-display text-xl text-ink mb-2">No spells for {selectedClass?.name ?? "this class"}</p>
          <p className="font-sans text-sm text-ink-faded max-w-sm mx-auto">
            {classIndex === "paladin"
              ? "Paladins gain spells at level 2. You'll be able to add them from your character sheet."
              : "Martial classes rely on physical prowess rather than magic. You can skip this step."}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-warm-white border-2 border-sketch rounded-sketch animate-pulse" />
        ))}
      </div>
    );
  }

  const cantrips   = allSpells.filter((s) => s.level === 0);
  const spells     = allSpells.filter((s) => s.level === 1);
  const activeList = activeTab === "cantrips" ? cantrips : spells;
  const filtered   = activeList.filter((s) => {
    const matchesSearch   = s.name.toLowerCase().includes(search.toLowerCase()) || s.school.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "ALL" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCantrips = state.selectedCantrips;
  const selectedSpells   = state.selectedSpells;
  const cantripLimit     = counts.cantrips;
  const spellLimit       = counts.spells;

  function toggleCantrip(index: string) {
    if (selectedCantrips.includes(index)) {
      dispatch({ type: "SET_SPELLS", payload: { cantrips: selectedCantrips.filter((s) => s !== index), spells: selectedSpells } });
    } else if (selectedCantrips.length < cantripLimit) {
      dispatch({ type: "SET_SPELLS", payload: { cantrips: [...selectedCantrips, index], spells: selectedSpells } });
    }
  }

  function toggleSpell(index: string) {
    if (selectedSpells.includes(index)) {
      dispatch({ type: "SET_SPELLS", payload: { cantrips: selectedCantrips, spells: selectedSpells.filter((s) => s !== index) } });
    } else if (selectedSpells.length < spellLimit) {
      dispatch({ type: "SET_SPELLS", payload: { cantrips: selectedCantrips, spells: [...selectedSpells, index] } });
    }
  }

  const cantripsFull = selectedCantrips.length >= cantripLimit;
  const spellsFull   = selectedSpells.length >= spellLimit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Spells</h1>
        <p className="font-sans text-sm text-ink-faded">
          We've pre-selected a starter set for your {selectedClass?.name}. Swap any spell by
          deselecting it and picking another. Expand a spell to read its description.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: spell list ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tabs + counters */}
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch overflow-hidden">
            <div className="flex border-b border-sketch">
              {(["cantrips", "spells"] as const).map((tab) => {
                const count = tab === "cantrips" ? selectedCantrips.length : selectedSpells.length;
                const limit = tab === "cantrips" ? cantripLimit : spellLimit;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 font-sans font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-150 ${
                      activeTab === tab
                        ? "bg-parchment text-blush border-b-2 border-blush"
                        : "text-ink-faded hover:text-ink"
                    }`}
                  >
                    {tab === "cantrips" ? "✨ Cantrips" : "📖 Level 1 Spells"}
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${
                      count >= limit
                        ? "bg-sage/10 text-sage border-sage/30"
                        : "bg-parchment text-ink-faded border-sketch"
                    }`}>
                      {count}/{limit}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-sketch">
              <input
                type="text"
                placeholder="Search spells..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
              />
            </div>

            {/* Category filters */}
            <div className="p-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("ALL")}
                className={`font-sans text-xs font-semibold px-2.5 py-1 rounded-badge border transition-all duration-150 ${
                  activeCategory === "ALL"
                    ? "bg-ink text-warm-white border-ink"
                    : "bg-parchment text-ink-faded border-sketch hover:border-ink-faded"
                }`}
              >
                All
              </button>
              {(Object.keys(CATEGORY_CONFIG) as SpellCategory[]).map((cat) => {
                const cfg       = CATEGORY_CONFIG[cat];
                const isActive  = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(isActive ? "ALL" : cat)}
                    className={`font-sans text-xs font-semibold px-2.5 py-1 rounded-badge border transition-all duration-150 ${
                      isActive
                        ? cfg.color + " font-bold"
                        : "bg-parchment text-ink-faded border-sketch hover:border-ink-faded"
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spell cards */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="font-display text-sm text-ink-faded">No spells match your filters.</p>
                {activeCategory !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("ALL")}
                    className="font-sans text-xs text-blush underline decoration-dotted underline-offset-2"
                  >
                    Clear category filter
                  </button>
                )}
              </div>
            ) : (
              filtered.map((spell) => {
                const isCantrip    = activeTab === "cantrips";
                const isSelected   = isCantrip ? selectedCantrips.includes(spell.index) : selectedSpells.includes(spell.index);
                const isDefault    = isCantrip ? defaults.cantrips.includes(spell.index) : defaults.spells.includes(spell.index);
                const isFull       = isCantrip ? cantripsFull : spellsFull;
                return (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    isSelected={isSelected}
                    isDefault={isDefault}
                    onToggle={() => isCantrip ? toggleCantrip(spell.index) : toggleSpell(spell.index)}
                    disabled={isFull && !isSelected}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: help panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="font-display text-xl text-ink">About Spells</h2>
            </div>

            <div className="space-y-3 font-sans text-sm text-ink-soft leading-relaxed">
              <div className="space-y-2">
                <div className="bg-parchment border border-sketch rounded-input p-3">
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Cantrips</p>
                  <p className="text-xs">Simple spells you can cast unlimited times — no spell slots required. Your bread and butter in and out of combat.</p>
                </div>
                <div className="bg-parchment border border-sketch rounded-input p-3">
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Level 1 Spells</p>
                  <p className="text-xs">More powerful spells that consume spell slots. At level 1 you have 2 spell slots — they restore after a long rest.</p>
                </div>
              </div>

              <div className="border-t border-sketch pt-3 space-y-1.5 text-xs">
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-sage mr-1">✦</span><strong className="text-ink">Suggested</strong> spells are our starter recommendations</p>
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span>Deselect any spell to swap it for another</p>
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span>Expand a spell card to read its full description</p>
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span>You can manage spells from your character sheet later</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}