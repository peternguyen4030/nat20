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
  const [races, setRaces]                   = useState<Race[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [hovered, setHovered]               = useState<Race | null>(null);
  const [hoveredSubrace, setHoveredSubrace] = useState<Subrace | null>(null);

  const selectedRace    = races.find((r) => r.id === state.raceId) ?? null;
  const selectedSubrace = selectedRace?.subraces.find((s) => s.id === state.subraceId) ?? null;
  const displayRace     = hovered ?? selectedRace;

  const showSubrace           = (selectedRace?.subraces.length ?? 0) > 0;
  const hoveringDifferentRace = hovered !== null && hovered.id !== state.raceId;
  const displaySubrace        = hoveringDifferentRace ? null : (hoveredSubrace ?? selectedSubrace ?? null);

  useEffect(() => {
    fetch("/api/races")
      .then((r) => r.json())
      .then((data) => { setRaces(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load races"); setLoading(false); });
  }, []);

  function selectRace(race: Race) {
    dispatch({ type: "SET_RACE", payload: { raceId: race.id } });
  }

  if (loading) return <LoadingGrid count={9} />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Race</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your race determines your ancestry and gives you natural traits, abilities, and a place in the world.
        </p>
      </div>

      {/* 4-col grid: about(1) | main(2) | race info(1) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── About Races — left panel ── */}
        <div className="lg:col-span-1 order-last lg:order-first">
          <div className="bg-parchment border-2 border-sketch rounded-sketch p-5 sticky top-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧬</span>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">About Races</p>
            </div>
            <p className="font-sans text-xs text-ink-soft leading-relaxed">Your race is your character's ancestry — the people they were born into. Each race has unique traits, ability bonuses, and a place in the world.</p>
            <div className="space-y-1.5 border-t border-sketch p-3">
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Ability bonuses</strong> add to your base stats</p>
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Traits</strong> give passive abilities like Darkvision</p>
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Subraces</strong> let you specialize within a broader ancestry</p>
            </div>
          </div>
        </div>

        {/* ── Race grid ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {races.map((race) => {
              const isSelected = state.raceId === race.id;
              const emoji      = RACE_EMOJI[race.index] ?? "🧬";
              const bonuses    = formatBonuses(race.abilityBonuses as { ability: string; bonus: number }[] | null);
              return (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => selectRace(race)}
                  onMouseEnter={() => setHovered(race)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative p-4 rounded-sketch border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                  }`}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className={`font-display text-lg leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>{race.name}</p>
                  {bonuses && <p className="font-sans text-[0.6rem] text-ink-faded mt-1">{bonuses}</p>}
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
        </div>

        {/* ── Right: race info panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5 sticky top-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {displayRace ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{RACE_EMOJI[displayRace.index] ?? "🧬"}</span>
                  <div>
                    <h2 className="font-display text-2xl text-ink">{displayRace.name}</h2>
                    <p className="font-sans text-xs text-ink-faded">Speed: {displayRace.speed}ft · Size: {displayRace.size ?? "Medium"}</p>
                  </div>
                </div>

                {displayRace.description && (
                  <p className="font-sans text-sm text-ink-soft leading-relaxed">{displayRace.description}</p>
                )}

                {(displayRace.abilityBonuses as { ability: string; bonus: number }[])?.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Ability Bonuses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(displayRace.abilityBonuses as { ability: string; bonus: number }[]).map((b) => (
                        <span key={b.ability} className="font-mono text-xs bg-sage/10 text-sage border border-sage/30 rounded p-1">
                          +{b.bonus} {b.ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {displayRace.traits && displayRace.traits.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Traits</p>
                    <ul className="space-y-2">
                      {displayRace.traits.slice(0, 4).map((trait) => (
                        <li key={trait.id ?? trait.name} className="bg-parchment border border-sketch rounded-input p-2">
                          <p className="font-sans text-xs font-bold text-ink">{trait.name}</p>
                          {trait.description && (
                            <p className="font-sans text-xs text-ink-faded mt-0.5 line-clamp-2">{trait.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Subrace info when hovering a subrace */}
                {displaySubrace && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Subrace</p>
                    <div className="bg-dusty-blue/5 border border-dusty-blue/30 rounded-input p-3">
                      <p className="font-sans text-sm font-semibold text-ink">{displaySubrace.name}</p>
                      {displaySubrace.description && (
                        <p className="font-sans text-xs text-ink-soft mt-1 leading-relaxed">{displaySubrace.description}</p>
                      )}
                      {formatBonuses(displaySubrace.abilityBonuses as { ability: string; bonus: number }[] | null) && (
                        <p className="font-mono text-xs text-sage mt-1">{formatBonuses(displaySubrace.abilityBonuses as { ability: string; bonus: number }[] | null)}</p>
                      )}
                    </div>
                  </div>
                )}

                {showSubrace && !displaySubrace && !hoveringDifferentRace && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-xs text-ink-faded italic">Select a subrace below.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">🧬</span>
                <p className="font-sans text-sm text-ink-faded italic">Hover or select a race to see its details.</p>
              </div>
            )}
          </div>

          {/* ── Subrace panel — below race info, same column ── */}
          {showSubrace && selectedRace && (
            <div className="bg-warm-white border-2 border-dusty-blue/40 rounded-sketch shadow-sketch p-5 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌿</span>
                  <h3 className="font-display text-lg text-ink">{selectedRace.name} Subrace</h3>
                </div>
                <span className="font-sans text-[0.6rem] font-bold uppercase tracking-wider text-ink-faded border border-sketch rounded p-0.5">Optional</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_SUBRACE", payload: { subraceId: null } })}
                  onMouseEnter={() => setHoveredSubrace(null)}
                  className={`w-full p-3 rounded-input border-2 text-left transition-all duration-150 ${
                    state.subraceId === null
                      ? "bg-parchment border-sketch"
                      : "bg-parchment border-sketch hover:border-dusty-blue/50 hover:bg-paper"
                  }`}
                >
                  <p className="font-display text-sm text-ink-faded">No subrace</p>
                  <p className="font-sans text-xs text-ink-faded mt-0.5">Play as a standard {selectedRace.name}</p>
                  {state.subraceId === null && <p className="font-sans text-[0.6rem] text-ink-faded mt-1">Selected ✓</p>}
                </button>
                {selectedRace.subraces.map((subrace) => {
                  const isSelected = state.subraceId === subrace.id;
                  const bonuses    = formatBonuses(subrace.abilityBonuses as { ability: string; bonus: number }[] | null);
                  return (
                    <button
                      key={subrace.id}
                      type="button"
                      onClick={() => dispatch({ type: "SET_SUBRACE", payload: { subraceId: subrace.id } })}
                      onMouseEnter={() => setHoveredSubrace(subrace)}
                      onMouseLeave={() => setHoveredSubrace(null)}
                      className={`w-full p-3 rounded-input border-2 text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-dusty-blue/10 border-dusty-blue"
                          : "bg-parchment border-sketch hover:border-dusty-blue/50 hover:bg-paper"
                      }`}
                    >
                      <p className={`font-display text-sm ${isSelected ? "text-dusty-blue" : "text-ink"}`}>{subrace.name}</p>
                      {bonuses && <p className="font-sans text-xs text-ink-faded mt-0.5">{bonuses}</p>}
                      {isSelected && <p className="font-sans text-[0.6rem] text-dusty-blue mt-1">Selected ✓</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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