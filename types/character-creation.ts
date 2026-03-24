// ── Reference data shapes ─────────────────────────────────────────────────────

export interface Race {
  id: string;
  index: string;
  name: string;
  speed: number;
  size: string | null;
  description: string | null;
  abilityBonuses: { ability: string; bonus: number }[] | null;
  traitNames: string[];
  subraces: Subrace[];
  features: Feature[];
}

export interface Subrace {
  id: string;
  index: string;
  name: string;
  raceId: string;
  description: string | null;
  abilityBonuses: { ability: string; bonus: number }[] | null;
}

export interface Class {
  id: string;
  index: string;
  name: string;
  hitDie: number;
  spellcastingAbility: string | null;
  subclasses: Subclass[];
  features: Feature[];
}

export interface Subclass {
  id: string;
  index: string;
  name: string;
  classId: string;
}

export interface Background {
  id: string;
  index: string;
  name: string;
  description: string | null;
  feature: string | null;
  skillProficiencies: string[];
  languages: number;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: string;
}

export type SpellCategory = "DAMAGING" | "HEALING" | "CONTROL" | "BUFF" | "DEBUFF" | "UTILITY" | "DEFENSE";

export interface Spell {
  id: string;
  index: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  higherLevels?: string | null;
  category: SpellCategory;
}

// ── Skill definitions ─────────────────────────────────────────────────────────

export interface SkillDefinition {
  key: string;
  name: string;
  ability: string;
  description: string;
}

export const SKILLS: SkillDefinition[] = [
  { key: "acrobatics",       name: "Acrobatics",       ability: "DEX", description: "Stay on your feet in tricky situations — balancing, tumbling, or escaping grapples." },
  { key: "animal-handling",  name: "Animal Handling",  ability: "WIS", description: "Calm, control, or intuit the intentions of animals." },
  { key: "arcana",           name: "Arcana",            ability: "INT", description: "Recall lore about spells, magic items, planes of existence, and magical traditions." },
  { key: "athletics",        name: "Athletics",         ability: "STR", description: "Perform feats of physical prowess — climbing, jumping, swimming, or wrestling." },
  { key: "deception",        name: "Deception",         ability: "CHA", description: "Convincingly conceal the truth through lies, misdirection, or disguise." },
  { key: "history",          name: "History",           ability: "INT", description: "Recall lore about historical events, people, wars, and ancient civilizations." },
  { key: "insight",          name: "Insight",           ability: "WIS", description: "Read people — determine their true intentions and detect lies." },
  { key: "intimidation",     name: "Intimidation",      ability: "CHA", description: "Influence others through threats, hostile actions, or shows of force." },
  { key: "investigation",    name: "Investigation",     ability: "INT", description: "Deduce information by searching, examining clues, and making logical inferences." },
  { key: "medicine",         name: "Medicine",          ability: "WIS", description: "Stabilise the dying, diagnose illnesses, and provide first aid." },
  { key: "nature",           name: "Nature",            ability: "INT", description: "Recall lore about terrain, plants, animals, weather, and natural cycles." },
  { key: "perception",       name: "Perception",        ability: "WIS", description: "Notice things using your senses — spot hidden enemies, hear distant sounds." },
  { key: "performance",      name: "Performance",       ability: "CHA", description: "Delight an audience through music, dance, acting, or storytelling." },
  { key: "persuasion",       name: "Persuasion",        ability: "CHA", description: "Influence others through tact, social graces, good nature, or appeals to reason." },
  { key: "religion",         name: "Religion",          ability: "INT", description: "Recall lore about deities, rites, prayers, religious hierarchies, and holy symbols." },
  { key: "sleight-of-hand",  name: "Sleight of Hand",   ability: "DEX", description: "Pick pockets, plant objects, or perform feats of manual trickery." },
  { key: "stealth",          name: "Stealth",           ability: "DEX", description: "Conceal yourself from enemies, move silently, and hide in shadows." },
  { key: "survival",         name: "Survival",          ability: "WIS", description: "Follow tracks, forage for food, navigate terrain, and predict weather." },
];

