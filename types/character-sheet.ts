// ── Character sheet types ─────────────────────────────────────────────────────

export interface AbilityScores {
  strength: number; dexterity: number; constitution: number;
  intelligence: number; wisdom: number; charisma: number;
}

export interface Feature {
  id: string;
  feature: {
    id: string; name: string; description: string; type: string;
    combatUsable: boolean; actionType: string | null; category: string | null;
  };
}

export interface CharacterSpell {
  id: string; status: string;
  spell: {
    id: string; index: string; name: string; level: number; school: string;
    castingTime: string; range: string; duration: string;
    description: string; category: string; higherLevels: string | null;
  };
}

export interface InventoryItem {
  id: string; quantity: number; equipped: boolean; attuned: boolean;
  itemId: string | null;
  customName: string | null; customDescription: string | null; customType: string | null;
  item: {
    id: string; name: string; description: string | null; type: string;
    damageDice: string | null; damageType: string | null;
    armorClass: number | null; weight: number | null; cost: string | null;
  } | null;
}

export interface CharacterProficiency {
  id: string; expertise: boolean;
  proficiency: { id: string; name: string; type: string; index: string };
}

export interface Character {
  id: string; name: string; level: number;
  currentHp: number; maxHp: number; temporaryHp: number;
  armorClass: number; proficiencyBonus: number; speed: number;
  initiative: number; inspiration: boolean; avatarUrl: string | null;
  gender: string | null; pronouns: string | null; notes: string | null;
  personalityTrait: string | null; ideal: string | null;
  bond: string | null; flaw: string | null;
  deathSaves:         { successes: number; failures: number } | null;
  hitDice:            { total: number; used: number } | null;
  spellSlots:         Record<string, { max: number; used: number }> | null;
  savingThrowBonuses: Record<string, number> | null;
  skillBonuses:       Record<string, number> | null;
  languages:          string[];
  conditions:         string[];
  race:        { name: string; speed: number; traitNames: string[] } | null;
  background:  { name: string; feature: string | null } | null;
  abilityScores: AbilityScores | null;
  classes:     { level: number; class: { name: string; hitDie: number; spellcastingAbility: string | null; index: string } }[];
  features:    Feature[];
  spells:      CharacterSpell[];
  proficiencies: CharacterProficiency[];
  inventory:   InventoryItem[];
  campaign:    { id: string; name: string; emoji: string | null };
}

// ── Ability score helpers ─────────────────────────────────────────────────────

export const ABILITY_KEYS = [
  { key: "strength",     label: "Strength",     abbr: "STR" },
  { key: "dexterity",    label: "Dexterity",     abbr: "DEX" },
  { key: "constitution", label: "Constitution",  abbr: "CON" },
  { key: "intelligence", label: "Intelligence",  abbr: "INT" },
  { key: "wisdom",       label: "Wisdom",        abbr: "WIS" },
  { key: "charisma",     label: "Charisma",      abbr: "CHA" },
] as const;

export function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

