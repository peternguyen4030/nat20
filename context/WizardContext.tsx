"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { WizardState, WizardAction, AbilityScores, PersonalityTraits } from "@/types/character-creation";

const defaultAbilityScores: AbilityScores = {
  strength: 8, dexterity: 8, constitution: 8,
  intelligence: 8, wisdom: 8, charisma: 8,
};

const defaultPersonality: PersonalityTraits = {
  trait: "", ideal: "", bond: "", flaw: "",
};

function createInitialState(campaignId: string): WizardState {
  return {
    name: "", gender: "", pronouns: "",
    raceId: null, subraceId: null,
    classId: null,
    backgroundId: null,
    selectedSkills: [],
    abilityScoreMethod:   null,
    abilityScores:        defaultAbilityScores,
    rolledDice:           null,
    rollAssignments:      null,
    standardAssignments:  null,
    selectedCantrips: [],
    selectedSpells: [],
    personality: defaultPersonality,
    campaignId,
    currentStep:    1,
    highestStep:    1,
    completedSteps: [],
    visitedSteps:   [1],
  };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_BASICS":
      return { ...state, ...action.payload };
    case "SET_RACE":
      return { ...state, raceId: action.payload.raceId, subraceId: action.payload.subraceId ?? null };
    case "SET_SUBRACE":
      return { ...state, subraceId: action.payload.subraceId ?? null };
    case "SET_CLASS":
      return { ...state, classId: action.payload.classId, selectedSkills: [] };
    case "SET_BACKGROUND":
      return { ...state, backgroundId: action.payload.backgroundId };
    case "SET_SKILLS":
      return { ...state, selectedSkills: action.payload.skills };
    case "SET_ABILITY_METHOD":
      return {
        ...state,
        abilityScoreMethod:  action.payload.method,
        abilityScores:       defaultAbilityScores,
        rolledDice:          null,
        rollAssignments:     null,
        standardAssignments: null,
      };
    case "SET_ABILITY_SCORES":
      return { ...state, abilityScores: action.payload };
    case "SET_ROLLED_DICE":
      return { ...state, rolledDice: action.payload.dice };
    case "SET_ROLL_ASSIGNMENTS":
      return { ...state, rollAssignments: action.payload.assignments };
    case "SET_STANDARD_ASSIGNMENTS":
      return { ...state, standardAssignments: action.payload.assignments };
    case "SET_SPELLS":
      return { ...state, selectedCantrips: action.payload.cantrips, selectedSpells: action.payload.spells };
    case "SET_PERSONALITY":
      return { ...state, personality: action.payload };
    case "MARK_STEP_VISITED":
      return {
        ...state,
        visitedSteps: state.visitedSteps.includes(action.payload.step)
          ? state.visitedSteps
          : [...state.visitedSteps, action.payload.step],
      };
    case "MARK_STEP_COMPLETE":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload.step)
          ? state.completedSteps
          : [...state.completedSteps, action.payload.step],
      };
    case "NEXT_STEP": {
      const next = Math.min(state.currentStep + 1, 8);
      return {
        ...state,
        currentStep: next,
        highestStep: Math.max(state.highestStep, next),
        visitedSteps: state.visitedSteps.includes(next)
          ? state.visitedSteps
          : [...state.visitedSteps, next],
      };
    }
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: action.payload.step,
        highestStep: Math.max(state.highestStep, action.payload.step),
        visitedSteps: state.visitedSteps.includes(action.payload.step)
          ? state.visitedSteps
          : [...state.visitedSteps, action.payload.step],
      };
    default:
      return state;
  }
}

interface WizardContextValue {
  state:    WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children, campaignId }: { children: ReactNode; campaignId: string }) {
  const [state, dispatch] = useReducer(wizardReducer, campaignId, createInitialState);
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}