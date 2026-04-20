"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Class } from "@/types/character-creation";
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

const CLASS_EMOJI: Record<string, string> = {
  barbarian: "🪓", bard: "🎵", cleric: "✝️", druid: "🌙",
  fighter: "🛡️", monk: "👊", paladin: "⚖️", ranger: "🏹",
  rogue: "🗡️", sorcerer: "✨", warlock: "👁️", wizard: "📚",
};

const CLASS_ROLE: Record<string, string> = {
  barbarian: "Melee Damage",     bard: "Support & Versatile",
  cleric:    "Healer & Support", druid: "Nature & Utility",
  fighter:   "Melee & Ranged",   monk: "Melee & Mobility",
  paladin:   "Melee & Healer",   ranger: "Ranged & Explorer",
  rogue:     "Stealth & Damage", sorcerer: "Arcane Damage",
  warlock:   "Eldritch Damage",  wizard: "Arcane Versatile",
};

const CLASS_DIFFICULTY: Record<string, { label: string; color: string }> = {
  barbarian: { label: "Beginner",     color: "text-sage" },
  bard:      { label: "Intermediate", color: "text-[#D4A853]" },
  cleric:    { label: "Beginner",     color: "text-sage" },
  druid:     { label: "Intermediate", color: "text-[#D4A853]" },
  fighter:   { label: "Beginner",     color: "text-sage" },
  monk:      { label: "Intermediate", color: "text-[#D4A853]" },
  paladin:   { label: "Beginner",     color: "text-sage" },
  ranger:    { label: "Intermediate", color: "text-[#D4A853]" },
  rogue:     { label: "Beginner",     color: "text-sage" },
  sorcerer:  { label: "Intermediate", color: "text-[#D4A853]" },
  warlock:   { label: "Intermediate", color: "text-[#D4A853]" },
  wizard:    { label: "Advanced",     color: "text-blush" },
};

export function ClassStep() {
  const { state, dispatch } = useWizard();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [hovered, setHovered] = useState<Class | null>(null);

  const selectedClass = classes.find((c) => c.id === state.classId) ?? null;
  const displayClass  = hovered ?? selectedClass;

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => { setClasses(data); setLoading(false); })
      .catch(() => { setError("Failed to load classes"); setLoading(false); });
  }, []);

  if (loading) return <LoadingGrid count={12} />;
  if (error)   return <ErrorState message={error} />;

  return (
    <WizardStepBody>
      <WizardStepHeader
        title="Choose your Class"
        subtitle="Your class is your character's calling — it defines their abilities, fighting style, and role in the party."
      />

      <WizardThreeColumnGrid>

        <WizardHintColumn>
          <WizardHintPanel icon="⚔️" title="About Classes">
            <p>Your class shapes everything about how you play — what weapons you use, whether you cast spells, and what role you fill in the party.</p>
            <div className="border-t border-sketch">
              <div className="space-y-1.5 p-3">
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Hit Die</strong> determines your HP each level</p>
                <p><span className="text-sage mr-1">✦</span><strong className="text-sage">Beginner</strong> classes are simpler to learn</p>
                <p><span className="text-[#D4A853] mr-1">✦</span><strong className="text-[#D4A853]">Intermediate</strong> classes have more complexity</p>
                <p><span className="text-blush mr-1">✦</span><strong className="text-blush">Advanced</strong> classes reward careful planning</p>
              </div>
            </div>
          </WizardHintPanel>
        </WizardHintColumn>

        <WizardMainColumn>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {classes.map((cls) => {
              const isSelected = state.classId === cls.id;
              const emoji      = CLASS_EMOJI[cls.index] ?? "⚔️";
              const difficulty = CLASS_DIFFICULTY[cls.index];
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => dispatch({ type: "SET_CLASS", payload: { classId: cls.id } })}
                  onMouseEnter={() => setHovered(cls)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative flex flex-col gap-1 rounded-sketch border-2 p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "border-sketch bg-warm-white shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                  }`}
                >
                  <div className="text-2xl">{emoji}</div>
                  <p className={`font-display text-lg leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>{cls.name}</p>
                  <p className="font-sans text-[0.65rem] text-ink-faded">{CLASS_ROLE[cls.index]}</p>
                  {difficulty && (
                    <p className={`font-sans text-[0.6rem] font-semibold ${difficulty.color}`}>{difficulty.label}</p>
                  )}
                  <p className="font-mono text-[0.6rem] text-ink-faded">d{cls.hitDie} HP</p>
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blush">
                      <span className="text-xs text-white">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </WizardMainColumn>

        <WizardSideColumn>
          <WizardDetailPanel icon="⚔️" title="Class preview" sizing="content">
            {displayClass ? (
              <div className="space-y-4 transition-opacity duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{CLASS_EMOJI[displayClass.index] ?? "⚔️"}</span>
                  <div>
                    <h2 className="font-display text-2xl text-ink">{displayClass.name}</h2>
                    <p className={`font-sans text-xs font-semibold ${CLASS_DIFFICULTY[displayClass.index]?.color ?? "text-ink-faded"}`}>
                      {CLASS_DIFFICULTY[displayClass.index]?.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-input border border-sketch bg-parchment p-3 text-center">
                    <p className="font-mono text-lg font-bold text-ink">d{displayClass.hitDie}</p>
                    <p className="font-sans text-[0.6rem] uppercase tracking-wider text-ink-faded">Hit Die</p>
                  </div>
                  <div className="rounded-input border border-sketch bg-parchment p-3 text-center">
                    <p className="font-mono text-lg font-bold text-ink">{displayClass.spellcastingAbility ?? "—"}</p>
                    <p className="font-sans text-[0.6rem] uppercase tracking-wider text-ink-faded">Spellcasting</p>
                  </div>
                </div>

                {displayClass.features.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Level 1 Features</p>
                    <ul className="space-y-2">
                      {displayClass.features.slice(0, 4).map((f) => (
                        <li key={f.id} className="rounded-input border border-sketch bg-parchment p-3">
                          <p className="font-sans text-xs font-bold text-ink">{f.name}</p>
                          <p className="font-sans text-xs text-ink-faded line-clamp-2">{f.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <p className="font-sans text-sm italic text-ink-faded">Hover or select a class to see its details.</p>
              </div>
            )}
          </WizardDetailPanel>
        </WizardSideColumn>

      </WizardThreeColumnGrid>
    </WizardStepBody>
  );
}

function LoadingGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 bg-warm-white border-2 border-sketch rounded-sketch animate-pulse" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-blush/10 border border-blush/30 rounded-sketch p-6 text-center">
      <p className="font-display text-lg text-blush">✗ {message}</p>
      <p className="font-sans text-sm text-ink-faded mt-1">Try refreshing the page.</p>
    </div>
  );
}