"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Race, Subrace } from "@/types/character-creation";
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
  const [activeDetailTab, setActiveDetailTab] = useState<"description" | "traits" | "subrace">("description");

  const selectedRace    = races.find((r) => r.id === state.raceId) ?? null;
  const selectedSubrace = selectedRace?.subraces.find((s) => s.id === state.subraceId) ?? null;
  const displayRace     = hovered ?? selectedRace;

  const showSubrace           = (selectedRace?.subraces.length ?? 0) > 0;
  const hoveringDifferentRace = hovered !== null && hovered.id !== state.raceId;
  const displaySubrace        = hoveringDifferentRace ? null : (hoveredSubrace ?? selectedSubrace ?? null);
  const hasTraitsTab          = (displayRace?.traitNames?.length ?? 0) > 0;
  const hasSubraceTab         = (displayRace?.subraces.length ?? 0) > 0;
  const resolvedDetailTab =
    activeDetailTab === "traits" && !hasTraitsTab
      ? "description"
      : activeDetailTab === "subrace" && !hasSubraceTab
        ? "description"
        : activeDetailTab;

  useEffect(() => {
    fetch("/api/races")
      .then((r) => r.json())
      .then((data) => { setRaces(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load races"); setLoading(false); });
  }, []);

  if (loading) return <LoadingGrid count={9} />;
  if (error)   return <ErrorState message={error} />;

  return (
    <WizardStepBody>
      <WizardStepHeader
        title="Choose your Race"
        subtitle="Your race determines your ancestry and gives you natural traits, abilities, and a place in the world."
      />

      <WizardThreeColumnGrid>

        <WizardHintColumn>
          <WizardHintPanel icon="🧬" title="About Races">
            <p>Your race is your character&apos;s ancestry — the people they were born into. Each race has unique traits, ability bonuses, and a place in the world.</p>
            <div className="border-t border-sketch">
              <div className="m-3 space-y-1.5">
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Ability bonuses</strong> add to your base stats</p>
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Traits</strong> give passive abilities like Darkvision</p>
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Subraces</strong> let you specialize within a broader ancestry</p>
              </div>
            </div>
          </WizardHintPanel>
        </WizardHintColumn>

        <WizardMainColumn className="xl:col-span-5">

          {/* Race grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {races.map((race) => {
              const isSelected = state.raceId === race.id;
              const emoji      = RACE_EMOJI[race.index] ?? "🧬";
              const bonuses    = formatBonuses(race.abilityBonuses as { ability: string; bonus: number }[] | null);
              return (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => dispatch({ type: "SET_RACE", payload: { raceId: race.id } })}
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
                  {bonuses && <p className="font-sans text-[0.65rem] text-ink-faded mt-1">{bonuses}</p>}
                  {race.subraces.length > 0 && (
                    <p className="font-sans text-[0.6rem] text-dusty-blue mt-1">{race.subraces.length} subraces</p>
                  )}
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
          {showSubrace && selectedRace && (
            <div className="rounded-sketch border-2 border-dusty-blue/40 bg-warm-white p-3.5 shadow-sketch">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌿</span>
                  <h3 className="font-display text-base text-ink">Choose your {selectedRace.name} subrace</h3>
                </div>
                <span className="rounded border border-sketch px-1 py-0.5 font-sans text-[0.55rem] font-bold uppercase tracking-wider text-ink-faded">Optional</span>
              </div>
              <p className="mb-2 font-sans text-[0.7rem] leading-snug text-ink-faded">
                Some races have distinct lineages. Pick the one that calls to you, or leave it unselected.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "SET_SUBRACE", payload: { subraceId: null } })}
                  onMouseEnter={() => setHoveredSubrace(null)}
                  className={`rounded-input border-2 p-2 text-left transition-all duration-150 ${
                    state.subraceId === null
                      ? "bg-parchment border-sketch"
                      : "bg-parchment border-sketch hover:border-dusty-blue/50 hover:bg-paper"
                  }`}
                >
                  <p className="font-display text-sm text-ink-faded">No subrace</p>
                  <p className="mt-0.5 font-sans text-[0.7rem] text-ink-faded">Play as a standard {selectedRace.name}</p>
                  {state.subraceId === null && <p className="mt-0.5 font-sans text-[0.6rem] text-ink-faded">Selected ✓</p>}
                </button>
                {selectedRace.subraces.map((subrace) => {
                  const isSelected = state.subraceId === subrace.id;
                  const bonuses    = formatBonuses(subrace.abilityBonuses as { ability: string; bonus: number }[] | null);
                  return (
                    <button
                      key={subrace.id}
                      type="button"
                      onClick={() => {
                        dispatch({ type: "SET_SUBRACE", payload: { subraceId: subrace.id } });
                        setActiveDetailTab("subrace");
                      }}
                      onMouseEnter={() => {
                        setHoveredSubrace(subrace);
                        setActiveDetailTab("subrace");
                      }}
                      onMouseLeave={() => setHoveredSubrace(null)}
                      className={`rounded-input border-2 p-2 text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-dusty-blue/10 border-dusty-blue"
                          : "bg-parchment border-sketch hover:border-dusty-blue/50 hover:bg-paper"
                      }`}
                    >
                      <p className={`font-display text-sm ${isSelected ? "text-dusty-blue" : "text-ink"}`}>{subrace.name}</p>
                      {bonuses && <p className="mt-0.5 font-sans text-[0.7rem] text-ink-faded">{bonuses}</p>}
                      {isSelected && <p className="mt-0.5 font-sans text-[0.6rem] text-dusty-blue">Selected ✓</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </WizardMainColumn>

        <WizardSideColumn className="xl:col-span-4">
          <WizardDetailPanel icon="🧬" title="Race details" sizing="content">
            {displayRace ? (
              <div className="flex min-h-0 flex-1 flex-col transition-opacity duration-300">
                {/* Stays visible while scrolling traits / subrace lore */}
                <div className="sticky top-0 z-1 mb-3 shrink-0 space-y-2 border-b border-sketch/60 bg-warm-white pb-3 shadow-[0_10px_16px_-12px_rgba(44,36,28,0.2)]">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{RACE_EMOJI[displayRace.index] ?? "🧬"}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-2xl text-ink">{displayRace.name}</h2>
                      <p className="font-sans text-xs text-ink-faded">
                        Speed {displayRace.speed} ft · {displayRace.size ?? "Medium"}
                      </p>
                    </div>
                  </div>

                  {(displayRace.abilityBonuses as { ability: string; bonus: number }[])?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(displayRace.abilityBonuses as { ability: string; bonus: number }[]).map((b) => (
                        <span key={b.ability} className="rounded border border-sage/30 bg-sage/10 p-1 font-mono text-xs text-sage">
                          +{b.bonus} {b.ability}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                <div className="shrink-0">
                  <div className="flex flex-wrap gap-1.5 border-b border-sketch/60 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab("description")}
                      className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                        resolvedDetailTab === "description"
                          ? "border-blush bg-blush/10 text-blush"
                          : "border-sketch bg-parchment text-ink-faded hover:border-blush/40 hover:text-ink"
                      }`}
                    >
                      Description
                    </button>
                    {hasTraitsTab && (
                      <button
                        type="button"
                        onClick={() => setActiveDetailTab("traits")}
                        className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                          resolvedDetailTab === "traits"
                            ? "border-blush bg-blush/10 text-blush"
                            : "border-sketch bg-parchment text-ink-faded hover:border-blush/40 hover:text-ink"
                        }`}
                      >
                        Racial traits
                      </button>
                    )}
                    {hasSubraceTab && (
                      <button
                        type="button"
                        onClick={() => setActiveDetailTab("subrace")}
                        className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                          resolvedDetailTab === "subrace"
                            ? "border-dusty-blue bg-dusty-blue/10 text-dusty-blue"
                            : "border-sketch bg-parchment text-ink-faded hover:border-dusty-blue/40 hover:text-ink"
                        }`}
                      >
                        Subrace
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  {resolvedDetailTab === "description" && (
                    <div className="space-y-3">
                      {displayRace.description ? (
                        <p className="font-sans text-sm leading-relaxed text-ink-soft">{displayRace.description}</p>
                      ) : (
                        <p className="font-sans text-xs italic text-ink-faded">No race description is available yet.</p>
                      )}
                    </div>
                  )}

                  {resolvedDetailTab === "traits" && (
                    <div className="space-y-2">
                      {displayRace.traitNames && displayRace.traitNames.length > 0 ? (
                        <ul className="space-y-1">
                          {displayRace.traitNames.map((trait) => (
                            <li key={trait} className="flex gap-2 font-sans text-xs text-ink-soft">
                              <span className="mt-0.5 shrink-0 text-blush">✦</span>
                              {trait}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-sans text-xs italic text-ink-faded">No racial traits are listed for this race yet.</p>
                      )}
                    </div>
                  )}

                  {resolvedDetailTab === "subrace" && hasSubraceTab && (
                    <div className="space-y-2 rounded-sketch border-2 border-dusty-blue/25 bg-dusty-blue/5 p-3">
                      {displaySubrace ? (
                        <>
                          <div>
                            <h3 className="font-display text-lg text-ink">{displaySubrace.name}</h3>
                            <p className="font-sans text-[0.65rem] uppercase tracking-widest text-dusty-blue">{displayRace.name} subrace</p>
                          </div>
                          {displaySubrace.description && (
                            <p className="font-sans text-sm leading-relaxed text-ink-soft">{displaySubrace.description}</p>
                          )}
                          {(displaySubrace.abilityBonuses as { ability: string; bonus: number }[])?.length > 0 && (
                            <div className="border-t border-sketch/60">
                              <div className="mt-3">
                                <p className="mb-1.5 font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Additional bonuses</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(displaySubrace.abilityBonuses as { ability: string; bonus: number }[]).map((b) => (
                                    <span key={b.ability} className="rounded border border-dusty-blue/30 bg-dusty-blue/10 p-1 font-mono text-xs text-dusty-blue">
                                      +{b.bonus} {b.ability}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="font-sans text-xs italic text-ink-faded">
                          Select or hover a subrace above to read its full description.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">🧬</span>
                <p className="font-sans text-sm text-ink-faded italic">Hover or select a race to see its details.</p>
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