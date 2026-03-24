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
    description: "A general description of how your character acts, thinks, or speaks.",
  },
  {
    key:         "ideal",
    label:       "Ideal",
    icon:        "⭐",
    placeholder: "What does your character believe in above all else?",
    description: "The principle that drives your character — justice, freedom, greed, honor.",
  },
  {
    key:         "bond",
    label:       "Bond",
    icon:        "🔗",
    placeholder: "What person, place, or thing matters most to your character?",
    description: "Something that ties your character to the world — a person, place, or goal.",
  },
  {
    key:         "flaw",
    label:       "Flaw",
    icon:        "⚡",
    placeholder: "What weakness or vice does your character struggle with?",
    description: "Every hero has a weakness — a fear, a vice, a blind spot, or a dark secret.",
  },
];

export function PersonalityStep() {
  const { state, dispatch } = useWizard();
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);

  const selectedBg  = backgrounds.find((b) => b.id === state.backgroundId);
  const bgIndex     = selectedBg?.index ?? "";
  const suggestions = BACKGROUND_PERSONALITY[bgIndex] ?? {};
  const personality = state.personality;

  useEffect(() => {
    fetch("/api/backgrounds")
      .then((r) => r.json())
      .then((data) => setBackgrounds(Array.isArray(data) ? data : data.backgrounds ?? []))
      .catch(console.error);
  }, []);

  function updateField(key: keyof PersonalityTraits, value: string) {
    dispatch({ type: "SET_PERSONALITY", payload: { ...personality, [key]: value } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink mb-1">Personality</h1>
        <p className="font-sans text-sm text-ink-faded">
          Give your character some depth. These details shape how they interact with the world
          and make for richer roleplay. You can always update them later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {FIELDS.map((field) => {
          const value         = personality[field.key];
          const isFilled      = !!value.trim();
          const suggestion    = suggestions[field.key];
          const hasSuggestion = !!suggestion && value !== suggestion;

          return (
            <div
              key={field.key}
              className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-5 space-y-3 focus-within:border-blush transition-colors"
            >
              {/* Label */}
              <label className="flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded">
                <span>{field.icon}</span>
                {field.label}
                {isFilled && <span className="text-sage text-xs normal-case tracking-normal font-semibold">✓</span>}
              </label>

              {/* Description */}
              <p className="font-sans text-xs text-ink-faded leading-relaxed">{field.description}</p>

              {/* Textarea */}
              <textarea
                rows={3}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full font-sans text-sm bg-parchment text-ink border-2 border-sketch rounded-input p-3 outline-none focus:border-blush transition-colors placeholder:text-ink-faded resize-none leading-relaxed"
              />

              {/* Suggestion pill */}
              {hasSuggestion && (
                <button
                  type="button"
                  onClick={() => updateField(field.key, suggestion!)}
                  className="w-full text-left bg-blush/5 border border-blush/30 rounded-input p-3 group hover:bg-blush/10 hover:border-blush transition-all duration-150"
                >
                  <p className="font-sans text-[0.6rem] font-bold uppercase tracking-wider text-blush mb-1">
                    {selectedBg?.name ?? "Background"} Suggestion — click to use
                  </p>
                  <p className="font-sans text-xs text-ink-soft italic leading-relaxed group-hover:text-ink transition-colors">
                    &ldquo;{suggestion}&rdquo;
                  </p>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-parchment border border-sketch rounded-sketch p-4 space-y-1">
        <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span>All fields are optional but make roleplay much richer</p>
        <p className="font-sans text-xs text-ink-soft"><span className="text-blush mr-1">✦</span>You can edit these freely from your character sheet at any time</p>
      </div>
    </div>
  );
}