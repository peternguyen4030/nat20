export const STARTER_SPELLS: Record<string, { cantrips: string[]; spells: string[] }> = {
  wizard:   { cantrips: ["fire-bolt", "prestidigitation", "mage-hand"],        spells: ["magic-missile", "shield", "detect-magic", "sleep"] },
  sorcerer: { cantrips: ["fire-bolt", "prestidigitation", "mage-hand"],        spells: ["magic-missile", "shield", "burning-hands", "charm-person"] },
  warlock:  { cantrips: ["eldritch-blast", "mage-hand", "minor-illusion"],     spells: ["hex", "hellish-rebuke", "charm-person", "witch-bolt"] },
  bard:     { cantrips: ["vicious-mockery", "minor-illusion", "prestidigitation"], spells: ["healing-word", "thunderwave", "charm-person", "sleep"] },
  cleric:   { cantrips: ["sacred-flame", "guidance", "thaumaturgy"],           spells: ["cure-wounds", "bless", "healing-word", "guiding-bolt"] },
  druid:    { cantrips: ["shillelagh", "guidance", "produce-flame"],           spells: ["cure-wounds", "entangle", "faerie-fire", "thunderwave"] },
  ranger:   { cantrips: [],                                                     spells: ["hunters-mark", "cure-wounds", "entangle", "fog-cloud"] },
};

export const MARTIAL_CLASSES      = ["barbarian", "fighter", "monk", "rogue"];
export const DEFERRED_SPELLCASTERS = ["paladin"];

export function isSpellcaster(classIndex: string): boolean {
  return !MARTIAL_CLASSES.includes(classIndex) && !DEFERRED_SPELLCASTERS.includes(classIndex);
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
  ranger:   { cantrips: 0, spells: 2 },
};
