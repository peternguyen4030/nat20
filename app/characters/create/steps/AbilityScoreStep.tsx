"use client";

import { useState, type ReactNode } from "react";
import { useWizard } from "@/context/WizardContext";
import {
  WizardDetailPanel,
  WizardHintPanel,
  WizardHintColumn,
  WizardMainColumn,
  WizardSideColumn,
  WizardStepBody,
  WizardStepHeader,
  WizardThreeColumnGrid,
} from "../wizard-layout";
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

type AbilityNameEntry = (typeof ABILITY_NAMES)[number];
type StatPriority = { primary: string[]; secondary: string[] } | null;

/** Line 1: name + abbreviation together, optional modifier (Standard / Roll). Line 2: Primary / Secondary. */
function AbilityCardHeading({
  ability,
  priority,
  trailing,
}: {
  ability: AbilityNameEntry;
  priority: StatPriority;
  trailing: ReactNode;
}) {
  const showPrimary   = priority?.primary.includes(ability.label) ?? false;
  const showSecondary = priority?.secondary.includes(ability.label) ?? false;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <p className="font-display text-lg leading-snug text-ink">{ability.label}</p>
          <span className="shrink-0 font-mono text-sm text-ink-faded">{ability.abbr}</span>
        </div>
        {trailing != null && trailing !== false && (
          <div className="shrink-0 text-right">{trailing}</div>
        )}
      </div>
      {(showPrimary || showSecondary) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {showPrimary && (
            <span className="rounded border border-blush/30 bg-blush/10 p-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wider text-blush">
              Primary
            </span>
          )}
          {showSecondary && (
            <span className="rounded border border-[#D4A853]/30 bg-[#D4A853]/10 p-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wider text-[#D4A853]">
              Secondary
            </span>
          )}
        </div>
      )}
    </div>
  );
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ABILITY_NAMES.map((ability) => {
          const assigned = assignments[ability.key];
          return (
            <div
              key={ability.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragging) assignValue(ability.key, dragging); }}
              className={`flex items-center gap-4 rounded-sketch border-2 bg-warm-white p-4 transition-all duration-150 ${
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

              <div className="min-w-0 flex-1 space-y-1.5">
                <AbilityCardHeading
                  ability={ability}
                  priority={priority}
                  trailing={
                    assigned ? (
                      <span className="font-mono text-sm tabular-nums text-sage">{modifier(assigned)}</span>
                    ) : null
                  }
                />
                <p className="wrap-break-word font-sans text-xs leading-snug text-ink-faded">
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
  const { dispatch } = useWizard();
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ABILITY_NAMES.map((ability) => {
          const score   = scores[ability.key as keyof AbilityScores];
          const canUp   = score < 15 && remaining >= (POINT_BUY_COSTS[score + 1] ?? 0) - (POINT_BUY_COSTS[score] ?? 0);
          const canDown = score > 8;

          return (
            <div
              key={ability.key}
              className="flex items-start gap-4 rounded-sketch border-2 border-sketch bg-warm-white p-4 transition-all duration-150"
            >
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="min-w-14 rounded-input border-2 border-sketch bg-parchment px-2 py-2 text-center">
                  <p className="font-mono text-lg font-bold leading-none text-ink">{score}</p>
                  <p className="font-mono text-xs leading-tight text-sage">{modifier(score)}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjust(ability.key as keyof AbilityScores, -1)}
                    disabled={!canDown}
                    className="flex h-8 w-8 items-center justify-center rounded-input border-2 border-sketch bg-parchment text-sm font-bold text-ink transition-colors hover:border-blush disabled:opacity-30"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => adjust(ability.key as keyof AbilityScores, 1)}
                    disabled={!canUp}
                    className="flex h-8 w-8 items-center justify-center rounded-input border-2 border-sketch bg-parchment text-sm font-bold text-ink transition-colors hover:border-blush disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <p className="text-center font-sans text-[0.6rem] tabular-nums leading-tight text-ink-faded">
                  Cost: {POINT_BUY_COSTS[score]}
                </p>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <AbilityCardHeading ability={ability} priority={priority} trailing={null} />
                <p className="wrap-break-word font-sans text-xs leading-snug text-ink-faded">{ability.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      {remaining === 0 && (
        <div className="bg-sage/10 border border-sage/30 rounded-sketch p-4 text-center">
          <p className="font-display text-sm text-sage">✦ All 27 points spent! Click Next to continue.</p>
        </div>
      )}
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
          className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-3 hover:-translate-x-px hover:-translate-y-px transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
        <div className="space-y-4">
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  className={`flex items-center gap-4 rounded-sketch border-2 bg-warm-white p-4 transition-all duration-150 ${
                    isDragTarget ? "border-blush/50 bg-blush/5"
                    : assignedIndex !== null ? "border-sage/50"
                    : "border-sketch"
                  }`}
                >
                  <div className="relative shrink-0">
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

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <AbilityCardHeading
                      ability={ability}
                      priority={priority}
                      trailing={
                        assignedScore !== null ? (
                          <span
                            className={`font-mono text-sm tabular-nums ${
                              parseInt(modifier(assignedScore), 10) >= 0 ? "text-sage" : "text-blush"
                            }`}
                          >
                            {modifier(assignedScore)}
                          </span>
                        ) : null
                      }
                    />
                    <p className="wrap-break-word font-sans text-xs leading-snug text-ink-faded">
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
  const [activeInfoTab, setActiveInfoTab] = useState<"modifiers" | "tips" | "basics">("basics");
  const [activeMethodTab, setActiveMethodTab] = useState<AbilityScoreMethod>("standard_array");
  const selectedMethodTab = method ?? activeMethodTab;
  const methodTabInfo = METHODS.find((entry) => entry.id === selectedMethodTab) ?? METHODS[0];

  return (
    <WizardStepBody>
      <WizardStepHeader
        title="Ability Scores"
        subtitle="Your six ability scores define your character's raw capabilities. Choose how you want to generate them."
      />

      <WizardThreeColumnGrid>

        <WizardHintColumn>
          <div className="space-y-3">
            <WizardHintPanel icon="📚" title="Method guide" density="compact" sticky={false}>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 border-b border-sketch/60 pb-2">
                  {METHODS.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setActiveMethodTab(entry.id)}
                      className={`rounded-input border px-2 py-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wide transition-colors ${
                        selectedMethodTab === entry.id
                          ? "border-blush bg-blush/10 text-blush"
                          : "border-sketch bg-parchment text-ink-faded hover:border-blush/40 hover:text-ink"
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-input border border-sketch bg-parchment p-2.5">
                  <p className="mb-1 font-display text-xs text-ink">
                    <span className="mr-1.5">{methodTabInfo.emoji}</span>
                    {methodTabInfo.label}
                  </p>
                  <p className="font-sans text-[0.7rem] leading-snug text-ink-soft">
                    {methodTabInfo.description}
                  </p>
                </div>
              </div>
            </WizardHintPanel>

            <WizardHintPanel icon="🧭" title="Class stat guide" density="compact" sticky={false}>
              {priority && className ? (
                <div className="space-y-2">
                  <p className="font-sans text-xs text-ink-faded">
                    You&apos;ve chosen: <span className="font-bold text-ink">{className}</span>
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-blush">✦</span>
                    <p className="font-sans text-xs text-ink-soft">
                      <strong className="text-ink">Primary:</strong> {priority.primary.join(", ")}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-[#D4A853]">✦</span>
                    <p className="font-sans text-xs text-ink-soft">
                      <strong className="text-ink">Secondary:</strong> {priority.secondary.join(", ")}
                    </p>
                  </div>
                  <p className="pt-1 font-sans text-xs leading-relaxed text-ink-faded">
                    {priority.notes}
                  </p>
                </div>
              ) : (
                <p className="font-sans text-xs leading-relaxed text-ink-soft">
                  Choose your class first to see recommended primary and secondary stats here.
                </p>
              )}
            </WizardHintPanel>
          </div>
        </WizardHintColumn>

        <WizardMainColumn>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMethodTab(m.id);
                    dispatch({ type: "SET_ABILITY_METHOD", payload: { method: m.id } });
                  }}
                  className={`rounded-sketch border-2 p-2.5 text-left transition-all duration-150 ${
                    method === m.id
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "border-sketch bg-warm-white shadow-sketch transition-transform duration-150 hover:-translate-x-px hover:-translate-y-px hover:border-blush/50 hover:bg-paper"
                  }`}
                >
                  <div className="mb-1 text-lg">{m.emoji}</div>
                  <p className={`font-display text-sm leading-tight ${method === m.id ? "text-blush" : "text-ink"}`}>
                    {m.label}
                  </p>
                </button>
              ))}
            </div>

            <div key={method} className="animate-wizard-step">
              {method === "standard_array" && <StandardArrayPanel priority={priority} />}
              {method === "point_buy"      && <PointBuyPanel priority={priority} />}
              {method === "roll"           && <RollPanel priority={priority} />}
            </div>
          </div>
        </WizardMainColumn>

        <WizardSideColumn>
          <WizardDetailPanel icon="🎲" title="Scores & modifiers" sizing="content">
            <div className="space-y-3 font-sans text-sm leading-relaxed text-ink-soft">
              <div className="flex flex-wrap gap-1.5 border-b border-sketch/60 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveInfoTab("basics")}
                  className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                    activeInfoTab === "basics"
                      ? "border-sage bg-sage/10 text-sage"
                      : "border-sketch bg-parchment text-ink-faded hover:border-sage/40 hover:text-ink"
                  }`}
                >
                  Basics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab("modifiers")}
                  className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                    activeInfoTab === "modifiers"
                      ? "border-dusty-blue bg-dusty-blue/10 text-dusty-blue"
                      : "border-sketch bg-parchment text-ink-faded hover:border-dusty-blue/40 hover:text-ink"
                  }`}
                >
                  Modifiers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab("tips")}
                  className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                    activeInfoTab === "tips"
                      ? "border-blush bg-blush/10 text-blush"
                      : "border-sketch bg-parchment text-ink-faded hover:border-blush/40 hover:text-ink"
                  }`}
                >
                  Tips
                </button>
              </div>

              {activeInfoTab === "basics" && (
                <p className="font-sans text-xs leading-relaxed text-ink-soft">
                  Each score usually ranges from 3 to 20. Higher scores grant better modifiers, and those modifiers are what get added to your rolls.
                </p>
              )}

              {activeInfoTab === "modifiers" && (
                <div className="overflow-hidden rounded-input border border-sketch">
                  <div className="grid grid-cols-2 bg-parchment">
                    <div className="border-b border-sketch px-2.5 py-2 font-sans text-[0.55rem] font-bold uppercase tracking-wider text-ink-faded">Score</div>
                    <div className="border-b border-sketch px-2.5 py-2 font-sans text-[0.55rem] font-bold uppercase tracking-wider text-ink-faded">Modifier</div>
                  </div>
                  {[
                    [8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 18]
                  ].map(([lo, hi]) => (
                    <div key={lo} className="grid grid-cols-2 border-b border-sketch last:border-0">
                      <div className="px-2.5 py-2 font-mono text-[0.7rem] text-ink">{lo === hi ? lo : `${lo}–${hi}`}</div>
                      <div className={`px-2.5 py-2 font-mono text-[0.7rem] ${Math.floor((lo - 10) / 2) >= 0 ? "text-sage" : "text-blush"}`}>
                        {modifier(lo)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeInfoTab === "tips" && (
                <div className="space-y-1.5 rounded-input border border-sketch bg-parchment p-3">
                  <p className="font-sans text-xs leading-relaxed text-ink-soft"><span className="mr-1 text-blush">✦</span><strong className="text-ink">Not sure?</strong> Use Standard Array — it&apos;s balanced and fast</p>
                  <p className="font-sans text-xs leading-relaxed text-ink-soft"><span className="mr-1 text-blush">✦</span><strong className="text-ink">Want control?</strong> Point Buy lets you plan your stats precisely</p>
                  <p className="font-sans text-xs leading-relaxed text-ink-soft"><span className="mr-1 text-blush">✦</span><strong className="text-ink">Feeling lucky?</strong> Rolling is exciting but results vary wildly</p>
                </div>
              )}
            </div>
          </WizardDetailPanel>
        </WizardSideColumn>

      </WizardThreeColumnGrid>
    </WizardStepBody>
  );
}