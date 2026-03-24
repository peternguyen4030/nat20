"use client";

import { useState } from "react";
import { useWizard } from "@/context/WizardContext";
import {
  AbilityScoreMethod,
  AbilityScores,
  ABILITY_NAMES,
  STANDARD_ARRAY,
  POINT_BUY_COSTS,
  POINT_BUY_BUDGET,
} from "@/types/character-creation";

// ── Class stat priority guide ─────────────────────────────────────────────────
const CLASS_STAT_PRIORITY: Record<string, {
  primary: string[]; secondary: string[]; notes: string;
}> = {
  barbarian: { primary: ["Strength"],              secondary: ["Constitution"], notes: "You're a frontline fighter. High STR means harder hits, high CON means more HP to soak damage." },
  bard:      { primary: ["Charisma"],              secondary: ["Dexterity"],   notes: "Your magic and social skills run on CHA. DEX keeps your AC up since you'll avoid heavy armor." },
  cleric:    { primary: ["Wisdom"],                secondary: ["Constitution"], notes: "WIS powers your spells and spell save DC. CON keeps you alive while you support the party." },
  druid:     { primary: ["Wisdom"],                secondary: ["Constitution"], notes: "WIS fuels your spellcasting. CON helps you survive in Wild Shape and on the front line." },
  fighter:   { primary: ["Strength", "Dexterity"], secondary: ["Constitution"], notes: "STR for melee, DEX for ranged or finesse builds. CON is always important for survivability." },
  monk:      { primary: ["Dexterity"],             secondary: ["Wisdom"],       notes: "DEX drives your attacks and AC unarmored. WIS boosts your AC further and powers ki abilities." },
  paladin:   { primary: ["Strength"],              secondary: ["Charisma"],    notes: "STR for melee combat. CHA powers your Auras and Lay on Hands become more effective as you level." },
  ranger:    { primary: ["Dexterity"],             secondary: ["Wisdom"],       notes: "DEX for attacks and AC. WIS supports your spellcasting once you reach level 2." },
  rogue:     { primary: ["Dexterity"],             secondary: ["Charisma"],    notes: "DEX drives your attacks, AC, and Stealth. CHA helps with Deception and social skills." },
  sorcerer:  { primary: ["Charisma"],              secondary: ["Constitution"], notes: "CHA is everything — it powers your spells and save DC. CON helps you concentrate on spells." },
  warlock:   { primary: ["Charisma"],              secondary: ["Constitution"], notes: "CHA drives your Eldritch Blast and spells. CON helps maintain concentration." },
  wizard:    { primary: ["Intelligence"],          secondary: ["Constitution"], notes: "INT is your core stat for spellcasting. CON keeps your concentration spells active under fire." },
};

