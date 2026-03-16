"use client";

import { useState, useEffect } from "react";
import { EditDrawer, FieldRow, StatPip } from "./sheet-ui";
import {
  Character, AbilityScores, CharacterSpell, InventoryItem, CharacterProficiency,
  ABILITY_KEYS, CONDITIONS, CATEGORY_COLOR, SPELL_CATEGORY_LABELS,
  ITEM_TYPE_EMOJI, ITEM_TYPES, SKILLS_MAP, mod, modNum, COMMON_LANGUAGES,
} from "../types/character-sheet";

// ── Ability Score editor ──────────────────────────────────────────────────────

export function AbilityScoreDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (scores: AbilityScores) => Promise<void>;
}) {
  const [scores, setScores] = useState<AbilityScores>(
    character.abilityScores ?? { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true); await onSave(scores); setSaving(false); onClose();
  }

  return (
    <EditDrawer title="Ability Scores" icon="🎯" onClose={onClose} onSave={handleSave} saving={saving}>
      <p className="font-sans text-sm text-ink-faded leading-relaxed">
        These six scores define your character's raw capabilities. Modifiers are calculated automatically.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ABILITY_KEYS.map(({ key, label, abbr }) => {
          const score = scores[key as keyof AbilityScores];
          return (
            <div key={key} className="bg-parchment border-2 border-sketch rounded-sketch p-3 text-center">
              <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-2">{label}</p>
              <input type="number" min={1} max={30} value={score}
                onChange={(e) => setScores((p) => ({ ...p, [key]: Number(e.target.value) }))}
                className="w-16 font-mono text-2xl font-bold text-ink text-center bg-warm-white border-2 border-sketch rounded-input px-1 py-1 outline-none focus:border-blush transition-colors"
              />
              <p className={`font-mono text-sm font-semibold mt-1.5 ${modNum(score) >= 0 ? "text-sage" : "text-blush"}`}>
                {mod(score)}
              </p>
              <p className="font-sans text-[0.6rem] text-ink-faded">{abbr}</p>
            </div>
          );
        })}
      </div>
    </EditDrawer>
  );
}

// ── Combat Stats editor ───────────────────────────────────────────────────────

export function CombatStatsDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (data: Partial<Character>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    armorClass: character.armorClass, speed: character.speed,
    initiative: character.initiative, proficiencyBonus: character.proficiencyBonus,
    maxHp: character.maxHp, currentHp: character.currentHp, temporaryHp: character.temporaryHp,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true); await onSave(draft); setSaving(false); onClose();
  }

  const fields = [
    { key: "armorClass",       label: "Armor Class",       hint: "Base AC from armor + DEX modifier" },
    { key: "speed",            label: "Speed (ft)",         hint: "Base movement per turn" },
    { key: "initiative",       label: "Initiative Bonus",   hint: "Usually your DEX modifier" },
    { key: "proficiencyBonus", label: "Proficiency Bonus",  hint: "+2 at level 1, increases at 5, 9, 13, 17" },
    { key: "maxHp",            label: "Max HP",             hint: "" },
    { key: "currentHp",        label: "Current HP",         hint: "" },
    { key: "temporaryHp",      label: "Temporary HP",       hint: "Doesn't stack — take the highest if you gain more" },
  ];

  return (
    <EditDrawer title="Combat Stats" icon="⚔️" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-3">
        {fields.map(({ key, label, hint }) => (
          <FieldRow key={key} label={label} hint={hint}>
            <input type="number" value={draft[key as keyof typeof draft]}
              onChange={(e) => setDraft((p) => ({ ...p, [key]: Number(e.target.value) }))}
              className="w-full font-mono text-lg text-ink bg-parchment border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors"
            />
          </FieldRow>
        ))}
      </div>
    </EditDrawer>
  );
}

// ── Skills editor ─────────────────────────────────────────────────────────────