export const CLASS_SKILL_OPTIONS: Record<string, { count: number; skills: string[] }> = {
  barbarian: { count: 2, skills: ["animal-handling","athletics","intimidation","nature","perception","survival"] },
  bard:      { count: 3, skills: ["acrobatics","animal-handling","arcana","athletics","deception","history","insight","intimidation","investigation","medicine","nature","perception","performance","persuasion","religion","sleight-of-hand","stealth","survival"] },
  cleric:    { count: 2, skills: ["history","insight","medicine","persuasion","religion"] },
  druid:     { count: 2, skills: ["arcana","animal-handling","insight","medicine","nature","perception","religion","survival"] },
  fighter:   { count: 2, skills: ["acrobatics","animal-handling","athletics","history","insight","intimidation","perception","survival"] },
  monk:      { count: 2, skills: ["acrobatics","athletics","history","insight","religion","stealth"] },
  paladin:   { count: 2, skills: ["athletics","insight","intimidation","medicine","persuasion","religion"] },
  ranger:    { count: 3, skills: ["animal-handling","athletics","insight","investigation","nature","perception","stealth","survival"] },
  rogue:     { count: 4, skills: ["acrobatics","athletics","deception","insight","intimidation","investigation","perception","performance","persuasion","sleight-of-hand","stealth"] },
  sorcerer:  { count: 2, skills: ["arcana","deception","insight","intimidation","persuasion","religion"] },
  warlock:   { count: 2, skills: ["arcana","deception","history","intimidation","investigation","nature","religion"] },
  wizard:    { count: 2, skills: ["arcana","history","insight","investigation","medicine","religion"] },
};

// ── Ability scores ────────────────────────────────────────────────────────────

export type AbilityScoreMethod = "standard_array" | "point_buy" | "roll";

export interface AbilityScores {
  strength:     number;
  dexterity:    number;
  constitution: number;
  intelligence: number;
  wisdom:       number;
  charisma:     number;
}

export const ABILITY_NAMES = [
  { key: "strength",     label: "Strength",     abbr: "STR", description: "Physical power. Used for melee attacks, carrying capacity, and feats of raw muscle." },
  { key: "dexterity",    label: "Dexterity",    abbr: "DEX", description: "Agility and reflexes. Used for ranged attacks, stealth, and avoiding danger." },
  { key: "constitution", label: "Constitution", abbr: "CON", description: "Endurance and health. Affects your hit points and ability to withstand hardship." },
  { key: "intelligence", label: "Intelligence", abbr: "INT", description: "Memory and reasoning. Used by Wizards for spells and for recalling lore." },
  { key: "wisdom",       label: "Wisdom",       abbr: "WIS", description: "Perception and insight. Used by Clerics and Druids, and for noticing things around you." },
  { key: "charisma",     label: "Charisma",     abbr: "CHA", description: "Force of personality. Used by Bards, Sorcerers, and Warlocks, and for social interactions." },
] as const;

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const POINT_BUY_BUDGET = 27;

// ── Personality ───────────────────────────────────────────────────────────────

export interface PersonalityTraits {
  trait: string;
  ideal: string;
  bond:  string;
  flaw:  string;
}

export const BACKGROUND_PERSONALITY: Record<string, Partial<PersonalityTraits>> = {
  acolyte:         { trait: "I idolize a particular hero and constantly compare myself to them.",   ideal: "Charity — I always try to help those in need.",              bond: "I owe my life to the priest who took me in.",                        flaw: "I am suspicious of strangers and expect the worst." },
  criminal:        { trait: "I always have a plan for what to do when things go wrong.",            ideal: "Freedom — chains are meant to be broken.",                    bond: "I'm trying to pay off a debt I owe to a generous benefactor.",       flaw: "I turn tail and run when things look bad." },
  "folk-hero":     { trait: "I judge people by their actions, not their words.",                    ideal: "Respect — people deserve to be treated with dignity.",         bond: "I protect those who cannot protect themselves.",                     flaw: "I have trouble trusting in my allies." },
  noble:           { trait: "My eloquent flattery makes everyone I talk to feel wonderful.",        ideal: "Responsibility — it is my duty to protect those beneath me.",  bond: "I will face any challenge to win the approval of my family.",        flaw: "I secretly believe that everyone is beneath me." },
  sage:            { trait: "I use polysyllabic words that convey great erudition.",                ideal: "Knowledge — the path to power is through knowledge.",           bond: "I have an ancient text that holds terrible secrets.",                flaw: "I am easily distracted by the promise of information." },
  soldier:         { trait: "I'm always polite and respectful.",                                    ideal: "Greater Good — our lot is to lay down our lives for others.",  bond: "Those who fight beside me are those worth dying for.",               flaw: "I made a terrible mistake in battle that cost many lives." },
  outlander:       { trait: "I watch over my companions as if they were newborn pups.",             ideal: "Life — the natural world is more important than civilization.", bond: "My family, clan, or tribe is the most important thing in my life.", flaw: "I am slow to trust members of other races." },
  entertainer:     { trait: "I know a story relevant to almost every situation.",                   ideal: "Creativity — the world is in need of new ideas.",               bond: "My instrument is my most treasured possession.",                     flaw: "I have trouble keeping my true feelings hidden." },
  "guild-artisan": { trait: "I believe that anything worth doing is worth doing right.",            ideal: "Community — it is the duty of all to strengthen community.",    bond: "The workshop where I learned my trade is the most important place.", flaw: "I am never satisfied with what I have." },
  hermit:          { trait: "I am utterly serene, even in the face of disaster.",                   ideal: "Solitude — I am on a quest for enlightenment.",                 bond: "I entered seclusion to hide from those hunting me.",                 flaw: "I am dogmatic in my thinking." },
  sailor:          { trait: "My friends know they can rely on me, no matter what.",                 ideal: "Respect — the thing that keeps a ship together is respect.",    bond: "I'm loyal to my captain first, everything else second.",             flaw: "I follow orders, even if I think they're wrong." },
  urchin:          { trait: "I hide scraps of food and trinkets away out of habit.",                ideal: "Community — we have to take care of each other.",               bond: "I escaped my life of poverty and I don't look back.",                flaw: "It's not stealing if I need it more than someone else." },
};

