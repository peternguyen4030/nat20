"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Class } from "@/types/character-creation";

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
  bard:      { label: "Intermediate", color: "text-gold" },
  cleric:    { label: "Beginner",     color: "text-sage" },
  druid:     { label: "Intermediate", color: "text-gold" },
  fighter:   { label: "Beginner",     color: "text-sage" },
  monk:      { label: "Intermediate", color: "text-gold" },
  paladin:   { label: "Beginner",     color: "text-sage" },
  ranger:    { label: "Intermediate", color: "text-gold" },
  rogue:     { label: "Beginner",     color: "text-sage" },
  sorcerer:  { label: "Intermediate", color: "text-gold" },
  warlock:   { label: "Intermediate", color: "text-gold" },
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Class</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your class is your character's calling — it defines their abilities, fighting style, and role in the party.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  className={`relative p-4 rounded-sketch border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                  }`}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className={`font-display text-lg leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>{cls.name}</p>
                  <p className="font-sans text-[0.65rem] text-ink-faded mt-1">{CLASS_ROLE[cls.index]}</p>
                  {difficulty && <p className={`font-sans text-[0.6rem] font-semibold mt-1 ${difficulty.color}`}>{difficulty.label}</p>}
                  <p className="font-mono text-[0.6rem] text-ink-faded mt-1">d{cls.hitDie} HP</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blush rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Help panel */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6">
            {displayClass ? (
              <div className="space-y-4">
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
                  <div className="bg-parchment border border-sketch rounded-input px-3 py-2.5 text-center">
                    <p className="font-mono text-lg text-ink font-bold">d{displayClass.hitDie}</p>
                    <p className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">Hit Die</p>
                  </div>
                  <div className="bg-parchment border border-sketch rounded-input px-3 py-2.5 text-center">
                    <p className="font-mono text-lg text-ink font-bold">{displayClass.spellcastingAbility ?? "—"}</p>
                    <p className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">Spellcasting</p>
                  </div>
                </div>

                {displayClass.features.length > 0 && (
                  <div className="border-t border-sketch pt-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">
                      Level 1 Features
                    </p>
                    <ul className="space-y-2">
                      {displayClass.features.slice(0, 4).map((f) => (
                        <li key={f.id} className="bg-parchment border border-sketch rounded-input px-3 py-2.5">
                          <p className="font-sans text-xs font-bold text-ink">{f.name}</p>
                          <p className="font-sans text-xs text-ink-faded mt-0.5 line-clamp-2">{f.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚔️</span>
                  <h2 className="font-display text-xl text-ink">About Classes</h2>
                </div>
                <div className="space-y-3 font-sans text-sm text-ink-soft leading-relaxed">
                  <p>Your class shapes everything about how you play — what weapons you use, whether you cast spells, and what role you fill in the party.</p>
                  <div className="border-t border-sketch pt-3 space-y-2 text-xs">
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Hit Die</strong> determines your HP each level</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-sage shrink-0 mt-0.5">✦</span><span><strong className="text-sage">Beginner</strong> classes are simpler to learn</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-gold shrink-0 mt-0.5">✦</span><span><strong className="text-gold">Intermediate</strong> classes have more complexity</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-blush">Advanced</strong> classes reward careful planning</span></p>
                  </div>
                  <p className="text-xs text-ink-faded italic border-t border-sketch pt-3">Hover a class to see its level 1 features.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