// ── Modifier calculator ───────────────────────────────────────────────────────
function modifier(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Method selector ───────────────────────────────────────────────────────────
const METHODS: { id: AbilityScoreMethod; label: string; description: string; emoji: string }[] = [
  {
    id: "standard_array",
    label: "Standard Array",
    emoji: "📋",
    description: "Assign a fixed set of scores (15, 14, 13, 12, 10, 8) to your abilities. Simple and balanced — great for beginners.",
  },
  {
    id: "point_buy",
    label: "Point Buy",
    emoji: "🧮",
    description: "Spend 27 points to build your scores. More strategic control — every character starts fair.",
  },
  {
    id: "roll",
    label: "Roll for Stats",
    emoji: "🎲",
    description: "Roll 4d6 and drop the lowest die for each score. Classic D&D — exciting but unpredictable.",
  },
];

// ── Standard Array ────────────────────────────────────────────────────────────
function StandardArrayPanel({ priority }: {
  priority: { primary: string[]; secondary: string[] } | null;
}) {
  const { state, dispatch } = useWizard();
  const [dragging, setDragging] = useState<number | null>(null);

  const defaultAssignments = () => {
    const init: Record<string, number | null> = {};
    ABILITY_NAMES.forEach((a) => { init[a.key] = null; });
    return init;
  };
  const assignments = state.standardAssignments ?? defaultAssignments();

  const usedValues      = Object.values(assignments).filter(Boolean) as number[];
  const availableValues = STANDARD_ARRAY.filter((v) => !usedValues.includes(v));

  function assignValue(abilityKey: string, value: number | null) {
    const newAssignments = { ...assignments };
    if (value !== null) {
      Object.keys(newAssignments).forEach((k) => {
        if (newAssignments[k] === value) newAssignments[k] = null;
      });
    }
    newAssignments[abilityKey] = value;
    dispatch({ type: "SET_STANDARD_ASSIGNMENTS", payload: { assignments: newAssignments } });

    const allAssigned = Object.values(newAssignments).every((v) => v !== null);
    if (allAssigned) {
      const scores: AbilityScores = {
        strength:     newAssignments["strength"]!,
        dexterity:    newAssignments["dexterity"]!,
        constitution: newAssignments["constitution"]!,
        intelligence: newAssignments["intelligence"]!,
        wisdom:       newAssignments["wisdom"]!,
        charisma:     newAssignments["charisma"]!,
      };
      dispatch({ type: "SET_ABILITY_SCORES", payload: scores });
    }
  }

  const allAssigned = Object.values(assignments).every((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5">
        <p className="font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
          Available Scores — click a score below to assign it
        </p>
        <div className="flex gap-2 flex-wrap">
          {STANDARD_ARRAY.map((val) => {
            const isUsed = usedValues.includes(val) && !availableValues.includes(val);
            return (
              <div
                key={val}
                draggable
                onDragStart={() => setDragging(val)}
                onDragEnd={() => setDragging(null)}
                className={`w-12 h-12 rounded-sketch border-2 flex items-center justify-center font-mono font-bold text-lg transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                  isUsed
                    ? "bg-parchment border-sketch text-ink-faded opacity-40"
                    : "bg-blush/10 border-blush text-blush shadow-sketch-accent"
                }`}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ABILITY_NAMES.map((ability) => {
          const assigned = assignments[ability.key];
          return (
            <div
              key={ability.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragging) assignValue(ability.key, dragging); }}
              className={`bg-warm-white border-2 rounded-sketch p-4 flex items-center gap-4 transition-all duration-150 ${
                dragging ? "border-blush/50 bg-blush/5" : "border-sketch"
              }`}
            >
              <select
                value={assigned ?? ""}
                onChange={(e) => assignValue(ability.key, e.target.value ? Number(e.target.value) : null)}
                className="w-16 font-mono text-lg font-bold text-ink bg-parchment border-2 border-sketch rounded-input p-1 outline-none focus:border-blush transition-colors text-center"
              >
                <option value="">—</option>
                {STANDARD_ARRAY.map((v) => (
                  <option
                    key={v}
                    value={v}
                    disabled={usedValues.includes(v) && assignments[ability.key] !== v}
                  >
                    {v}
                  </option>
                ))}
              </select>

              <div className="flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-display text-lg text-ink">{ability.label}</p>
                  <span className="font-mono text-sm text-ink-faded">{ability.abbr}</span>
                  {priority?.primary.includes(ability.label) && (
                    <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-blush border border-blush/30 bg-blush/10 rounded p-0.5">Primary</span>
                  )}
                  {priority?.secondary.includes(ability.label) && (
                    <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-[#D4A853] border border-[#D4A853]/30 bg-[#D4A853]/10 rounded p-0.5">Secondary</span>
                  )}
                  {assigned && (
                    <span className="font-mono text-sm text-sage ml-auto">
                      {modifier(assigned)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-ink-faded leading-tight mt-0.5">
                  {ability.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {allAssigned && (
        <div className="bg-sage/10 border border-sage/30 rounded-sketch p-4 text-center">
          <p className="font-display text-sm text-sage">✦ All scores assigned! Click Next to continue.</p>
        </div>
      )}
    </div>
  );
}

// ── Point Buy ─────────────────────────────────────────────────────────────────
function PointBuyPanel({ priority }: {
  priority: { primary: string[]; secondary: string[] } | null;
}) {
  const { state, dispatch } = useWizard();
  const [scores, setScores] = useState<AbilityScores>({
    strength: 8, dexterity: 8, constitution: 8,
    intelligence: 8, wisdom: 8, charisma: 8,
  });

  const spent = Object.values(scores).reduce(
    (acc, val) => acc + (POINT_BUY_COSTS[val] ?? 0), 0
  );
  const remaining = POINT_BUY_BUDGET - spent;

  function adjust(key: keyof AbilityScores, delta: number) {
    const current  = scores[key];
    const next     = current + delta;
    if (next < 8 || next > 15) return;
    const nextCost = POINT_BUY_COSTS[next] ?? 0;
    const currCost = POINT_BUY_COSTS[current] ?? 0;
    if (delta > 0 && remaining < (nextCost - currCost)) return;
    const newScores = { ...scores, [key]: next };
    setScores(newScores);
    dispatch({ type: "SET_ABILITY_SCORES", payload: newScores });
  }

  return (
    <div className="space-y-4">
      <div className="bg-parchment border-2 border-sketch rounded-sketch p-4 space-y-2">
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">How Point Buy Works</p>
        <p className="font-sans text-xs text-ink-soft leading-relaxed">
          Every ability starts at 8. You have <strong className="text-ink">27 points</strong> to spend raising them up to 15.
          Scores cost more points the higher they go — 8 to 13 costs 1 point each, 14 costs 2 more, and 15 costs 2 more again.
        </p>
        <div className="grid grid-cols-8 gap-1 p-1">
          {([8,9,10,11,12,13,14,15] as const).map((score) => {
            const stepCost: Record<number, string> = {8:"free",9:"+1",10:"+1",11:"+1",12:"+1",13:"+1",14:"+2",15:"+2"};
            return (
              <div key={score} className="text-center bg-warm-white border border-sketch rounded p-1">
                <p className="font-mono text-xs font-bold text-ink">{score}</p>
                <p className="font-sans text-[0.55rem] text-ink-faded">{stepCost[score]}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-ink-faded">Points Remaining</p>
            <p className={`font-mono font-bold text-lg ${remaining === 0 ? "text-sage" : remaining < 5 ? "text-[#D4A853]" : "text-ink"}`}>
              {remaining} / {POINT_BUY_BUDGET}
            </p>
          </div>
          <div className="h-2 bg-parchment border border-sketch rounded-full overflow-hidden">
            <div
              className="h-full bg-blush rounded-full transition-all duration-300"
              style={{ width: `${(spent / POINT_BUY_BUDGET) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ABILITY_NAMES.map((ability) => {
          const score   = scores[ability.key as keyof AbilityScores];
          const canUp   = score < 15 && remaining >= (POINT_BUY_COSTS[score + 1] ?? 0) - (POINT_BUY_COSTS[score] ?? 0);
          const canDown = score > 8;

          return (
            <div key={ability.key} className="bg-warm-white border-2 border-sketch rounded-sketch p-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjust(ability.key as keyof AbilityScores, -1)}
                  disabled={!canDown}
                  className="w-7 h-7 rounded-input border-2 border-sketch bg-parchment text-ink font-bold text-sm flex items-center justify-center disabled:opacity-30 hover:border-blush transition-colors"
                >−</button>
                <div className="w-10 text-center">
                  <p className="font-mono font-bold text-xl text-ink">{score}</p>
                  <p className="font-mono text-xs text-sage">{modifier(score)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => adjust(ability.key as keyof AbilityScores, 1)}
                  disabled={!canUp}
                  className="w-7 h-7 rounded-input border-2 border-sketch bg-parchment text-ink font-bold text-sm flex items-center justify-center disabled:opacity-30 hover:border-blush transition-colors"
                >+</button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <p className="font-display text-base text-ink">{ability.label}</p>
                  <span className="font-mono text-xs text-ink-faded">{ability.abbr}</span>
                  <span className="font-sans text-[0.6rem] text-ink-faded ml-auto shrink-0">
                    Cost: {POINT_BUY_COSTS[score]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {priority?.primary.includes(ability.label) && (
                    <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-blush border border-blush/30 bg-blush/10 rounded p-0.5">Primary</span>
                  )}
                  {priority?.secondary.includes(ability.label) && (
                    <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-[#D4A853] border border-[#D4A853]/30 bg-[#D4A853]/10 rounded p-0.5">Secondary</span>
                  )}
                  <p className="font-sans text-xs text-ink-faded leading-tight">
                    {ability.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Roll for Stats ────────────────────────────────────────────────────────────
function RollPanel({ priority }: {
  priority: { primary: string[]; secondary: string[] } | null;
}) {
  const { state, dispatch } = useWizard();
  const [rolling, setRolling]   = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const rolls  = state.rolledDice ?? [];
  const rolled = rolls.length > 0;

  const defaultAssignments = () => {
    const init: Record<string, number | null> = {};
    ABILITY_NAMES.forEach((a) => { init[a.key] = null; });
    return init;
  };
  const assignments = state.rollAssignments ?? defaultAssignments();

  function rollStat(): number[] {
    const dice = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6));
    return dice.sort((a, b) => b - a);
  }

  function statTotal(dice: number[]) {
    return dice.slice(0, 3).reduce((a, b) => a + b, 0);
  }

  async function handleRoll() {
    setRolling(true);
    await new Promise((r) => setTimeout(r, 600));
    const newRolls = Array.from({ length: 6 }, rollStat);
    dispatch({ type: "SET_ROLLED_DICE", payload: { dice: newRolls } });
    setRolling(false);
    const emptyAssignments: Record<string, number | null> = {};
    ABILITY_NAMES.forEach((a) => { emptyAssignments[a.key] = null; });
    dispatch({ type: "SET_ROLL_ASSIGNMENTS", payload: { assignments: emptyAssignments } });
    dispatch({ type: "SET_ABILITY_SCORES", payload: {
      strength: 8, dexterity: 8, constitution: 8,
      intelligence: 8, wisdom: 8, charisma: 8,
    }});
  }

  function assignRoll(abilityKey: string, rollIndex: number | null) {
    const newAssignments = { ...assignments };
    if (rollIndex !== null) {
      Object.keys(newAssignments).forEach((k) => {
        if (newAssignments[k] === rollIndex) newAssignments[k] = null;
      });
    }
    newAssignments[abilityKey] = rollIndex;
    dispatch({ type: "SET_ROLL_ASSIGNMENTS", payload: { assignments: newAssignments } });

    const allAssigned = Object.values(newAssignments).every((v) => v !== null);
    if (allAssigned) {
      const scores: AbilityScores = {
        strength:     statTotal(rolls[newAssignments["strength"]!]),
        dexterity:    statTotal(rolls[newAssignments["dexterity"]!]),
        constitution: statTotal(rolls[newAssignments["constitution"]!]),
        intelligence: statTotal(rolls[newAssignments["intelligence"]!]),
        wisdom:       statTotal(rolls[newAssignments["wisdom"]!]),
        charisma:     statTotal(rolls[newAssignments["charisma"]!]),
      };
      dispatch({ type: "SET_ABILITY_SCORES", payload: scores });
    }
  }

  const usedRollIndices = Object.values(assignments).filter((v) => v !== null) as number[];
  const allAssigned     = rolled && Object.values(assignments).every((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 text-center">
        <p className="font-sans text-sm text-ink-soft mb-4">
          Roll 4d6 and drop the lowest die for each ability score.
          This gives scores between 3 and 18.
        </p>
        <button
          type="button"
          onClick={handleRoll}
          disabled={rolling}
          className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-8 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
        >
          {rolling ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Rolling...
            </>
          ) : rolled ? "🎲 Reroll All" : "🎲 Roll My Stats"}
        </button>
      </div>

      {rolled && rolls.length > 0 && (
        <div className="space-y-5">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5">
            <p className="font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
              Your Rolls — drag or use the dropdown to assign
            </p>
            <div className="flex flex-wrap gap-2">
              {rolls.map((dice, i) => {
                const total  = statTotal(dice);
                const isUsed = usedRollIndices.includes(i);
                return (
                  <div
                    key={i}
                    draggable={!isUsed}
                    onDragStart={() => !isUsed && setDragging(i)}
                    onDragEnd={() => setDragging(null)}
                    className={`relative rounded-sketch border-2 p-3 text-center transition-all duration-150 select-none ${
                      isUsed
                        ? "bg-parchment border-sketch opacity-40 cursor-not-allowed"
                        : "bg-blush/10 border-blush shadow-sketch-accent cursor-grab active:cursor-grabbing hover:-translate-y-px"
                    }`}
                  >
                    <p className="font-mono font-bold text-xl text-ink leading-none">{total}</p>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {dice.map((d, di) => (
                        <span
                          key={di}
                          className={`font-mono text-[0.55rem] ${
                            di === 3 ? "text-blush line-through opacity-60" : "text-ink-faded"
                          }`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ABILITY_NAMES.map((ability) => {
              const assignedIndex = assignments[ability.key];
              const assignedScore = assignedIndex !== null ? statTotal(rolls[assignedIndex]) : null;
              const isDragTarget  = dragging !== null;

              return (
                <div
                  key={ability.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragging !== null) {
                      assignRoll(ability.key, dragging);
                      setDragging(null);
                    }
                  }}
                  className={`bg-warm-white border-2 rounded-sketch p-4 flex items-center gap-3 transition-all duration-150 ${
                    isDragTarget ? "border-blush/50 bg-blush/5"
                    : assignedIndex !== null ? "border-sage/50"
                    : "border-sketch"
                  }`}
                >
                  <div className="relative">
                    <select
                      value={assignedIndex !== null ? assignedIndex : ""}
                      onChange={(e) => assignRoll(ability.key, e.target.value !== "" ? Number(e.target.value) : null)}
                      className="w-14 font-mono text-lg font-bold text-ink bg-parchment border-2 border-sketch rounded-input p-1 outline-none focus:border-blush transition-colors text-center appearance-none cursor-pointer"
                    >
                      <option value="">—</option>
                      {rolls.map((dice, i) => {
                        const isUsedElsewhere = usedRollIndices.includes(i) && assignments[ability.key] !== i;
                        if (isUsedElsewhere) return null;
                        return (
                          <option key={i} value={i}>
                            {statTotal(dice)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <p className="font-display text-base text-ink">{ability.label}</p>
                      <span className="font-mono text-xs text-ink-faded">{ability.abbr}</span>
                      {priority?.primary.includes(ability.label) && (
                        <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-blush border border-blush/30 bg-blush/10 rounded p-0.5">Primary</span>
                      )}
                      {priority?.secondary.includes(ability.label) && (
                        <span className="font-sans text-[0.55rem] font-bold uppercase tracking-wider text-[#D4A853] border border-[#D4A853]/30 bg-[#D4A853]/10 rounded p-0.5">Secondary</span>
                      )}
                      {assignedScore !== null && (
                        <span className={`font-mono text-sm ml-auto ${parseInt(modifier(assignedScore)) >= 0 ? "text-sage" : "text-blush"}`}>
                          {modifier(assignedScore)}
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-ink-faded leading-tight mt-0.5 truncate">
                      {ability.description}
                    </p>
                  </div>

                  {isDragTarget && assignedIndex === null && (
                    <div className="w-8 h-8 rounded-sketch border-2 border-dashed border-blush/50 flex items-center justify-center shrink-0">
                      <span className="text-blush text-xs">↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allAssigned && (
            <div className="bg-sage/10 border border-sage/30 rounded-sketch p-4 text-center">
              <p className="font-display text-sm text-sage">✦ All scores assigned! Click Next to continue.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main step ─────────────────────────────────────────────────────────────────
export function AbilityScoreStep({ classIndex = "", className = "" }: {
  classIndex?: string; className?: string;
}) {
  const { state, dispatch } = useWizard();
  const method   = state.abilityScoreMethod;
  const priority = CLASS_STAT_PRIORITY[classIndex] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Ability Scores</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your six ability scores define your character's raw capabilities. Choose how you want to generate them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: method selector + active panel ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => dispatch({ type: "SET_ABILITY_METHOD", payload: { method: m.id } })}
                className={`p-4 rounded-sketch border-2 text-left transition-all duration-150 ${
                  method === m.id
                    ? "bg-blush/10 border-blush shadow-sketch-accent"
                    : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                }`}
              >
                <div className="text-2xl mb-2">{m.emoji}</div>
                <p className={`font-display text-base leading-tight ${method === m.id ? "text-blush" : "text-ink"}`}>
                  {m.label}
                </p>
                <p className="font-sans text-xs text-ink-faded mt-1 leading-snug">
                  {m.description}
                </p>
              </button>
            ))}
          </div>

          {method === "standard_array" && <StandardArrayPanel priority={priority} />}
          {method === "point_buy"      && <PointBuyPanel priority={priority} />}
          {method === "roll"           && <RollPanel priority={priority} />}
        </div>

        {/* ── Right: help panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎲</span>
              <h2 className="font-display text-xl text-ink">About Ability Scores</h2>
            </div>
            <div className="space-y-3 font-sans text-sm text-ink-soft leading-relaxed">

              {priority && className && (
                <div className="bg-blush/5 border border-blush/20 rounded-sketch p-3 space-y-2">
                  <p className="font-sans text-xs text-ink-faded">
                    You've chosen: <span className="font-bold text-ink">{className}</span>
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-blush shrink-0 mt-0.5">✦</span>
                      <p className="font-sans text-xs text-ink-soft">
                        <strong className="text-ink">Primary:</strong> {priority.primary.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#D4A853] shrink-0 mt-0.5">✦</span>
                      <p className="font-sans text-xs text-ink-soft">
                        <strong className="text-ink">Secondary:</strong> {priority.secondary.join(", ")}
                      </p>
                    </div>
                    <p className="font-sans text-xs text-ink-faded leading-relaxed border-t border-sketch/50 p-2">
                      {priority.notes}
                    </p>
                  </div>
                </div>
              )}

              <p>
                Each score ranges from 3 to 20 for most characters. The higher the score,
                the better your modifier — which is what actually gets added to your dice rolls.
              </p>

              <div className="border border-sketch rounded-input overflow-hidden">
                <div className="grid grid-cols-2 bg-parchment">
                  <div className="font-sans text-[0.6rem] font-bold uppercase tracking-wider text-ink-faded p-3 border-b border-sketch">Score</div>
                  <div className="font-sans text-[0.6rem] font-bold uppercase tracking-wider text-ink-faded p-3 border-b border-sketch">Modifier</div>
                </div>
                {[
                  [8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 18]
                ].map(([lo, hi]) => (
                  <div key={lo} className="grid grid-cols-2 border-b border-sketch last:border-0">
                    <div className="font-mono text-xs text-ink p-3">{lo === hi ? lo : `${lo}–${hi}`}</div>
                    <div className={`font-mono text-xs p-3 ${Math.floor((lo - 10) / 2) >= 0 ? "text-sage" : "text-blush"}`}>
                      {modifier(lo)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-sketch p-3 space-y-1.5">
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span><strong className="text-ink">Not sure?</strong> Use Standard Array — it's balanced and fast</p>
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span><strong className="text-ink">Want control?</strong> Point Buy lets you plan your stats precisely</p>
                <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span><strong className="text-ink">Feeling lucky?</strong> Rolling is exciting but results vary wildly</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}