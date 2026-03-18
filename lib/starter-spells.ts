// Starter spells must not exceed SPELL_COUNTS limits per class
export const STARTER_SPELLS: Record<string, { cantrips: string[]; spells: string[] }> = {
  wizard:   { cantrips: ["fire-bolt", "prestidigitation", "mage-hand"],    spells: ["magic-missile", "shield", "detect-magic", "sleep"] },
  sorcerer: { cantrips: ["fire-bolt", "prestidigitation", "mage-hand"],    spells: ["magic-missile", "shield"] },
  warlock:  { cantrips: ["eldritch-blast", "mage-hand"],                   spells: ["hex", "hellish-rebuke"] },
  bard:     { cantrips: ["vicious-mockery", "minor-illusion"],             spells: ["healing-word", "thunderwave", "charm-person", "sleep"] },
  cleric:   { cantrips: ["sacred-flame", "guidance", "thaumaturgy"],       spells: ["cure-wounds", "bless", "healing-word", "guiding-bolt"] },
  druid:    { cantrips: ["shillelagh", "guidance"],                        spells: ["cure-wounds", "entangle", "faerie-fire", "thunderwave"] },
};

export const MARTIAL_CLASSES = ["barbarian", "fighter", "monk", "rogue"];

// Classes that get spells in the wizard — paladin deferred (no spells at level 1)
// Paladin and Ranger excluded — no spells at level 1 in 5e
export const SPELLCASTING_CLASSES = [
  "bard", "cleric", "druid",
  "sorcerer", "warlock", "wizard",
];

export function isSpellcaster(classIndex: string): boolean {
  return SPELLCASTING_CLASSES.includes(classIndex);
}

export function getStarterSpells(classIndex: string) {
  return STARTER_SPELLS[classIndex] ?? { cantrips: [], spells: [] };
}

export const SPELL_COUNTS: Record<string, { cantrips: number; spells: number }> = {
  wizard:   { cantrips: 3, spells: 6 },
  sorcerer: { cantrips: 4, spells: 2 },
  warlock:  { cantrips: 2, spells: 2 },
  bard:     { cantrips: 2, spells: 4 },
  cleric:   { cantrips: 3, spells: 4 },
  druid:    { cantrips: 2, spells: 4 },
};