"use client";

import { useWizard } from "@/context/WizardContext";
import {
  SKILLS,
  CLASS_SKILL_OPTIONS,
  SkillDefinition,
  Class,
} from "@/types/character-creation";
import { useState, useEffect } from "react";

const ABILITY_COLOR: Record<string, string> = {
  STR: "text-blush border-blush/30 bg-blush/10",
  DEX: "text-sage border-sage/30 bg-sage/10",
  CON: "text-[#D4A853] border-[#D4A853]/30 bg-[#D4A853]/10",
  INT: "text-dusty-blue border-dusty-blue/30 bg-dusty-blue/10",
  WIS: "text-sage border-sage/30 bg-sage/10",
  CHA: "text-blush border-blush/30 bg-blush/10",
};

const ABILITY_SCORE_KEY: Record<string, string> = {
  STR: "strength", DEX: "dexterity", CON: "constitution",
  INT: "intelligence", WIS: "wisdom", CHA: "charisma",
};

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function SkillsStep() {
  const { state, dispatch } = useWizard();
  const [hoveredSkill, setHoveredSkill] = useState<SkillDefinition | null>(null);
  const [classes, setClasses]           = useState<Class[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => { setClasses(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const selectedClass = classes.find((c) => c.id === state.classId);
  const classIndex    = selectedClass?.index ?? "";
  const options       = CLASS_SKILL_OPTIONS[classIndex];
  const availableKeys = options?.skills ?? [];
  const pickCount     = options?.count ?? 2;
  const selected      = state.selectedSkills;
  const remaining     = pickCount - selected.length;

  // Background grants fixed skills — show them as locked
  const bgSkills: string[] = []; // populated post-MVP from background data

  function toggleSkill(key: string) {
    if (bgSkills.includes(key)) return; // can't toggle background skills
    if (selected.includes(key)) {
      dispatch({ type: "SET_SKILLS", payload: { skills: selected.filter((s) => s !== key) } });
    } else {
      if (remaining <= 0) return;
      dispatch({ type: "SET_SKILLS", payload: { skills: [...selected, key] } });
    }
  }

  const displaySkill = hoveredSkill ?? SKILLS.find((s) => selected.includes(s.key)) ?? SKILLS[0];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-warm-white border-2 border-sketch rounded-sketch animate-pulse" />
        ))}
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="bg-warm-white border-2 border-sketch rounded-sketch p-8 text-center">
        <p className="font-display text-lg text-ink-faded">Go back and select a class first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Skills</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your class lets you pick <strong className="text-ink">{pickCount} skills</strong> to be proficient in.
          Proficiency adds your proficiency bonus (+2 at level 1) to those skill checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: skill grid ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pick counter */}
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: pickCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-input border-2 flex items-center justify-center text-sm transition-all duration-150 ${
                    i < selected.length
                      ? "bg-blush border-blush text-white"
                      : "bg-parchment border-sketch text-ink-faded"
                  }`}
                >
                  {i < selected.length ? "✓" : "○"}
                </div>
              ))}
              <span className="font-sans text-sm text-ink-soft ml-2">
                {remaining > 0
                  ? `${remaining} more to pick`
                  : "All skills chosen ✦"}
              </span>
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_SKILLS", payload: { skills: [] } })}
                className="font-sans text-xs text-ink-faded hover:text-blush transition-colors underline decoration-dotted underline-offset-2"
              >
                Reset
              </button>
            )}
          </div>

          {/* Skill grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SKILLS.map((skill) => {
              const isAvailable = availableKeys.includes(skill.key);
              const isSelected  = selected.includes(skill.key);
              const isLocked    = bgSkills.includes(skill.key);
              const isDisabled  = !isAvailable && !isSelected && !isLocked;

              return (
                <button
                  key={skill.key}
                  type="button"
                  disabled={isDisabled || (remaining <= 0 && !isSelected && !isLocked)}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  onClick={() => toggleSkill(skill.key)}
                  className={`p-3 rounded-sketch border-2 text-left transition-all duration-150 relative ${
                    isLocked
                      ? "bg-sage/10 border-sage/40 cursor-default"
                      : isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                      : isDisabled
                      ? "bg-parchment border-sketch/40 opacity-35 cursor-not-allowed"
                      : remaining <= 0
                      ? "bg-warm-white border-sketch opacity-40 cursor-not-allowed"
                      : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className={`font-sans text-sm font-semibold leading-tight ${
                      isSelected ? "text-blush" : isLocked ? "text-sage" : isDisabled ? "text-ink-faded" : "text-ink"
                    }`}>
                      {skill.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const scoreKey = ABILITY_SCORE_KEY[skill.ability] as keyof typeof state.abilityScores;
                        const score    = state.abilityScores[scoreKey];
                        const mod      = modifier(score);
                        return (
                          <span className={`font-mono text-[0.6rem] font-bold ${mod.startsWith("+") ? "text-sage" : "text-blush"}`}>
                            {mod}
                          </span>
                        );
                      })()}
                      <span className={`font-mono text-[0.6rem] font-bold p-1.5 rounded border ${ABILITY_COLOR[skill.ability]}`}>
                        {skill.ability}
                      </span>
                    </div>
                  </div>
                  {isLocked && (
                    <p className="font-sans text-[0.6rem] text-sage mt-0.5">From background</p>
                  )}
                  {isSelected && !isLocked && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blush rounded-full flex items-center justify-center">
                      <span className="text-white text-[0.6rem]">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: explanation panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6 space-y-4 transition-all duration-200">

            {displaySkill ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-2xl text-ink">{displaySkill.name}</h2>
                  <span className={`font-mono text-xs font-bold p-2 rounded border ${ABILITY_COLOR[displaySkill.ability]}`}>
                    {displaySkill.ability}
                  </span>
                </div>
                <p className="font-sans text-sm text-ink-soft leading-relaxed">
                  {displaySkill.description}
                </p>
                <div className="border-t border-sketch p-3">
                  {(() => {
                    const scoreKey = ABILITY_SCORE_KEY[displaySkill.ability] as keyof typeof state.abilityScores;
                    const score    = state.abilityScores[scoreKey];
                    const mod      = modifier(score);
                    const total    = (parseInt(mod) + 2).toString();
                    return (
                      <p className="font-sans text-xs text-ink-faded">
                        Your <strong className="text-ink">{displaySkill.ability}</strong> modifier is{" "}
                        <strong className={parseInt(mod) >= 0 ? "text-sage" : "text-blush"}>{mod}</strong>.
                        With proficiency (+2) your total bonus is{" "}
                        <strong className="text-ink">{parseInt(total) >= 0 ? `+${total}` : total}</strong>.
                      </p>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h2 className="font-display text-xl text-ink">About Skills</h2>
                </div>
                <p className="font-sans text-sm text-ink-soft leading-relaxed">
                  Skills represent specific areas your character has trained in.
                  When you attempt something risky, the DM may call for a skill check —
                  roll a d20 and add your relevant ability modifier, plus your
                  proficiency bonus if you're proficient.
                </p>
                <div className="border-t border-sketch p-3 space-y-1.5 text-xs font-sans text-ink-soft">
                  <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span>Greyed out skills aren't available to your class</p>
                  <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-sage mr-1">✦</span>Green skills are granted by your background</p>
                  <p className="font-sans text-xs text-ink-soft leading-relaxed"><span className="text-blush mr-1">✦</span>Hover a skill to read what it does</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}