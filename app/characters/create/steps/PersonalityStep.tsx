"use client";

import { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { Background, PersonalityTraits, BACKGROUND_PERSONALITY } from "@/types/character-creation";

const FIELDS: { key: keyof PersonalityTraits; label: string; icon: string; placeholder: string; description: string }[] = [
  {
    key:         "trait",
    label:       "Personality Trait",
    icon:        "🎭",
    placeholder: "How does your character behave day to day?",
    description: "A general description of how your character acts, thinks, or speaks. Think about their quirks, habits, and mannerisms.",
  },
  {
    key:         "ideal",
    label:       "Ideal",
    icon:        "⭐",
    placeholder: "What does your character believe in above all else?",
    description: "The principle that drives your character — justice, freedom, greed, honour. This is their moral compass.",
  },
  {
    key:         "bond",
    label:       "Bond",
    icon:        "🔗",
    placeholder: "What person, place, or thing matters most to your character?",
    description: "Something that ties your character to the world — a person they love, a place they protect, a goal they pursue.",
  },
  {
    key:         "flaw",
    label:       "Flaw",
    icon:        "⚡",
    placeholder: "What weakness or vice does your character struggle with?",
    description: "Every hero has a weakness. A flaw makes your character human — a fear, a vice, a blind spot, or a dark secret.",
  },
];

export function PersonalityStep() {
  const { state, dispatch } = useWizard();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [activeField, setActiveField] = useState<keyof PersonalityTraits>("trait");

  const selectedBg      = backgrounds.find((b) => b.id === state.backgroundId);
  const bgIndex         = selectedBg?.index ?? "";
  const suggestions     = BACKGROUND_PERSONALITY[bgIndex] ?? {};
  const personality     = state.personality;

  // Pre-populate from background suggestions on background selection
  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then(setBackgrounds)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (bgIndex && suggestions) {
      // Only pre-populate fields that are still empty
      const updated = { ...personality };
      let changed = false;
      (Object.keys(suggestions) as (keyof PersonalityTraits)[]).forEach((key) => {
        if (!updated[key] && suggestions[key]) {
          updated[key] = suggestions[key]!;
          changed = true;
        }
      });
      if (changed) dispatch({ type: "SET_PERSONALITY", payload: updated });
    }
  }, [bgIndex]);

  function updateField(key: keyof PersonalityTraits, value: string) {
    dispatch({ type: "SET_PERSONALITY", payload: { ...personality, [key]: value } });
  }

  function applySuggestion(key: keyof PersonalityTraits) {
    if (suggestions[key]) {
      updateField(key, suggestions[key]!);
    }
  }

  const activeFieldDef = FIELDS.find((f) => f.key === activeField)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Personality</h1>
        <p className="font-sans text-sm text-ink-faded">
          Give your character some depth. These details shape how they interact with the world
          and make for richer roleplay. You can always update them later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: fields ── */}
        <div className="lg:col-span-2 space-y-4">
          {FIELDS.map((field) => {
            const hasSuggestion = !!suggestions[field.key];
            const isActive      = activeField === field.key;
            const value         = personality[field.key];
            const isFilled      = !!value.trim();

            return (
              <div
                key={field.key}
                className={`bg-warm-white border-2 rounded-sketch shadow-sketch p-5 transition-all duration-150 ${
                  isActive ? "border-blush" : "border-sketch"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded">
                    <span>{field.icon}</span>
                    {field.label}
                    {isFilled && (
                      <span className="text-sage text-xs normal-case tracking-normal font-semibold">✓</span>
                    )}
                  </label>
                  {hasSuggestion && (
                    <button
                      type="button"
                      onClick={() => applySuggestion(field.key)}
                      className="font-sans text-xs text-dusty-blue hover:text-ink transition-colors underline decoration-dotted underline-offset-2"
                    >
                      Use suggestion
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={value}
                  placeholder={field.placeholder}
                  onFocus={() => setActiveField(field.key)}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded resize-none leading-relaxed"
                />

                {/* Background suggestion preview */}
                {hasSuggestion && value !== suggestions[field.key] && (
                  <p className="font-display text-xs text-ink-faded mt-1.5 italic line-clamp-1">
                    Suggestion: "{suggestions[field.key]}"
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right: help panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6 space-y-4 transition-all duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeFieldDef.icon}</span>
              <h2 className="font-display text-xl text-ink">{activeFieldDef.label}</h2>
            </div>
            <p className="font-sans text-sm text-ink-soft leading-relaxed">
              {activeFieldDef.description}
            </p>

            {suggestions[activeField] && (
              <div className="border-t border-sketch pt-4 space-y-2">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">
                  {selectedBg?.name ?? "Background"} Suggestion
                </p>
                <div className="bg-parchment border border-sketch rounded-input px-4 py-3">
                  <p className="font-display text-sm text-ink-soft italic leading-relaxed">
                    "{suggestions[activeField]}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => applySuggestion(activeField)}
                  className="w-full font-sans font-semibold text-xs text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-3 py-2 hover:-translate-x-px hover:-translate-y-px transition-all duration-150"
                >
                  Use this suggestion
                </button>
              </div>
            )}

            <div className="border-t border-sketch pt-4 space-y-1.5 text-xs font-sans text-ink-soft">
              <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span>These are optional but make roleplay richer</span></p>
              <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span>Your background provides curated suggestions</span></p>
              <p className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start"><span className="text-blush shrink-0 mt-0.5">✦</span><span>You can edit these freely from your character sheet</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
