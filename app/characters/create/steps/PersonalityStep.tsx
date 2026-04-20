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
    <div className="flex h-full min-h-0 flex-col space-y-4 overflow-hidden">
      <div className="shrink-0">
        <h1 className="mb-1 font-display text-4xl text-ink">Personality</h1>
        <p className="font-sans text-sm text-ink-faded">
          Give your character some depth. These details shape how they interact with the world and make for richer roleplay.
          You can always update them later.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 overflow-y-auto pr-1">
        {FIELDS.map((field) => {
          const value         = personality[field.key];
          const isFilled      = !!value.trim();
          const suggestion    = suggestions[field.key];
          const hasSuggestion = !!suggestion && value !== suggestion;

          return (
            <div
              key={field.key}
              className="space-y-2.5 rounded-sketch border-2 border-sketch bg-warm-white p-4 shadow-sketch transition-colors focus-within:border-blush"
            >
              <label className="flex items-center gap-2 font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded">
                <span>{field.icon}</span>
                {field.label}
                {isFilled && <span className="text-xs font-semibold normal-case tracking-normal text-sage">✓</span>}
              </label>

              <p className="font-sans text-xs leading-relaxed text-ink-faded">{field.description}</p>

              <textarea
                rows={4}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full resize-none rounded-input border-2 border-sketch bg-parchment p-3 font-sans text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faded focus:border-blush"
              />

              {hasSuggestion && !isFilled && (
                <button
                  type="button"
                  onClick={() => updateField(field.key, suggestion!)}
                  className="group w-full rounded-input border border-blush/30 bg-blush/5 p-3 text-left transition-all duration-150 hover:border-blush hover:bg-blush/10"
                >
                  <p className="mb-1 font-sans text-[0.6rem] font-bold uppercase tracking-wider text-blush">
                    {selectedBg?.name ?? "Background"} suggestion — click to use
                  </p>
                  <p className="font-sans text-xs italic leading-relaxed text-ink-soft transition-colors group-hover:text-ink">
                    &ldquo;{suggestion}&rdquo;
                  </p>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 space-y-1 rounded-sketch border border-sketch bg-parchment p-3">
        <p className="font-sans text-xs text-ink-soft">
          <span className="mr-1 text-blush">✦</span>All fields are optional but make roleplay much richer
        </p>
        <p className="font-sans text-xs text-ink-soft">
          <span className="mr-1 text-blush">✦</span>You can edit these freely from your character sheet at any time
        </p>
      </div>
    </div>
  );
}