"use client";

import { useWizard } from "@/context/WizardContext";

const PRONOUN_OPTIONS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Any/All", "Other"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Genderfluid", "Agender", "Other", "Prefer not to say"];

export function BasicsStep() {
  const { state, dispatch } = useWizard();

  function update(field: string, value: string) {
    dispatch({
      type: "SET_BASICS",
      payload: {
        name: field === "name" ? value : state.name,
        gender: field === "gender" ? value : state.gender,
        pronouns: field === "pronouns" ? value : state.pronouns,
      },
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="font-display text-4xl text-ink mb-1">Let's start with the basics</h1>
          <p className="font-sans text-sm text-ink-faded">
            Give your character a name and a sense of identity. You can always change these later.
          </p>
        </div>

        {/* Level locked banner */}
        <div className="bg-sage/10 border-2 border-sage/30 rounded-sketch px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-sans text-sm font-semibold text-sage">Starting at Level 1</p>
            <p className="font-sans text-xs text-ink-faded mt-0.5">
              All characters begin at level 1. Use the level-up feature from your character sheet to advance your character over time.
            </p>
          </div>
        </div>

        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6">
          <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-2">
            Character Name <span className="text-blush">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Tharindel Moonwhisper"
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full font-sans text-base bg-parchment text-ink border-2 border-sketch rounded-input px-3 py-2.5 outline-none focus:border-blush transition-colors placeholder:text-ink-faded"
          />
          <p className="font-display text-xs text-ink-faded mt-2">
            Pick something that feels right for your character's world and personality.
          </p>
        </div>

        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6">
          <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
            Gender <span className="text-ink-faded font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => update("gender", state.gender === g ? "" : g)}
                className={`font-sans text-sm px-3 py-1.5 rounded-sketch border-2 transition-all duration-150 ${state.gender === g
                  ? "bg-blush border-blush text-white shadow-sketch-accent"
                  : "bg-parchment border-sketch text-ink-soft hover:bg-paper hover:border-blush/50"
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6">
          <label className="block font-sans text-[0.7rem] font-bold uppercase tracking-widest text-ink-faded mb-3">
            Pronouns <span className="text-ink-faded font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PRONOUN_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update("pronouns", state.pronouns === p ? "" : p)}
                className={`font-sans text-sm px-3 py-1.5 rounded-sketch border-2 transition-all duration-150 ${state.pronouns === p
                  ? "bg-blush border-blush text-white shadow-sketch-accent"
                  : "bg-parchment border-sketch text-ink-soft hover:bg-paper hover:border-blush/50"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Help panel */}
      <div className="lg:col-span-1">
        <div className="bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch p-6 sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📖</span>
            <h2 className="font-display text-xl text-ink">What is a character?</h2>
          </div>
          <div className="space-y-4 font-sans text-sm text-ink-soft leading-relaxed">
            <p>
              In Dungeons & Dragons, your character is your avatar in a shared story —
              a person in a fantasy world with strengths, weaknesses, a history, and
              a personality all their own.
            </p>
            <p>
              Over the next few steps you'll define who they are. Each choice shapes
              how they interact with the world.
            </p>
            <div className="border-t border-sketch p-4">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-ink-faded mb-3">Naming tips</p>
              <ul className="space-y-2">
                <li className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start">
                  <span className="text-blush shrink-0 mt-0.5">✦</span>
                  <span>Fantasy names often blend familiar sounds in new ways</span>
                </li>
                <li className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start">
                  <span className="text-blush shrink-0 mt-0.5">✦</span>
                  <span>Your race will suggest naming conventions</span>
                </li>
                <li className="font-sans text-xs text-ink-soft leading-relaxed flex gap-1.5 items-start">
                  <span className="text-blush shrink-0 mt-0.5">✦</span>
                  <span>It's okay to use a simple name — not every hero has an epic title</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