// ── Wizard state ──────────────────────────────────────────────────────────────

export interface WizardState {
  // Step 1
  name:     string;
  gender:   string;
  pronouns: string;

  // Step 2
  raceId:    string | null;
  subraceId: string | null;

  // Step 3
  classId: string | null;

  // Step 4
  backgroundId: string | null;

  // Step 5
  selectedSkills: string[];

  // Step 6
  abilityScoreMethod:   AbilityScoreMethod | null;
  abilityScores:        AbilityScores;
  rolledDice:           number[][] | null;           // persists roll results when backtracking
  rollAssignments:      Record<string, number | null> | null; // persists roll-to-ability assignments
  standardAssignments:  Record<string, number | null> | null; // persists standard array assignments

  // Step 7
  selectedCantrips: string[];
  selectedSpells:   string[];

  // Step 8
  personality: PersonalityTraits;

  // Meta — level always 1
  campaignId:  string;
  currentStep:    number;
  highestStep:    number;
  completedSteps: number[];
  visitedSteps:   number[];
}

export type WizardAction =
  | { type: "SET_BASICS";         payload: { name: string; gender: string; pronouns: string } }
  | { type: "SET_RACE";           payload: { raceId: string; subraceId?: string } }
  | { type: "SET_SUBRACE";        payload: { subraceId: string | null } }
  | { type: "SET_CLASS";          payload: { classId: string } }
  | { type: "SET_BACKGROUND";     payload: { backgroundId: string } }
  | { type: "SET_SKILLS";         payload: { skills: string[] } }
  | { type: "SET_ABILITY_METHOD"; payload: { method: AbilityScoreMethod } }
  | { type: "SET_ABILITY_SCORES"; payload: AbilityScores }
  | { type: "SET_ROLLED_DICE";        payload: { dice: number[][] } }
  | { type: "SET_ROLL_ASSIGNMENTS";    payload: { assignments: Record<string, number | null> } }
  | { type: "SET_STANDARD_ASSIGNMENTS";payload: { assignments: Record<string, number | null> } }
  | { type: "SET_SPELLS";         payload: { cantrips: string[]; spells: string[] } }
  | { type: "SET_PERSONALITY";    payload: PersonalityTraits }
  | { type: "NEXT_STEP" }
  | { type: "MARK_STEP_COMPLETE"; payload: { step: number } }
  | { type: "MARK_STEP_VISITED";  payload: { step: number } }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP";         payload: { step: number } };

// ── Step definitions ──────────────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { id: 1, label: "Basics",         icon: "✦"  },
  { id: 2, label: "Race",           icon: "🧬" },
  { id: 3, label: "Class",          icon: "⚔️" },
  { id: 4, label: "Background",     icon: "📜" },
  { id: 5, label: "Ability Scores", icon: "🎲" },
  { id: 6, label: "Skills",         icon: "🎯" },
  { id: 7, label: "Spells",         icon: "✨" },
  { id: 8, label: "Personality",    icon: "🎭" },
] as const;