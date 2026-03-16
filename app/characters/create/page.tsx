"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardProvider, useWizard } from "@/context/WizardContext";
import { WIZARD_STEPS, CLASS_SKILL_OPTIONS } from "@/types/character-creation";
import { isSpellcaster } from "@/lib/starter-spells";
import { BasicsStep } from "./steps/BasicsStep";
import { RaceStep } from "./steps/RaceStep";
import { ClassStep } from "./steps/ClassStep";
import { BackgroundStep } from "./steps/BackgroundStep";
import { SkillsStep } from "./steps/SkillsStep";
import { AbilityScoreStep } from "./steps/AbilityScoreStep";
import { SpellsStep } from "./steps/SpellsStep";
import { PersonalityStep } from "./steps/PersonalityStep";

// ── Step validator ────────────────────────────────────────────────────────────

function canAdvance(
  state: ReturnType<typeof useWizard>["state"],
  classIndex: string
): boolean {
  switch (state.currentStep) {
    case 1: return !!state.name.trim();
    case 2: return !!state.raceId;
    case 3: return !!state.classId;
    case 4: return !!state.backgroundId;
    case 5: return (
      !!state.abilityScoreMethod &&
      Object.values(state.abilityScores).every((v) => v >= 8)
    );
    case 6: {
      const options = CLASS_SKILL_OPTIONS[classIndex];
      return state.selectedSkills.length >= (options?.count ?? 2);
    }
    case 7: return true; // spellcasters need selections; non-spellcasters skip
    case 8: return true; // personality is optional
    default: return false;
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ classIndex, campaignId }: { classIndex: string; campaignId: string }) {
  const { state, dispatch } = useWizard();

  return (
    <div className="w-full bg-warm-white border-b-2 border-sketch px-4 py-3 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto">
        {campaignId && (
          <a
            href={`/campaigns/${campaignId}`}
            className="font-sans text-xs text-ink-faded hover:text-ink transition-colors flex items-center gap-1 w-fit mb-2"
          >
            ← Back to Campaign
          </a>
        )}
        <div className="flex items-center">
          {WIZARD_STEPS.map((step, i) => {
            const isSpellStep = step.id === 7;
            const skipped = isSpellStep && !isSpellcaster(classIndex) && state.currentStep > 3;
            const isComplete = state.currentStep > step.id;
            const isCurrent = state.currentStep === step.id;
            const isLocked = state.currentStep < step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isComplete && dispatch({ type: "GO_TO_STEP", payload: { step: step.id } })}
                  disabled={isLocked}
                  className={`flex flex-col items-center gap-1 transition-all duration-200 ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-sketch border-2 flex items-center justify-center text-xs transition-all duration-200 ${skipped
                      ? "bg-parchment border-sketch/40 opacity-40"
                      : isComplete
                        ? "bg-sage border-sage text-white"
                        : isCurrent
                          ? "bg-blush border-blush text-white shadow-sketch-accent"
                          : "bg-parchment border-sketch text-ink-faded"
                    }`}>
                    {!skipped && isComplete ? "✓" : step.icon}
                  </div>
                  <span className={`font-sans text-[0.55rem] font-semibold uppercase tracking-wider hidden md:block ${isCurrent ? "text-blush" : isComplete ? "text-sage" : "text-ink-faded"
                    }`}>
                    {step.label}
                  </span>
                </button>

                {i < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 mx-1.5 h-0.5 relative">
                    <div className="absolute inset-0 bg-sketch rounded-full" />
                    <div
                      className="absolute inset-y-0 left-0 bg-sage rounded-full transition-all duration-500"
                      style={{ width: isComplete ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Bottom nav ────────────────────────────────────────────────────────────────

function NavBar({
  classIndex,
  onSubmit,
  submitting,
}: {
  classIndex: string;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { state, dispatch } = useWizard();
  const ready = canAdvance(state, classIndex);
  const isLast = state.currentStep === 8;

  function handleNext() {
    // Skip step 7 (spells) for non-spellcasters
    if (state.currentStep === 6 && !isSpellcaster(classIndex)) {
      dispatch({ type: "GO_TO_STEP", payload: { step: 8 } });
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  }

  function handleBack() {
    // Skip step 7 going backwards for non-spellcasters
    if (state.currentStep === 8 && !isSpellcaster(classIndex)) {
      dispatch({ type: "GO_TO_STEP", payload: { step: 6 } });
    } else {
      dispatch({ type: "PREV_STEP" });
    }
  }

  const totalSteps = isSpellcaster(classIndex) ? 8 : 7;

  return (
    <div className="w-full bg-warm-white border-t-2 border-sketch px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={state.currentStep === 1}
          className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch px-5 py-2 bg-parchment hover:bg-paper transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed shadow-sketch hover:-translate-x-px hover:-translate-y-px"
        >
          ← Back
        </button>

        <span className="font-display text-sm text-ink-faded">
          Step {state.currentStep > 7 && !isSpellcaster(classIndex) ? 7 : state.currentStep} of {totalSteps}
        </span>

        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={`font-sans font-bold text-sm text-white rounded-sketch px-6 py-2 border-2 transition-all duration-150 flex items-center gap-2 ${!submitting
                ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                : "bg-tan border-sketch cursor-not-allowed opacity-60"
              }`}
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Creating...
              </>
            ) : "Create Character ✦"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!ready}
            className={`font-sans font-bold text-sm text-white rounded-sketch px-6 py-2 border-2 transition-all duration-150 ${ready
                ? "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
                : "bg-tan border-sketch cursor-not-allowed opacity-50"
              }`}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step renderer ─────────────────────────────────────────────────────────────

function StepRenderer() {
  const { state } = useWizard();
  switch (state.currentStep) {
    case 1: return <BasicsStep />;
    case 2: return <RaceStep />;
    case 3: return <ClassStep />;
    case 4: return <BackgroundStep />;
    case 5: return <AbilityScoreStep />;
    case 6: return <SkillsStep />;
    case 7: return <SpellsStep />;
    case 8: return <PersonalityStep />;
    default: return null;
  }
}

// ── Inner wizard ──────────────────────────────────────────────────────────────

function WizardInner() {
  const { state } = useWizard();
  const router = useRouter();
  const campaignId = state.campaignId;
  const [classes, setClasses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then(setClasses).catch(console.error);
  }, []);

  const selectedClass = classes.find((c) => c.id === state.classId);
  const classIndex = selectedClass?.index ?? "";

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          gender: state.gender,
          pronouns: state.pronouns,
          raceId: state.raceId,
          subraceId: state.subraceId,
          classId: state.classId,
          backgroundId: state.backgroundId,
          campaignId: state.campaignId,
          abilityScores: state.abilityScores,
          selectedSkills: state.selectedSkills,
          selectedCantrips: state.selectedCantrips,
          selectedSpells: state.selectedSpells,
          personality: state.personality,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create character");
      }

      const character = await res.json();
      router.push(`/characters/${character.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture flex flex-col font-sans antialiased">
      <ProgressBar classIndex={classIndex} campaignId={campaignId} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 bg-blush/10 border border-blush/30 rounded-input px-4 py-3">
              <p className="font-display text-sm text-blush">✗ {error}</p>
            </div>
          )}
          <StepRenderer />
        </div>
      </div>

      <NavBar classIndex={classIndex} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function CreateCharacterPage({
  searchParams,
}: {
  searchParams: { campaignId?: string };
}) {
  const campaignId = searchParams.campaignId ?? "";

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-ink mb-2">No campaign selected</p>
          <p className="font-sans text-sm text-ink-faded">Start character creation from a campaign page.</p>
        </div>
      </div>
    );
  }

  return (
    <WizardProvider campaignId={campaignId}>
      <WizardInner />
    </WizardProvider>
  );
}