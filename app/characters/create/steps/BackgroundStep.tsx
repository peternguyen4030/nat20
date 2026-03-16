"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Background } from "@/types/character-creation";

const BACKGROUND_EMOJI: Record<string, string> = {
  acolyte: "🕯️", charlatan: "🃏", criminal: "🗝️", entertainer: "🎭",
  "folk-hero": "🌾", gladiator: "🏟️", "guild-artisan": "🔨", hermit: "🧘",
  knight: "🏰", noble: "👑", outlander: "🌲", sage: "📚",
  sailor: "⚓", soldier: "🪖", urchin: "🐀", pirate: "🏴‍☠️",
};

export function BackgroundStep() {
  const { state, dispatch }       = useWizard();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [hovered, setHovered]         = useState<Background | null>(null);

  const selectedBg = backgrounds.find((b) => b.id === state.backgroundId) ?? null;
  const displayBg  = hovered ?? selectedBg;

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((data) => { setBackgrounds(data); setLoading(false); })
      .catch(() => { setError("Failed to load backgrounds"); setLoading(false); });
  }, []);

  if (loading) return <LoadingGrid count={12} />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Choose your Background</h1>
        <p className="font-sans text-sm text-ink-faded">
          Your background is your character's history before they became an adventurer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {backgrounds.map((bg) => {
              const isSelected = state.backgroundId === bg.id;
              const emoji      = BACKGROUND_EMOJI[bg.index] ?? "📜";
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => dispatch({ type: "SET_BACKGROUND", payload: { backgroundId: bg.id } })}
                  onMouseEnter={() => setHovered(bg)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative p-4 rounded-sketch border-2 text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-blush/10 border-blush shadow-sketch-accent"
                      : "bg-warm-white border-sketch shadow-sketch hover:border-blush/50 hover:bg-paper hover:-translate-x-px hover:-translate-y-px"
                  }`}
                >
                  <div className="text-2xl mb-2">{emoji}</div>
                  <p className={`font-display text-lg leading-tight ${isSelected ? "text-blush" : "text-ink"}`}>{bg.name}</p>
                  {bg.skillProficiencies.length > 0 && (
                    <p className="font-sans text-[0.65rem] text-ink-faded mt-1 capitalize">
                      {bg.skillProficiencies.slice(0, 2).join(", ")}
                    </p>
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
        </div>

        {/* Help panel */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6">
            {displayBg ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{BACKGROUND_EMOJI[displayBg.index] ?? "📜"}</span>
                  <h2 className="font-display text-2xl text-ink">{displayBg.name}</h2>
                </div>
                {displayBg.description && (
                  <p className="font-sans text-sm text-ink-soft leading-relaxed">{displayBg.description}</p>
                )}
                {displayBg.skillProficiencies.length > 0 && (
                  <div className="border-t border-sketch pt-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Skill Proficiencies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayBg.skillProficiencies.map((skill) => (
                        <span key={skill} className="font-sans text-xs capitalize bg-dusty-blue/10 text-dusty-blue border border-dusty-blue/30 rounded px-2 py-0.5">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayBg.feature && (
                  <div className="border-t border-sketch pt-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Background Feature</p>
                    <div className="bg-parchment border border-sketch rounded-input px-3 py-2.5">
                      <p className="font-sans text-sm font-semibold text-ink">{displayBg.feature}</p>
                    </div>
                  </div>
                )}
                {displayBg.languages > 0 && (
                  <div className="border-t border-sketch pt-3">
                    <p className="font-sans text-xs text-ink-soft">
                      🗣️ Grants <strong className="text-ink">{displayBg.languages}</strong> bonus language{displayBg.languages > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📜</span>
                  <h2 className="font-display text-xl text-ink">About Backgrounds</h2>
                </div>
                <div className="space-y-3 font-sans text-sm text-ink-soft leading-relaxed">
                  <p>Every adventurer has a past. Your background reflects your character's life before they took up adventuring.</p>
                  <div className="border-t border-sketch pt-3 space-y-2 text-xs">
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Skill Proficiencies</strong> are automatically granted — you'll see them on the skills step</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Background Feature</strong> gives a unique social or narrative ability</span></p>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span><strong className="text-ink">Languages</strong> let you speak additional tongues</span></p>
                  </div>
                  <p className="text-xs text-ink-faded italic border-t border-sketch pt-3">Hover a background to see what it grants.</p>
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