export function modNum(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ── Skills ────────────────────────────────────────────────────────────────────

export const SKILLS_MAP = [
  { key: "acrobatics",       label: "Acrobatics",      ability: "dexterity"    },
  { key: "animal-handling",  label: "Animal Handling",  ability: "wisdom"       },
  { key: "arcana",           label: "Arcana",           ability: "intelligence" },
  { key: "athletics",        label: "Athletics",        ability: "strength"     },
  { key: "deception",        label: "Deception",        ability: "charisma"     },
  { key: "history",          label: "History",          ability: "intelligence" },
  { key: "insight",          label: "Insight",          ability: "wisdom"       },
  { key: "intimidation",     label: "Intimidation",     ability: "charisma"     },
  { key: "investigation",    label: "Investigation",    ability: "intelligence" },
  { key: "medicine",         label: "Medicine",         ability: "wisdom"       },
  { key: "nature",           label: "Nature",           ability: "intelligence" },
  { key: "perception",       label: "Perception",       ability: "wisdom"       },
  { key: "performance",      label: "Performance",      ability: "charisma"     },
  { key: "persuasion",       label: "Persuasion",       ability: "charisma"     },
  { key: "religion",         label: "Religion",         ability: "intelligence" },
  { key: "sleight-of-hand",  label: "Sleight of Hand",  ability: "dexterity"    },
  { key: "stealth",          label: "Stealth",          ability: "dexterity"    },
  { key: "survival",         label: "Survival",         ability: "wisdom"       },
] as const;

export const SAVING_THROW_ABILITY: Record<string, string> = {
  barbarian: "strength",    bard: "dexterity",    cleric: "wisdom",
  druid: "wisdom",          fighter: "strength",  monk: "strength",
  paladin: "wisdom",        ranger: "dexterity",  rogue: "dexterity",
  sorcerer: "constitution", warlock: "charisma",  wizard: "intelligence",
};

// ── Conditions ────────────────────────────────────────────────────────────────

export const CONDITIONS: {
  key: string; label: string;
  color: string; bg: string; border: string; dot: string;
  description: string;
}[] = [
  { key: "BLINDED",       label: "Blinded",       color: "text-dusty-blue",  bg: "bg-dusty-blue/10",  border: "border-dusty-blue/40",  dot: "bg-dusty-blue",  description: "Can't see. Attacks against you have advantage, your attacks have disadvantage." },
  { key: "CHARMED",       label: "Charmed",        color: "text-blush",   bg: "bg-blush/10",   border: "border-blush/40",   dot: "bg-blush",   description: "Can't attack the charmer. The charmer has advantage on social checks against you." },
  { key: "DEAFENED",      label: "Deafened",       color: "text-dusty-blue",  bg: "bg-dusty-blue/10",  border: "border-dusty-blue/40",  dot: "bg-dusty-blue",  description: "Can't hear. Automatically fails hearing-based checks." },
  { key: "EXHAUSTION",    label: "Exhaustion",     color: "text-gold",   bg: "bg-gold/10",   border: "border-gold/40",   dot: "bg-gold",   description: "Stacks up to 6 levels. Each level imposes cumulative penalties to checks, speed, and more." },
  { key: "FRIGHTENED",    label: "Frightened",     color: "text-gold",   bg: "bg-gold/10",   border: "border-gold/40",   dot: "bg-gold",   description: "Disadvantage on checks while source is in sight. Can't willingly move closer to the source." },
  { key: "GRAPPLED",      label: "Grappled",       color: "text-[#B87333]",   bg: "bg-[#B87333]/10",   border: "border-[#B87333]/40",   dot: "bg-[#B87333]",   description: "Speed becomes 0. Ends if grappler is incapacitated or you escape." },
  { key: "INCAPACITATED", label: "Incapacitated",  color: "text-blush",       bg: "bg-blush/10",       border: "border-blush/40",       dot: "bg-blush",       description: "Can't take actions or reactions." },
  { key: "INVISIBLE",     label: "Invisible",      color: "text-dusty-blue",  bg: "bg-dusty-blue/10",  border: "border-dusty-blue/40",  dot: "bg-dusty-blue",  description: "Can't be seen. Your attacks have advantage, attacks against you have disadvantage." },
  { key: "PARALYZED",     label: "Paralyzed",      color: "text-blush",       bg: "bg-blush/10",       border: "border-blush/40",       dot: "bg-blush",       description: "Incapacitated and can't move or speak. Attacks against you within 5 ft are automatic crits." },
  { key: "PETRIFIED",     label: "Petrified",      color: "text-blush",       bg: "bg-blush/10",       border: "border-blush/40",       dot: "bg-blush",       description: "Transformed into stone. Incapacitated, resistant to all damage, immune to poison and disease." },
  { key: "POISONED",      label: "Poisoned",       color: "text-sage",        bg: "bg-sage/10",        border: "border-sage/40",        dot: "bg-sage",        description: "Disadvantage on attack rolls and ability checks." },
  { key: "PRONE",         label: "Prone",          color: "text-[#B87333]",   bg: "bg-[#B87333]/10",   border: "border-[#B87333]/40",   dot: "bg-[#B87333]",   description: "Can only crawl or stand up. Melee attacks against you have advantage." },
  { key: "RESTRAINED",    label: "Restrained",     color: "text-[#B87333]",   bg: "bg-[#B87333]/10",   border: "border-[#B87333]/40",   dot: "bg-[#B87333]",   description: "Speed 0. Your attacks have disadvantage, attacks against you have advantage. Dex saves disadvantage." },
  { key: "STUNNED",       label: "Stunned",        color: "text-blush",       bg: "bg-blush/10",       border: "border-blush/40",       dot: "bg-blush",       description: "Incapacitated, can't move. Attacks against you within 5 ft are automatic crits." },
  { key: "UNCONSCIOUS",   label: "Unconscious",    color: "text-blush",       bg: "bg-blush/10",       border: "border-blush/40",       dot: "bg-blush",       description: "Incapacitated, can't move or speak. Drops everything held, falls prone. Attacks within 5 ft are crits." },
];

// ── Category colors ───────────────────────────────────────────────────────────

export const CATEGORY_COLOR: Record<string, string> = {
  DAMAGING: "text-blush bg-blush/10 border-blush/30",
  HEALING:  "text-sage bg-sage/10 border-sage/30",
  CONTROL:  "text-dusty-blue bg-dusty-blue/10 border-dusty-blue/30",
  BUFF:     "text-gold bg-gold/10 border-gold/30",
  DEBUFF:   "text-ink-soft bg-parchment border-sketch",
  DEFENSE:  "text-dusty-blue bg-dusty-blue/10 border-dusty-blue/30",
  UTILITY:  "text-ink-faded bg-parchment border-sketch",
};

export const SPELL_CATEGORY_LABELS: Record<string, string> = {
  DAMAGING: "🔥 Damaging", HEALING: "💚 Healing", CONTROL: "🕸️ Control",
  BUFF: "⬆️ Buff", DEBUFF: "⬇️ Debuff", DEFENSE: "🛡️ Defense", UTILITY: "🔧 Utility",
};

export const ITEM_TYPE_EMOJI: Record<string, string> = {
  WEAPON: "⚔️", ARMOR: "🛡️", CONSUMABLE: "🧪",
  TOOL: "🔧", GEAR: "🎒", MAGIC_ITEM: "✨",
};

export const ITEM_TYPES = ["WEAPON", "ARMOR", "CONSUMABLE", "TOOL", "GEAR", "MAGIC_ITEM"];

// ── Standard combat actions ───────────────────────────────────────────────────

export const STANDARD_ACTIONS = [
  { name: "Attack",    actionType: "ACTION",   category: "ATTACK",    description: "Make one melee or ranged weapon attack." },
  { name: "Dodge",     actionType: "ACTION",   category: "DEFENSIVE", description: "Until your next turn, attacks against you have disadvantage if you can see the attacker, and you have advantage on Dex saves." },
  { name: "Dash",      actionType: "ACTION",   category: "MOVEMENT",  description: "You gain extra movement equal to your speed for the current turn." },
  { name: "Disengage", actionType: "ACTION",   category: "MOVEMENT",  description: "Your movement doesn't provoke opportunity attacks for the rest of the turn." },
  { name: "Help",      actionType: "ACTION",   category: "SUPPORT",   description: "Aid another creature. They gain advantage on the next ability check or attack roll for that task." },
  { name: "Hide",      actionType: "ACTION",   category: "UTILITY",   description: "Make a Stealth check to hide from creatures that can't see you clearly." },
  { name: "Ready",     actionType: "REACTION", category: "UTILITY",   description: "Prepare an action to trigger on a specific event before your next turn." },
  { name: "Grapple",   actionType: "ACTION",   category: "ATTACK",    description: "Make an Athletics check contested by the target's Athletics or Acrobatics to grapple them." },
  { name: "Shove",     actionType: "ACTION",   category: "ATTACK",    description: "Make an Athletics check to push a creature 5 ft away or knock it prone." },
];

// ── D&D languages ─────────────────────────────────────────────────────────────

export const COMMON_LANGUAGES = [
  "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin",
  "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech",
  "Infernal", "Primordial", "Sylvan", "Undercommon",
];
