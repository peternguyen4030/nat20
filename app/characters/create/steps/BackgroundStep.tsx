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

// ── Background detail modal ───────────────────────────────────────────────────

function BackgroundModal({ bg, onClose }: { bg: Background; onClose: () => void }) {
  const emoji = BACKGROUND_EMOJI[bg.index] ?? "📜";
  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sketch">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <h2 className="font-display text-2xl text-ink">{bg.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-input border-2 border-sketch bg-parchment text-ink-faded hover:border-blush transition-all flex items-center justify-center text-sm"
          >✕</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {bg.description && (
            <p className="font-sans text-sm text-ink-soft leading-relaxed">{bg.description}</p>
          )}
          {bg.skillProficiencies.length > 0 && (
            <div className="border-t border-sketch p-4">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Skill Proficiencies</p>
              <div className="flex flex-wrap gap-2">
                {bg.skillProficiencies.map((skill) => (
                  <span key={skill} className="font-sans text-xs capitalize bg-dusty-blue/10 text-dusty-blue border border-dusty-blue/30 rounded p-1">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {bg.feature && (
            <div className="border-t border-sketch p-4">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Background Feature</p>
              <div className="bg-parchment border border-sketch rounded-input p-3">
                <p className="font-sans text-sm font-semibold text-ink">{bg.feature}</p>
              </div>
            </div>
          )}
          {bg.languages > 0 && (
            <div className="border-t border-sketch p-4">
              <p className="font-sans text-xs text-ink-soft leading-relaxed">
                Grants <strong className="text-ink">{bg.languages}</strong> bonus language{bg.languages > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sketch bg-parchment flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch p-2 bg-warm-white hover:bg-paper transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main step ─────────────────────────────────────────────────────────────────

export function BackgroundStep() {
  const { state, dispatch }           = useWizard();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [hovered, setHovered]         = useState<Background | null>(null);
  const [modalBg, setModalBg]         = useState<Background | null>(null);

  const selectedBg = backgrounds.find((b) => b.id === state.backgroundId) ?? null;
  const displayBg  = hovered ?? selectedBg;

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((data) => { setBackgrounds(Array.isArray(data) ? data : []); setLoading(false); })
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── About Backgrounds — left panel ── */}
        <div className="lg:col-span-1 order-last lg:order-first">
          <div className="bg-parchment border-2 border-sketch rounded-sketch p-5 sticky top-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📜</span>
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">About Backgrounds</p>
            </div>
            <p className="font-sans text-xs text-ink-soft leading-relaxed">Every adventurer has a past. Your background reflects your character's life before they took up adventuring.</p>
            <div className="space-y-1.5 border-t border-sketch p-3">
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Skill Proficiencies</strong> automatically granted</p>
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Background Feature</strong> — a unique narrative ability</p>
              <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span><strong className="text-ink">Languages</strong> — bonus tongues you can speak</p>
            </div>
          </div>
        </div>

        {/* ── Background grid ── */}
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

        {/* ── Selected info panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5 sticky top-6 space-y-3">
            {displayBg ? (
              <>
                {/* Name + emoji */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{BACKGROUND_EMOJI[displayBg.index] ?? "📜"}</span>
                  <h2 className="font-display text-xl text-ink">{displayBg.name}</h2>
                </div>

                {/* 2-line description preview + Read more */}
                {displayBg.description && (
                  <div>
                    <p className="font-sans text-xs text-ink-soft leading-relaxed line-clamp-2">{displayBg.description}</p>
                    <button
                      type="button"
                      onClick={() => setModalBg(displayBg)}
                      className="font-sans text-[0.6rem] font-bold text-blush hover:text-ink transition-colors mt-1"
                    >
                      Read more →
                    </button>
                  </div>
                )}

                {/* Skill proficiencies — always visible */}
                {displayBg.skillProficiencies.length > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayBg.skillProficiencies.map((skill) => (
                        <span key={skill} className="font-sans text-xs capitalize bg-dusty-blue/10 text-dusty-blue border border-dusty-blue/30 rounded p-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Background feature — always visible */}
                {displayBg.feature && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1">Feature</p>
                    <div className="bg-parchment border border-sketch rounded-input p-2">
                      <p className="font-sans text-xs font-semibold text-ink">{displayBg.feature}</p>
                    </div>
                  </div>
                )}

                {/* Languages — always visible */}
                {displayBg.languages > 0 && (
                  <div className="border-t border-sketch p-3">
                    <p className="font-sans text-xs text-ink-soft">
                      +<strong className="text-ink">{displayBg.languages}</strong> language{displayBg.languages > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                            </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <p className="font-sans text-sm text-ink-faded italic">Hover or select a background to see its details.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Background detail modal */}
      {modalBg && (
        <BackgroundModal bg={modalBg} onClose={() => setModalBg(null)} />
      )}
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