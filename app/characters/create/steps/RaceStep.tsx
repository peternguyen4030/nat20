"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Race, Subrace } from "@/types/character-creation";

const RACE_EMOJI: Record<string, string> = {
  dragonborn: "🐉", dwarf: "⛏️", elf: "🌿", gnome: "⚙️",
  "half-elf": "🌗", halfling: "🍀", "half-orc": "💪",
  human: "👤", tiefling: "😈",
};

function formatBonuses(bonuses: { ability: string; bonus: number }[] | null) {
  if (!bonuses?.length) return null;
  return bonuses.map((b) => `+${b.bonus} ${b.ability}`).join(", ");
}

export function RaceStep() {
  const { state, dispatch } = useWizard();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Race | null>(null);
  const [hoveredSubrace, setHoveredSubrace] = useState<Subrace | null>(null);
  const [showSubrace, setShowSubrace] = useState(false);

  const selectedRace = races.find((r) => r.id === state.raceId) ?? null;
  const selectedSubrace = selectedRace?.subraces.find((s) => s.id === state.subraceId) ?? null;
  const displaySubrace = hoveredSubrace ?? (showSubrace ? selectedSubrace : null);
  const displayRace = hovered ?? selectedRace;

  useEffect(() => {
    fetch("/api/races")
      .then((r) => r.json())
      .then((data) => { setRaces(data); setLoading(false); })
      .catch(() => { setError("Failed to load races"); setLoading(false); });
  }, []);

  function selectRace(race: Race) {
    dispatch({ type: "SET_RACE", payload: { raceId: race.id } });
    setShowSubrace(race.subraces.length > 0);
  }

  if (loading) return <LoadingGrid count={9} />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Race</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your race determines your ancestry and gives you natural traits, abilities, and a place in the world.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Race grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {races.map((race) => {
              const isSelected = state.raceId === race.id;
              const emoji = RACE_EMOJI[race.index] ?? "🧬";
              const bonuses = formatBonuses(race.abilityBonuses as any);
              return (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => selectRace(race)}
                  onMouseEnter={() => setHovered(race)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative p-4 rounded-sketch border-2 text-left transition-all duration-150 ${isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                    }`}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className={`font-display text-lg leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>{race.name}</p>
                  {bonuses && <p className="font-sans text-[0.65rem] text-ink-faded mt-1">{bonuses}</p>}
                  {race.subraces.length > 0 && <p className="font-sans text-[0.6rem] text-dusty-blue mt-1">{race.subraces.length} subraces</p>}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blush rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Subrace mini-step */}
          {showSubrace && selectedRace && selectedRace.subraces.length > 0 && (
            <div className="bg-warm-white border-2 border-dusty-blue/40 rounded-sketch shadow-sketch p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🌿</span>
                <h3 className="font-display text-xl text-ink">Choose your {selectedRace.name} subrace</h3>
              </div>
              <p className="font-sans text-xs text-ink-faded mb-4">
                Some races have distinct lineages. Pick the one that calls to you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRace.subraces.map((subrace) => {
                  const isSelected = state.subraceId === subrace.id;
                  const bonuses = formatBonuses(subrace.abilityBonuses as any);
                  return (
                    <button
                      key={subrace.id}
                      type="button"
                      onClick={() => dispatch({ type: "SET_SUBRACE", payload: { subraceId: subrace.id } })}
                      onMouseEnter={() => setHoveredSubrace(subrace)}
                      onMouseLeave={() => setHoveredSubrace(null)}
                      className={`p-3 rounded-input border-2 text-left transition-all duration-150 ${isSelected
                          ? "bg-dusty-blue/10 border-dusty-blue"
                          : "bg-parchment border-sketch hover:border-dusty-blue/50 hover:bg-paper"
                        }`}
                    >
                      <p className={`font-display text-base ${isSelected ? "text-dusty-blue" : "text-ink"}`}>{subrace.name}</p>
                      {bonuses && <p className="font-sans text-xs text-ink-faded mt-0.5">{bonuses}</p>}
                      {isSelected && <p className="font-sans text-[0.6rem] text-dusty-blue mt-1">Selected ✓</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Help panel */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6 transition-all duration-200">

            {/* Subrace detail — shown when hovering or selecting a subrace */}
            {displaySubrace ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setHoveredSubrace(null)}
                    className="font-sans text-xs text-ink-faded hover:text-ink transition-colors"
                  >
                    ← Back to {selectedRace?.name}
                  </button>
                </div>
                <div>
                  <h2 className="font-display text-2xl text-ink">{displaySubrace.name}</h2>
                  <p className="font-sans text-xs text-ink-faded">{selectedRace?.name} subrace</p>
                </div>
                {displaySubrace.description && (
                  <p className="font-sans text-sm text-ink-soft leading-relaxed">{displaySubrace.description}</p>
                )}
                {(displaySubrace.abilityBonuses as any[])?.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Additional Bonuses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(displaySubrace.abilityBonuses as { ability: string; bonus: number }[]).map((b) => (
                        <span key={b.ability} className="font-mono text-xs bg-dusty-blue/10 text-dusty-blue border border-dusty-blue/30 rounded px-2 py-0.5">
                          +{b.bonus} {b.ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : displayRace ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{RACE_EMOJI[displayRace.index] ?? "🧬"}</span>
                  <div>
                    <h2 className="font-display text-2xl text-ink">{displayRace.name}</h2>
                    <p className="font-sans text-xs text-ink-faded">Speed: {displayRace.speed}ft · Size: {displayRace.size ?? "Medium"}</p>
                  </div>
                </div>
                {displayRace.description && <p className="font-sans text-sm text-ink-soft leading-relaxed">{displayRace.description}</p>}
                {(displayRace.abilityBonuses as any[])?.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Ability Bonuses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(displayRace.abilityBonuses as { ability: string; bonus: number }[]).map((b) => (
                        <span key={b.ability} className="font-mono text-xs bg-sage/10 text-sage border border-sage/30 rounded px-2 py-0.5">
                          +{b.bonus} {b.ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayRace.traitNames.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Racial Traits</p>
                    <ul className="space-y-1">
                      {displayRace.traitNames.map((trait) => (
                        <li key={trait} className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start">
                          <span className="text-blush shrink-0 mt-0.5">✦</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showSubrace && (
                  <div className="border-t border-sketch pt-3">
                    <p className="font-sans text-xs text-ink-faded italic">Hover a subrace below to read its full description.</p>
                  </div>
                )}
              </div>

            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🧬</span>
                  <h2 className="font-display text-xl text-ink">About Races</h2>
                </div>
                <div className="space-y-3 font-sans text-sm text-ink-soft leading-relaxed">
                  <p>Your race is your character's ancestry — the people they were born into. Each race has unique traits, ability bonuses, and a place in the world.</p>
                  <div className="border-t border-sketch p-3 space-y-2 text-xs">
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Ability bonuses</strong> add to your base stats</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Traits</strong> give passive abilities like Darkvision</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Subraces</strong> let you specialise within a broader ancestry</span></p>
                  </div>
                  <p className="text-xs text-ink-faded italic border-t border-sketch p-3">Hover over a race card to learn more before committing.</p>
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