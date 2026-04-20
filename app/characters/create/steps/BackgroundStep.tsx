"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Background } from "@/types/character-creation";
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

const BACKGROUND_EMOJI: Record<string, string> = {
  acolyte: "🕯️", charlatan: "🃏", criminal: "🗝️", entertainer: "🎭",
  "folk-hero": "🌾", gladiator: "🏟️", "guild-artisan": "🔨", hermit: "🧘",
  knight: "🏰", noble: "👑", outlander: "🌲", sage: "📚",
  sailor: "⚓", soldier: "🪖", urchin: "🐀", pirate: "🏴‍☠️",
};

// ── Main step ─────────────────────────────────────────────────────────────────

export function BackgroundStep() {
  const { state, dispatch }           = useWizard();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [hovered, setHovered]         = useState<Background | null>(null);
  const [activePreviewTab, setActivePreviewTab] =
    useState<"description" | "skills" | "feature" | "languages">("description");

  const selectedBg = backgrounds.find((b) => b.id === state.backgroundId) ?? null;
  const displayBg  = hovered ?? selectedBg;
  const hasSkillsTab = (displayBg?.skillProficiencies.length ?? 0) > 0;
  const hasFeatureTab = !!displayBg?.feature;
  const hasLanguagesTab = (displayBg?.languages ?? 0) > 0;
  const resolvedPreviewTab =
    activePreviewTab === "skills" && !hasSkillsTab
      ? "description"
      : activePreviewTab === "feature" && !hasFeatureTab
        ? "description"
        : activePreviewTab === "languages" && !hasLanguagesTab
          ? "description"
          : activePreviewTab;

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((data) => { setBackgrounds(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load backgrounds"); setLoading(false); });
  }, []);

  if (loading) return <LoadingGrid count={12} />;
  if (error)   return <ErrorState message={error} />;

  return (
    <WizardStepBody className="flex h-full min-h-0 flex-col overflow-hidden space-y-6">
      <WizardStepHeader
        title="Choose your Background"
        subtitle="Your background is your character's history before they became an adventurer."
      />

      <WizardThreeColumnGrid className="min-h-0 flex-1 items-stretch gap-8 lg:gap-10">

        <WizardHintColumn>
          <WizardHintPanel icon="📜" title="About Backgrounds" density="compact">
            <p>Every adventurer has a past. Your background reflects your character&apos;s life before they took up adventuring.</p>
            <div className="border-t border-sketch">
              <div className="m-3 space-y-1.5">
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Skill Proficiencies</strong> automatically granted</p>
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Background Feature</strong> — a unique narrative ability</p>
                <p><span className="text-blush mr-1">✦</span><strong className="text-ink">Languages</strong> — bonus tongues you can speak</p>
              </div>
            </div>
          </WizardHintPanel>
        </WizardHintColumn>

        <WizardMainColumn className="h-full min-h-0 overflow-y-auto pr-1">
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
        </WizardMainColumn>

        <WizardSideColumn>
          <WizardDetailPanel icon="📜" title="Background preview" sizing="content">
            {displayBg ? (
              <div className="flex min-h-0 flex-1 flex-col transition-opacity duration-300">
                <div className="sticky top-0 z-1 mb-3 shrink-0 space-y-2 border-b border-sketch/60 bg-warm-white pb-3 shadow-[0_10px_16px_-12px_rgba(44,36,28,0.2)]">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{BACKGROUND_EMOJI[displayBg.index] ?? "📜"}</span>
                    <h2 className="font-display text-xl text-ink">{displayBg.name}</h2>
                  </div>
                </div>

                <div className="shrink-0">
                  <div className="flex flex-wrap gap-1.5 border-b border-sketch/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("description")}
                    className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                      resolvedPreviewTab === "description"
                        ? "border-blush bg-blush/10 text-blush"
                        : "border-sketch bg-parchment text-ink-faded hover:border-blush/40 hover:text-ink"
                    }`}
                  >
                    Description
                  </button>
                  {hasSkillsTab && (
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("skills")}
                      className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                        resolvedPreviewTab === "skills"
                          ? "border-dusty-blue bg-dusty-blue/10 text-dusty-blue"
                          : "border-sketch bg-parchment text-ink-faded hover:border-dusty-blue/40 hover:text-ink"
                      }`}
                    >
                      Skills
                    </button>
                  )}
                  {hasFeatureTab && (
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("feature")}
                      className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                        resolvedPreviewTab === "feature"
                          ? "border-sage bg-sage/10 text-sage"
                          : "border-sketch bg-parchment text-ink-faded hover:border-sage/40 hover:text-ink"
                      }`}
                    >
                      Feature
                    </button>
                  )}
                  {hasLanguagesTab && (
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab("languages")}
                      className={`rounded-input border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-wide transition-colors ${
                        resolvedPreviewTab === "languages"
                          ? "border-[#D4A853] bg-[#D4A853]/10 text-[#A57D2E]"
                          : "border-sketch bg-parchment text-ink-faded hover:border-[#D4A853]/50 hover:text-ink"
                      }`}
                    >
                      Languages
                    </button>
                  )}
                </div>
                </div>

                <div className="pt-1">
                  {resolvedPreviewTab === "description" && (
                    <div>
                      {displayBg.description ? (
                        <p className="font-sans text-xs leading-relaxed text-ink-soft">{displayBg.description}</p>
                      ) : (
                        <p className="font-sans text-xs italic text-ink-faded">No description available yet.</p>
                      )}
                    </div>
                  )}

                  {resolvedPreviewTab === "skills" && hasSkillsTab && (
                    <div className="space-y-2">
                      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Skill proficiencies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {displayBg.skillProficiencies.map((skill) => (
                          <span key={skill} className="rounded border border-dusty-blue/30 bg-dusty-blue/10 p-1 font-sans text-xs capitalize text-dusty-blue">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resolvedPreviewTab === "feature" && hasFeatureTab && (
                    <div className="space-y-2">
                      <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Background feature</p>
                      <div className="rounded-input border border-sketch bg-parchment p-2">
                        <p className="font-sans text-xs font-semibold text-ink">{displayBg.feature}</p>
                      </div>
                    </div>
                  )}

                  {resolvedPreviewTab === "languages" && hasLanguagesTab && (
                    <p className="font-sans text-xs text-ink-soft">
                      +<strong className="text-ink">{displayBg.languages}</strong> language{displayBg.languages > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <p className="font-sans text-sm text-ink-faded italic">Hover or select a background to see its details.</p>
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
      <p className="font-sans text-sm text-ink-faded m-1">Try refreshing the page.</p>
    </div>
  );
}