export function SkillsDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (proficiencies: { add: string[]; remove: string[]; expertise: string[] }, bonuses: Record<string, number>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [bonuses, setBonuses] = useState<Record<string, number>>(
    character.skillBonuses ?? {}
  );

  // Track which skills are proficient and which have expertise locally
  const proficientSet = new Set(
    character.proficiencies
      .filter((p) => p.proficiency.type === "Skills")
      .map((p) => p.proficiency.index)
  );
  const expertiseSet = new Set(
    character.proficiencies
      .filter((p) => p.expertise && p.proficiency.type === "Skills")
      .map((p) => p.proficiency.index)
  );

  const [proficient, setProficient] = useState<Set<string>>(new Set(proficientSet));
  const [expertise,  setExpertise]  = useState<Set<string>>(new Set(expertiseSet));

  const profBonus = character.proficiencyBonus;
  const scores    = character.abilityScores;

  function toggleProficient(key: string) {
    setProficient((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); setExpertise((e) => { const ne = new Set(e); ne.delete(key); return ne; }); }
      else next.add(key);
      return next;
    });
  }

  function toggleExpertise(key: string) {
    if (!proficient.has(key)) return;
    setExpertise((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const add    = [...proficient].filter((k) => !proficientSet.has(k));
    const remove = [...proficientSet].filter((k) => !proficient.has(k));
    const exp    = [...expertise];
    await onSave({ add, remove, expertise: exp }, bonuses);
    setSaving(false); onClose();
  }

  return (
    <EditDrawer title="Skills" icon="🎯" onClose={onClose} onSave={handleSave} saving={saving}>
      <p className="font-sans text-sm text-ink-faded leading-relaxed">
        Toggle proficiency and expertise. Add a bonus for magic items or situational modifiers.
      </p>
      <div className="space-y-1">
        {SKILLS_MAP.map((skill) => {
          const score     = scores?.[skill.ability as keyof AbilityScores] ?? 10;
          const isProficient = proficient.has(`skill-${skill.key}`);
          const isExpertise  = expertise.has(`skill-${skill.key}`);
          const bonus     = modNum(score) + (isExpertise ? profBonus * 2 : isProficient ? profBonus : 0) + (bonuses[skill.key] ?? 0);
          const total     = bonus >= 0 ? `+${bonus}` : `${bonus}`;

          return (
            <div key={skill.key} className="flex items-center gap-2 py-1.5 border-b border-sketch/40 last:border-0">
              {/* Proficiency dot */}
              <button type="button" onClick={() => toggleProficient(`skill-${skill.key}`)}
                className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all ${isProficient ? "bg-blush border-blush" : "bg-parchment border-sketch hover:border-blush/50"}`}
              />
              {/* Expertise dot */}
              <button type="button" onClick={() => toggleExpertise(`skill-${skill.key}`)}
                title={isProficient ? "Toggle expertise" : "Must be proficient first"}
                className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all ${
                  isExpertise ? "bg-blush border-blush" :
                  isProficient ? "bg-blush/20 border-blush/40 hover:border-blush" :
                  "bg-parchment border-sketch/40 opacity-30 cursor-not-allowed"
                }`}
              />
              <span className="font-sans text-xs text-ink-soft flex-1">{skill.label}</span>
              <span className="font-mono text-[0.6rem] text-ink-faded/60 w-7">{skill.ability.slice(0,3).toUpperCase()}</span>
              {/* Bonus input */}
              <input type="number" value={bonuses[skill.key] ?? 0}
                onChange={(e) => setBonuses((p) => ({ ...p, [skill.key]: Number(e.target.value) }))}
                className="w-10 font-mono text-xs text-center bg-parchment border border-sketch rounded px-1 py-0.5 outline-none focus:border-blush"
              />
              <span className={`font-mono text-xs font-bold w-7 text-right ${bonus >= 0 ? "text-sage" : "text-blush"}`}>{total}</span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-sketch pt-3 space-y-1 text-xs font-sans text-ink-faded">
        <p className="flex gap-2"><span className="text-blush">●</span> Left dot = proficiency (+{profBonus})</p>
        <p className="flex gap-2"><span className="text-blush">●</span> Right dot = expertise (+{profBonus * 2} total)</p>
        <p className="flex gap-2"><span className="text-ink-faded">+</span> Bonus column = situational/item bonus</p>
      </div>
    </EditDrawer>
  );
}

// ── Saving Throws editor ──────────────────────────────────────────────────────

export function SavingThrowsDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (proficiencies: { add: string[]; remove: string[] }, bonuses: Record<string, number>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [bonuses, setBonuses] = useState<Record<string, number>>(
    character.savingThrowBonuses ?? {}
  );

  const saveProfSet = new Set(
    character.proficiencies
      .filter((p) => p.proficiency.type === "Saving Throws")
      .map((p) => p.proficiency.index)
  );
  const [proficient, setProficient] = useState<Set<string>>(new Set(saveProfSet));

  const scores    = character.abilityScores;
  const profBonus = character.proficiencyBonus;

  function toggle(key: string) {
    setProficient((prev) => {
      const next = new Set(prev);
      if (next.has(`saving-throw-${key}`)) next.delete(`saving-throw-${key}`);
      else next.add(`saving-throw-${key}`);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const add    = [...proficient].filter((k) => !saveProfSet.has(k));
    const remove = [...saveProfSet].filter((k) => !proficient.has(k));
    await onSave({ add, remove }, bonuses);
    setSaving(false); onClose();
  }

  return (
    <EditDrawer title="Saving Throws" icon="🛡️" onClose={onClose} onSave={handleSave} saving={saving}>
      <p className="font-sans text-sm text-ink-faded leading-relaxed">
        Toggle proficiency per saving throw and add bonus overrides for magic items or class features.
      </p>
      <div className="space-y-2">
        {ABILITY_KEYS.map(({ key, label, abbr }) => {
          const score        = scores?.[key as keyof AbilityScores] ?? 10;
          const isProficient = proficient.has(`saving-throw-${key}`);
          const bonus        = modNum(score) + (isProficient ? profBonus : 0) + (bonuses[key] ?? 0);
          const total        = bonus >= 0 ? `+${bonus}` : `${bonus}`;

          return (
            <div key={key} className="flex items-center gap-3 py-1.5 border-b border-sketch/40 last:border-0">
              <button type="button" onClick={() => toggle(key)}
                className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${isProficient ? "bg-blush border-blush" : "bg-parchment border-sketch hover:border-blush/50"}`}
              />
              <span className="font-mono text-xs text-ink-faded w-8">{abbr}</span>
              <span className="font-sans text-sm text-ink-soft flex-1">{label}</span>
              <input type="number" value={bonuses[key] ?? 0}
                onChange={(e) => setBonuses((p) => ({ ...p, [key]: Number(e.target.value) }))}
                className="w-12 font-mono text-xs text-center bg-parchment border border-sketch rounded px-1 py-0.5 outline-none focus:border-blush"
              />
              <span className={`font-mono text-sm font-bold w-8 text-right ${bonus >= 0 ? "text-sage" : "text-blush"}`}>{total}</span>
            </div>
          );
        })}
      </div>
      <p className="font-sans text-xs text-ink-faded border-t border-sketch pt-3">
        Bonus column — use for magic items, feats like War Caster, or class features that add to specific saves.
      </p>
    </EditDrawer>
  );
}

// ── Proficiencies & Languages editor ─────────────────────────────────────────

export function ProficienciesDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (data: { add: string[]; remove: string[]; languages: string[] }) => Promise<void>;
}) {
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [allProfs, setAllProfs] = useState<{ id: string; index: string; name: string; type: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [languages, setLanguages] = useState<string[]>(character.languages ?? []);
  const [langInput, setLangInput] = useState("");

  const currentProfIds = new Set(character.proficiencies.map((p) => p.proficiency.index));
  const [selected, setSelected] = useState<Set<string>>(new Set(currentProfIds));

  useEffect(() => {
    fetch("/api/proficiencies")
      .then((r) => r.json())
      .then((data) => { setAllProfs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleProf(index: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function addLanguage(lang: string) {
    const trimmed = lang.trim();
    if (!trimmed || languages.includes(trimmed)) return;
    setLanguages((prev) => [...prev, trimmed]);
    setLangInput("");
  }

  function removeLanguage(lang: string) {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  }

  async function handleSave() {
    setSaving(true);
    const add    = [...selected].filter((k) => !currentProfIds.has(k));
    const remove = [...currentProfIds].filter((k) => !selected.has(k));
    await onSave({ add, remove, languages });
    setSaving(false); onClose();
  }

  const filtered = allProfs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    p.type !== "Skills" && p.type !== "Saving Throws"
  );

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {});

  return (
    <EditDrawer title="Proficiencies & Languages" icon="📚" onClose={onClose} onSave={handleSave} saving={saving}>

      {/* Languages */}
      <div>
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Languages</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {languages.map((lang) => (
            <span key={lang} className="flex items-center gap-1 font-sans text-xs text-ink-soft bg-parchment border border-sketch rounded-badge px-2 py-0.5">
              {lang}
              <button type="button" onClick={() => removeLanguage(lang)} className="text-ink-faded hover:text-blush transition-colors ml-0.5">✕</button>
            </span>
          ))}
          {languages.length === 0 && <p className="font-sans text-xs text-ink-faded italic">No languages added</p>}
        </div>
        {/* Quick-add from common list */}
        <div className="flex flex-wrap gap-1 mb-2">
          {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).slice(0, 8).map((lang) => (
            <button key={lang} type="button" onClick={() => addLanguage(lang)}
              className="font-sans text-xs text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/5 rounded-badge px-2 py-0.5 hover:bg-dusty-blue/10 transition-all"
            >
              + {lang}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={langInput} onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLanguage(langInput)}
            placeholder="Custom language..."
            className="flex-1 font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-1.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
          />
          <button type="button" onClick={() => addLanguage(langInput)}
            className="font-sans text-xs font-bold text-white bg-blush border-2 border-blush rounded-sketch px-3 py-1.5 hover:-translate-x-px hover:-translate-y-px transition-all"
          >Add</button>
        </div>
      </div>

      {/* Proficiencies */}
      <div>
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Proficiencies</p>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search armor, weapons, tools..."
          className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded mb-3"
        />
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-parchment rounded-sketch animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([type, profs]) => (
              <div key={type}>
                <p className="font-sans text-[0.6rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">{type}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profs.map((prof) => {
                    const isSelected = selected.has(prof.index);
                    return (
                      <button key={prof.index} type="button" onClick={() => toggleProf(prof.index)}
                        className={`font-sans text-xs px-2 py-0.5 rounded-badge border transition-all ${
                          isSelected
                            ? "bg-blush/10 text-blush border-blush/40 font-semibold"
                            : "bg-parchment text-ink-faded border-sketch hover:border-blush/40"
                        }`}
                      >
                        {isSelected ? "✓ " : ""}{prof.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EditDrawer>
  );
}

// ── Personality editor ────────────────────────────────────────────────────────

export function PersonalityDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (data: Partial<Character>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    personalityTrait: character.personalityTrait ?? "",
    ideal: character.ideal ?? "", bond: character.bond ?? "",
    flaw: character.flaw ?? "", notes: character.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true); await onSave(draft); setSaving(false); onClose();
  }

  const fields = [
    { key: "personalityTrait", label: "🎭 Personality Trait", placeholder: "How does your character act day to day?" },
    { key: "ideal",            label: "⭐ Ideal",              placeholder: "What principle drives your character above all else?" },
    { key: "bond",             label: "🔗 Bond",               placeholder: "Who or what matters most to your character?" },
    { key: "flaw",             label: "⚡ Flaw",               placeholder: "What weakness or vice does your character struggle with?" },
    { key: "notes",            label: "📝 Notes",              placeholder: "Anything else worth remembering..." },
  ];

  return (
    <EditDrawer title="Personality & Notes" icon="🎭" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <FieldRow key={key} label={label}>
            <textarea rows={key === "notes" ? 4 : 3} value={draft[key as keyof typeof draft]}
              placeholder={placeholder}
              onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded resize-none leading-relaxed"
            />
          </FieldRow>
        ))}
      </div>
    </EditDrawer>
  );
}

// ── Conditions editor ─────────────────────────────────────────────────────────

export function ConditionsDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (conditions: string[]) => Promise<void>;
}) {
  const [active, setActive] = useState<string[]>(character.conditions ?? []);
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setActive((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);
  }

  async function handleSave() {
    setSaving(true); await onSave(active); setSaving(false); onClose();
  }

  return (
    <EditDrawer title="Conditions" icon="⚠️" onClose={onClose} onSave={handleSave} saving={saving}>
      <p className="font-sans text-sm text-ink-faded leading-relaxed">
        Toggle any conditions currently affecting your character.
      </p>
      <div className="space-y-2">
        {CONDITIONS.map((cond) => {
          const isActive = active.includes(cond.key);
          return (
            <button key={cond.key} type="button" onClick={() => toggle(cond.key)}
              className={`w-full p-3 rounded-sketch border-2 text-left transition-all duration-150 ${isActive ? `${cond.bg} ${cond.border}` : "bg-parchment border-sketch hover:bg-paper"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? cond.dot : "bg-sketch"}`} />
                  <span className={`font-sans text-sm font-semibold ${isActive ? cond.color : "text-ink-soft"}`}>{cond.label}</span>
                </div>
                {isActive && <span className={`font-sans text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cond.bg} ${cond.color} ${cond.border}`}>Active</span>}
              </div>
              <p className="font-sans text-xs text-ink-faded leading-relaxed pl-4">{cond.description}</p>
            </button>
          );
        })}
      </div>
    </EditDrawer>
  );
}

// ── Spell Slots editor ────────────────────────────────────────────────────────

export function SpellSlotsDrawer({ character, onClose, onSave }: {
  character: Character; onClose: () => void;
  onSave: (slots: Record<string, { max: number; used: number }>) => Promise<void>;
}) {
  const [slots, setSlots] = useState<Record<string, { max: number; used: number }>>(character.spellSlots ?? {});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true); await onSave(slots); setSaving(false); onClose();
  }

  function toggleSlot(level: string, index: number) {
    const current = slots[level] ?? { max: 0, used: 0 };
    const newUsed = index < current.used ? index : index + 1;
    setSlots((prev) => ({ ...prev, [level]: { ...current, used: Math.min(newUsed, current.max) } }));
  }

  function updateMax(level: string, max: number) {
    const current = slots[level] ?? { max: 0, used: 0 };
    setSlots((prev) => ({ ...prev, [level]: { max, used: Math.min(current.used, max) } }));
  }

  return (
    <EditDrawer title="Spell Slots" icon="✨" onClose={onClose} onSave={handleSave} saving={saving}>
      <p className="font-sans text-sm text-ink-faded leading-relaxed">
        Click pips to mark slots as used. Adjust max slots per level. Restore all with a long rest.
      </p>
      <div className="space-y-3">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => {
          const slot    = slots[String(level)] ?? { max: 0, used: 0 };
          const isEmpty = slot.max === 0;
          return (
            <div key={level} className={`p-3 rounded-sketch border ${isEmpty ? "border-sketch bg-parchment opacity-50" : "border-sketch bg-warm-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-sans text-xs font-bold text-ink">Level {level}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateMax(String(level), Math.max(0, slot.max - 1))} className="w-6 h-6 rounded border border-sketch bg-parchment text-ink-faded hover:text-ink text-xs flex items-center justify-center">−</button>
                  <span className="font-mono text-sm text-ink w-4 text-center">{slot.max}</span>
                  <button type="button" onClick={() => updateMax(String(level), Math.min(9, slot.max + 1))} className="w-6 h-6 rounded border border-sketch bg-parchment text-ink-faded hover:text-ink text-xs flex items-center justify-center">+</button>
                </div>
              </div>
              {slot.max > 0 && (
                <div className="flex gap-1.5 flex-wrap items-center">
                  {Array.from({ length: slot.max }, (_, i) => (
                    <StatPip key={i} filled={i < slot.used} onClick={() => toggleSlot(String(level), i)} color="bg-dusty-blue" />
                  ))}
                  <span className="font-sans text-xs text-ink-faded ml-1">{slot.used}/{slot.max} used</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EditDrawer>
  );
}

// ── Spells drawer ─────────────────────────────────────────────────────────────

export function SpellsDrawer({ spells, onClose, onAdd, onRemove, onTogglePrepared }: {
  spells: CharacterSpell[]; onClose: () => void;
  onAdd: (spellIndex: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onTogglePrepared: (id: string, current: string) => Promise<void>;
}) {
  const [filter, setFilter]     = useState("ALL");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addMode, setAddMode]   = useState(false);
  const [allSpells, setAllSpells]   = useState<any[]>([]);
  const [loadingSpells, setLoadingSpells] = useState(false);

  useEffect(() => {
    if (addMode && allSpells.length === 0) {
      setLoadingSpells(true);
      fetch("/api/spells").then((r) => r.json()).then((d) => { setAllSpells(d); setLoadingSpells(false); }).catch(() => setLoadingSpells(false));
    }
  }, [addMode]);

  const categories  = ["ALL", ...Array.from(new Set(spells.map((s) => s.spell.category))).sort()];
  const filtered    = spells.filter((s) => (filter === "ALL" || s.spell.category === filter) && s.spell.name.toLowerCase().includes(search.toLowerCase()));
  const grouped     = filtered.reduce<Record<number, CharacterSpell[]>>((acc, s) => { const lvl = s.spell.level; if (!acc[lvl]) acc[lvl] = []; acc[lvl].push(s); return acc; }, {});
  const knownIndices = new Set(spells.map((s) => s.spell.index));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-warm-white border-l-2 border-sketch shadow-[-4px_0_32px_rgba(0,0,0,0.15)] flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sketch bg-parchment">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-display text-xl text-ink">Spells</h2>
            <span className="font-mono text-xs text-ink-faded bg-warm-white border border-sketch rounded px-1.5 py-0.5">{spells.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAddMode((a) => !a)} className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-sketch border-2 transition-all ${addMode ? "bg-blush text-white border-blush" : "bg-parchment text-ink-soft border-sketch hover:border-blush/50"}`}>
              {addMode ? "← Back" : "+ Add Spell"}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-input border-2 border-sketch bg-warm-white text-ink-faded hover:border-blush transition-all flex items-center justify-center text-xs">✕</button>
          </div>
        </div>

        {!addMode ? (
          <>
            <div className="px-4 py-3 border-b border-sketch space-y-2">
              <input type="text" placeholder="Search spells..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setFilter(cat)}
                    className={`font-sans text-xs font-semibold px-2 py-0.5 rounded-badge border transition-all ${filter === cat ? "bg-blush text-white border-blush" : "bg-parchment text-ink-faded border-sketch hover:border-ink-faded"}`}>
                    {cat === "ALL" ? "All" : SPELL_CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((lvl) => (
                <div key={lvl}>
                  <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">{lvl === "0" ? "Cantrips" : `Level ${lvl}`}</p>
                  <div className="space-y-1.5">
                    {grouped[Number(lvl)].map((cs) => (
                      <div key={cs.id} className="bg-parchment border border-sketch rounded-sketch">
                        <div className="p-3 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <button type="button" onClick={() => setExpanded(expanded === cs.id ? null : cs.id)} className="w-full text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-display text-base text-ink leading-tight">{cs.spell.name}</p>
                                <span className={`font-sans text-[0.55rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CATEGORY_COLOR[cs.spell.category] ?? ""}`}>{cs.spell.category}</span>
                              </div>
                              <p className="font-sans text-xs text-ink-faded mt-0.5">{cs.spell.castingTime} · {cs.spell.range} · {cs.spell.duration}</p>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cs.spell.level > 0 && (
                              <button type="button" onClick={() => onTogglePrepared(cs.id, cs.status)}
                                className={`font-sans text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded border transition-all ${cs.status === "PREPARED" ? "text-sage border-sage/30 bg-sage/10" : "text-ink-faded border-sketch bg-parchment hover:border-sage/50"}`}>
                                {cs.status === "PREPARED" ? "Prepared" : "Known"}
                              </button>
                            )}
                            <button type="button" onClick={() => onRemove(cs.id)} className="w-5 h-5 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs">✕</button>
                          </div>
                        </div>
                        {expanded === cs.id && (
                          <div className="px-3 pb-3 border-t border-sketch pt-2">
                            <p className="font-sans text-xs text-ink-soft leading-relaxed">{cs.spell.description}</p>
                            {cs.spell.higherLevels && <p className="font-sans text-xs text-dusty-blue mt-2 leading-relaxed"><strong>At Higher Levels:</strong> {cs.spell.higherLevels}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="font-display text-sm text-ink-faded text-center py-8">No spells match your filters.</p>}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <input type="text" placeholder="Search all spells..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
            {loadingSpells ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-parchment border border-sketch rounded-sketch animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {allSpells.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())).map((spell) => {
                  const alreadyKnown = knownIndices.has(spell.index);
                  return (
                    <div key={spell.id} className={`flex items-center gap-2 p-2.5 rounded-sketch border ${alreadyKnown ? "border-sage/30 bg-sage/5 opacity-60" : "border-sketch bg-parchment"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-ink leading-tight">{spell.name}</p>
                        <p className="font-sans text-xs text-ink-faded">{spell.level === 0 ? "Cantrip" : `Level ${spell.level}`} · {spell.school}</p>
                      </div>
                      {alreadyKnown ? (
                        <span className="font-sans text-[0.6rem] text-sage font-bold uppercase tracking-wider">Known</span>
                      ) : (
                        <button type="button" onClick={() => onAdd(spell.index)} className="w-7 h-7 rounded-sketch border-2 border-blush text-blush hover:bg-blush hover:text-white transition-all flex items-center justify-center font-bold text-sm">+</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inventory drawer ──────────────────────────────────────────────────────────

export function InventoryDrawer({ inventory, onClose, onToggleEquipped, onUpdateQuantity, onRemove, onAddFromList, onAddCustom }: {
  inventory: InventoryItem[]; onClose: () => void;
  onToggleEquipped: (id: string, equipped: boolean) => Promise<void>;
  onUpdateQuantity: (id: string, qty: number) => Promise<void>;
  onRemove:         (id: string) => Promise<void>;
  onAddFromList:    (itemIndex: string) => Promise<void>;
  onAddCustom:      (data: { name: string; description: string; type: string }) => Promise<void>;
}) {
  const [search, setSearch]   = useState("");
  const [addMode, setAddMode] = useState<"none" | "list" | "custom">("none");
  const [allItems, setAllItems]   = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [customForm, setCustomForm] = useState({ name: "", description: "", type: "GEAR" });

  useEffect(() => {
    if (addMode === "list" && allItems.length === 0) {
      setLoadingItems(true);
      fetch("/api/items").then((r) => r.json()).then((d) => { setAllItems(d); setLoadingItems(false); }).catch(() => setLoadingItems(false));
    }
  }, [addMode]);

  const knownItemIds = new Set(inventory.filter((i) => i.itemId).map((i) => i.itemId));
  const filtered     = inventory.filter((i) => {
    const name = i.item?.name ?? i.customName ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-warm-white border-l-2 border-sketch shadow-[-4px_0_32px_rgba(0,0,0,0.15)] flex flex-col h-full">

        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sketch bg-parchment">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎒</span>
            <h2 className="font-display text-xl text-ink">Inventory</h2>
            <span className="font-mono text-xs text-ink-faded bg-warm-white border border-sketch rounded px-1.5 py-0.5">{inventory.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {addMode === "none" ? (
              <>
                <button onClick={() => setAddMode("list")} className="font-sans text-xs font-semibold px-2.5 py-1.5 rounded-sketch border-2 border-sketch bg-parchment text-ink-soft hover:border-blush/50 transition-all">
                  + From List
                </button>
                <button onClick={() => setAddMode("custom")} className="font-sans text-xs font-semibold px-2.5 py-1.5 rounded-sketch border-2 border-blush bg-blush/10 text-blush hover:bg-blush/20 transition-all">
                  + Custom
                </button>
              </>
            ) : (
              <button onClick={() => setAddMode("none")} className="font-sans text-xs font-semibold px-3 py-1.5 rounded-sketch border-2 border-sketch bg-parchment text-ink-soft hover:border-blush/50 transition-all">
                ← Back
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-input border-2 border-sketch bg-warm-white text-ink-faded hover:border-blush transition-all flex items-center justify-center text-xs">✕</button>
          </div>
        </div>

        {/* Add from list mode */}
        {addMode === "list" && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
            {loadingItems ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-parchment border border-sketch rounded-sketch animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {allItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => {
                  const alreadyHas = knownItemIds.has(item.id);
                  return (
                    <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-sketch border ${alreadyHas ? "border-sage/30 bg-sage/5 opacity-60" : "border-sketch bg-parchment"}`}>
                      <span className="text-base">{ITEM_TYPE_EMOJI[item.type] ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-ink leading-tight">{item.name}</p>
                        <p className="font-sans text-xs text-ink-faded">{item.type}{item.damageDice ? ` · ${item.damageDice}` : ""}{item.cost ? ` · ${item.cost}` : ""}</p>
                      </div>
                      {alreadyHas ? (
                        <span className="font-sans text-[0.6rem] text-sage font-bold uppercase">Owned</span>
                      ) : (
                        <button type="button" onClick={() => onAddFromList(item.index)} className="w-7 h-7 rounded-sketch border-2 border-blush text-blush hover:bg-blush hover:text-white transition-all flex items-center justify-center font-bold text-sm">+</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add custom item mode */}
        {addMode === "custom" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <p className="font-sans text-sm text-ink-faded">Add a custom item that isn't in the standard item list.</p>
            <FieldRow label="Item Name *">
              <input type="text" value={customForm.name} onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Enchanted Dagger of Shadows"
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
              />
            </FieldRow>
            <FieldRow label="Type">
              <select value={customForm.type} onChange={(e) => setCustomForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors"
              >
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Description">
              <textarea rows={3} value={customForm.description} onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What does this item do?"
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded resize-none"
              />
            </FieldRow>
            <button
              type="button"
              disabled={!customForm.name.trim()}
              onClick={async () => { await onAddCustom(customForm); setCustomForm({ name: "", description: "", type: "GEAR" }); setAddMode("none"); }}
              className={`w-full font-sans font-bold text-sm text-white rounded-sketch px-4 py-2.5 border-2 transition-all ${customForm.name.trim() ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px" : "bg-tan border-sketch opacity-50 cursor-not-allowed"}`}
            >
              Add to Inventory ✦
            </button>
          </div>
        )}

        {/* Inventory list */}
        {addMode === "none" && (
          <>
            <div className="px-4 py-3 border-b border-sketch">
              <input type="text" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2 outline-none focus:border-blush transition-colors placeholder:text-ink-faded" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filtered.map((ci) => {
                const name = ci.item?.name ?? ci.customName ?? "Unknown Item";
                const desc = ci.item?.description ?? ci.customDescription;
                const type = ci.item?.type ?? ci.customType ?? "GEAR";
                return (
                  <div key={ci.id} className="bg-parchment border border-sketch rounded-sketch p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{ITEM_TYPE_EMOJI[type] ?? "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-base text-ink leading-tight">{name}</p>
                          <button type="button" onClick={() => onRemove(ci.id)} className="w-5 h-5 rounded border border-sketch text-ink-faded hover:text-blush hover:border-blush/40 transition-all flex items-center justify-center text-xs shrink-0">✕</button>
                        </div>
                        {ci.item?.damageDice && <p className="font-mono text-xs text-blush mt-0.5">{ci.item.damageDice} {ci.item.damageType}</p>}
                        {!ci.itemId && <span className="font-sans text-[0.55rem] font-bold uppercase text-dusty-blue border border-dusty-blue/30 bg-dusty-blue/5 rounded px-1.5 py-0.5">Custom</span>}
                        {desc && <p className="font-sans text-xs text-ink-faded mt-1 leading-relaxed line-clamp-2">{desc}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => onUpdateQuantity(ci.id, Math.max(1, ci.quantity - 1))} className="w-5 h-5 rounded border border-sketch text-ink-faded hover:text-ink flex items-center justify-center text-xs">−</button>
                            <span className="font-mono text-xs text-ink w-5 text-center">{ci.quantity}</span>
                            <button onClick={() => onUpdateQuantity(ci.id, ci.quantity + 1)} className="w-5 h-5 rounded border border-sketch text-ink-faded hover:text-ink flex items-center justify-center text-xs">+</button>
                          </div>
                          <button type="button" onClick={() => onToggleEquipped(ci.id, ci.equipped)}
                            className={`font-sans text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded border transition-all ${ci.equipped ? "text-sage border-sage/30 bg-sage/10" : "text-ink-faded border-sketch hover:border-sage/50"}`}>
                            {ci.equipped ? "Equipped" : "Equip"}
                          </button>
                          {ci.item?.cost && <span className="font-sans text-xs text-ink-faded">{ci.item.cost}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="font-display text-sm text-ink-faded text-center py-8">
                  {inventory.length === 0 ? "No items yet. Use the buttons above to add." : "No items match your search."}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
