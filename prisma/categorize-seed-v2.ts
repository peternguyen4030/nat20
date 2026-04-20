import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.STORAGE_PRISMA_DATABASE_URL;
if (!connectionString) throw new Error("Missing STORAGE_PRISMA_DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

// ── Types ─────────────────────────────────────────────────────────────────────

type SpellCategory  = "DAMAGING" | "HEALING" | "CONTROL" | "BUFF" | "DEBUFF" | "UTILITY" | "DEFENSE";
type ActionCategory = "ATTACK" | "DAMAGING" | "HEALING" | "SUPPORT" | "DEFENSIVE" | "MOVEMENT" | "UTILITY";
type ActionType     = "ACTION" | "BONUS_ACTION" | "REACTION" | "FREE" | "PASSIVE";

interface FeatureClassification {
  combatUsable: boolean;
  actionType:   ActionType;
  category:     ActionCategory | null;
}

// ── Complete SRD spell override table ─────────────────────────────────────────
// Keys are the spell's index field (lowercase, hyphenated) OR name (lowercase).
// This covers all ~320 SRD spells so heuristics only run on custom content.

const SPELL_OVERRIDES: Record<string, SpellCategory> = {
  // ── Cantrips ──────────────────────────────────────────────────────────────
  "acid-splash":              "DAMAGING",
  "blade-ward":               "DEFENSE",
  "booming-blade":            "DAMAGING",
  "chill-touch":              "DAMAGING",
  "control-flames":           "UTILITY",
  "create-bonfire":           "DAMAGING",
  "dancing-lights":           "UTILITY",
  "druidcraft":               "UTILITY",
  "eldritch-blast":           "DAMAGING",
  "encode-thoughts":          "UTILITY",
  "fire-bolt":                "DAMAGING",
  "friends":                  "DEBUFF",
  "frostbite":                "DEBUFF",
  "green-flame-blade":        "DAMAGING",
  "guidance":                 "BUFF",
  "gust":                     "UTILITY",
  "infestation":              "DAMAGING",
  "light":                    "UTILITY",
  "lightning-lure":           "CONTROL",
  "mage-hand":                "UTILITY",
  "magic-stone":              "DAMAGING",
  "mending":                  "UTILITY",
  "message":                  "UTILITY",
  "mind-sliver":              "DEBUFF",
  "minor-illusion":           "UTILITY",
  "mold-earth":               "UTILITY",
  "on-off":                   "UTILITY",
  "poison-spray":             "DAMAGING",
  "prestidigitation":         "UTILITY",
  "primal-savagery":          "DAMAGING",
  "produce-flame":            "DAMAGING",
  "ray-of-frost":             "DEBUFF",
  "resistance":               "BUFF",
  "sacred-flame":             "DAMAGING",
  "shape-water":              "UTILITY",
  "shillelagh":               "BUFF",
  "shocking-grasp":           "DAMAGING",
  "spare-the-dying":          "UTILITY",
  "sword-burst":              "DAMAGING",
  "thaumaturgy":              "UTILITY",
  "thunderclap":              "DAMAGING",
  "toll-the-dead":            "DAMAGING",
  "true-strike":              "BUFF",
  "vicious-mockery":          "DEBUFF",
  "virtue":                   "BUFF",
  "word-of-radiance":         "DAMAGING",

  // ── Level 1 ───────────────────────────────────────────────────────────────
  "alarm":                    "UTILITY",
  "animal-friendship":        "CONTROL",
  "armor-of-agathys":         "DEFENSE",
  "arms-of-hadar":            "CONTROL",
  "bane":                     "DEBUFF",
  "bless":                    "BUFF",
  "burning-hands":            "DAMAGING",
  "catapult":                 "DAMAGING",
  "cause-fear":               "DEBUFF",
  "ceremonial":               "UTILITY",
  "chaos-bolt":               "DAMAGING",
  "charm-person":             "CONTROL",
  "chromatic-orb":            "DAMAGING",
  "color-spray":              "CONTROL",
  "command":                  "CONTROL",
  "compelled-duel":           "CONTROL",
  "comprehend-languages":     "UTILITY",
  "create-or-destroy-water":  "UTILITY",
  "cure-wounds":              "HEALING",
  "detect-evil-and-good":     "UTILITY",
  "detect-magic":             "UTILITY",
  "detect-poison-and-disease":"UTILITY",
  "disguise-self":            "UTILITY",
  "dissonant-whispers":       "CONTROL",
  "divine-favor":             "BUFF",
  "earth-tremor":             "CONTROL",
  "ensnaring-strike":         "CONTROL",
  "entangle":                 "CONTROL",
  "expeditious-retreat":      "BUFF",
  "faerie-fire":              "DEBUFF",
  "false-life":               "DEFENSE",
  "feather-fall":             "UTILITY",
  "find-familiar":            "UTILITY",
  "fog-cloud":                "CONTROL",
  "goodberry":                "HEALING",
  "grease":                   "CONTROL",
  "guiding-bolt":             "DAMAGING",
  "hail-of-thorns":           "DAMAGING",
  "healing-word":             "HEALING",
  "hellish-rebuke":           "DAMAGING",
  "heroism":                  "BUFF",
  "hex":                      "DEBUFF",
  "hunter-s-mark":            "BUFF",
  "hunters-mark":             "BUFF",
  "ice-knife":                "DAMAGING",
  "identify":                 "UTILITY",
  "illusory-script":          "UTILITY",
  "inflict-wounds":           "DAMAGING",
  "jim-s-magic-missile":      "DAMAGING",
  "jump":                     "BUFF",
  "longstrider":              "BUFF",
  "mage-armor":               "DEFENSE",
  "magic-missile":            "DAMAGING",
  "protection-from-evil-and-good": "DEFENSE",
  "purify-food-and-drink":    "UTILITY",
  "ray-of-sickness":          "DEBUFF",
  "sanctuary":                "DEFENSE",
  "searing-smite":            "DAMAGING",
  "shield":                   "DEFENSE",
  "shield-of-faith":          "DEFENSE",
  "silent-image":             "UTILITY",
  "sleep":                    "CONTROL",
  "snare":                    "CONTROL",
  "speak-with-animals":       "UTILITY",
  "tasha-s-caustic-brew":     "DEBUFF",
  "tashas-caustic-brew":      "DEBUFF",
  "tenser-s-floating-disk":   "UTILITY",
  "tensers-floating-disk":    "UTILITY",
  "thunderous-smite":         "DAMAGING",
  "thunderwave":              "DAMAGING",
  "unseen-servant":           "UTILITY",
  "witch-bolt":               "DAMAGING",
  "wrathful-smite":           "DEBUFF",
  "zephyr-strike":            "BUFF",

  // ── Level 2 ───────────────────────────────────────────────────────────────
  "acid-arrow":               "DAMAGING",
  "aganazzars-scorcher":      "DAMAGING",
  "aid":                      "BUFF",
  "alter-self":               "UTILITY",
  "animal-messenger":         "UTILITY",
  "arcane-lock":              "UTILITY",
  "augury":                   "UTILITY",
  "barkskin":                 "DEFENSE",
  "beast-sense":              "UTILITY",
  "blindness-deafness":       "DEBUFF",
  "blur":                     "DEFENSE",
  "branding-smite":           "DAMAGING",
  "calm-emotions":            "CONTROL",
  "cloud-of-daggers":         "DAMAGING",
  "continual-flame":          "UTILITY",
  "cordon-of-arrows":         "DAMAGING",
  "crown-of-madness":         "CONTROL",
  "darkness":                 "CONTROL",
  "darkvision":               "BUFF",
  "detect-thoughts":          "UTILITY",
  "dragons-breath":           "DAMAGING",
  "dust-devil":               "CONTROL",
  "earthbind":                "CONTROL",
  "enhance-ability":          "BUFF",
  "enlarge-reduce":           "BUFF",
  "enthrall":                 "CONTROL",
  "find-steed":               "UTILITY",
  "find-traps":               "UTILITY",
  "flame-blade":              "DAMAGING",
  "flaming-sphere":           "DAMAGING",
  "fortune-s-favor":          "BUFF",
  "fortunes-favor":           "BUFF",
  "gentle-repose":            "UTILITY",
  "gift-of-gab":              "UTILITY",
  "gust-of-wind":             "CONTROL",
  "healing-spirit":           "HEALING",
  "heat-metal":               "DAMAGING",
  "hold-person":              "CONTROL",
  "icingdeath-s-frost":       "DAMAGING",
  "icicle":                   "DAMAGING",
  "invisibility":             "UTILITY",
  "jim-s-glowing-coin":       "UTILITY",
  "knock":                    "UTILITY",
  "levitate":                 "CONTROL",
  "locate-animals-or-plants": "UTILITY",
  "locate-object":            "UTILITY",
  "magic-mouth":              "UTILITY",
  "magic-weapon":             "BUFF",
  "maximilians-earthen-grasp":"CONTROL",
  "melf-s-acid-arrow":        "DAMAGING",
  "melfs-acid-arrow":         "DAMAGING",
  "mind-spike":               "DEBUFF",
  "mirror-image":             "DEFENSE",
  "misty-step":               "UTILITY",
  "moonbeam":                 "DAMAGING",
  "nathairs-mischief":        "CONTROL",
  "nystuls-magic-aura":       "UTILITY",
  "pass-without-trace":       "BUFF",
  "prayer-of-healing":        "HEALING",
  "protection-from-poison":   "DEFENSE",
  "pyrotechnics":             "CONTROL",
  "ray-of-enfeeblement":      "DEBUFF",
  "rope-trick":               "UTILITY",
  "scorching-ray":            "DAMAGING",
  "see-invisibility":         "UTILITY",
  "shadow-blade":             "DAMAGING",
  "shatter":                  "DAMAGING",
  "silence":                  "CONTROL",
  "skywrite":                 "UTILITY",
  "snillocs-snowball-swarm":  "DAMAGING",
  "spider-climb":             "BUFF",
  "spike-growth":             "CONTROL",
  "spiritual-weapon":         "DAMAGING",
  "suggestion":               "CONTROL",
  "summon-beast":             "UTILITY",
  "tasha-s-mind-whip":        "DEBUFF",
  "tashas-mind-whip":         "DEBUFF",
  "warding-bond":             "DEFENSE",
  "warding-wind":             "DEFENSE",
  "web":                      "CONTROL",
  "wristpocket":              "UTILITY",
  "zone-of-truth":            "CONTROL",

  // ── Level 3 ───────────────────────────────────────────────────────────────
  "animate-dead":             "UTILITY",
  "aura-of-vitality":         "HEALING",
  "beacon-of-hope":           "BUFF",
  "bestow-curse":             "DEBUFF",
  "blinding-smite":           "DAMAGING",
  "blink":                    "DEFENSE",
  "call-lightning":           "DAMAGING",
  "catnap":                   "UTILITY",
  "clairvoyance":             "UTILITY",
  "conjure-animals":          "UTILITY",
  "conjure-barrage":          "DAMAGING",
  "conjure-lesser-demons":    "UTILITY",
  "counterspell":             "DEFENSE",
  "create-food-and-water":    "UTILITY",
  "crusaders-mantle":         "BUFF",
  "daylight":                 "UTILITY",
  "dispel-magic":             "UTILITY",
  "elemental-weapon":         "BUFF",
  "enemies-abound":           "CONTROL",
  "erupting-earth":           "DAMAGING",
  "fear":                     "CONTROL",
  "feign-death":              "UTILITY",
  "fireball":                 "DAMAGING",
  "flame-arrows":             "BUFF",
  "fly":                      "BUFF",
  "gaseous-form":             "UTILITY",
  "glyph-of-warding":         "DAMAGING",
  "haste":                    "BUFF",
  "hunger-of-hadar":          "CONTROL",
  "hypnotic-pattern":         "CONTROL",
  "incite-greed":             "CONTROL",
  "intellect-fortress":       "DEFENSE",
  "leomund-s-tiny-hut":       "UTILITY",
  "leomunds-tiny-hut":        "UTILITY",
  "life-transference":        "HEALING",
  "lightning-arrow":          "DAMAGING",
  "lightning-bolt":           "DAMAGING",
  "magic-circle":             "CONTROL",
  "major-image":              "UTILITY",
  "mass-healing-word":        "HEALING",
  "meld-into-stone":          "UTILITY",
  "melf-s-minute-meteors":    "DAMAGING",
  "melfs-minute-meteors":     "DAMAGING",
  "nondetection":             "UTILITY",
  "phantom-steed":            "UTILITY",
  "plant-growth":             "CONTROL",
  "protection-from-energy":   "DEFENSE",
  "pulse-wave":               "DAMAGING",
  "remove-curse":             "UTILITY",
  "revivify":                 "HEALING",
  "sending":                  "UTILITY",
  "sleet-storm":              "CONTROL",
  "slow":                     "CONTROL",
  "speak-with-dead":          "UTILITY",
  "speak-with-plants":        "UTILITY",
  "spirit-guardians":         "DAMAGING",
  "spirit-shroud":            "BUFF",
  "stinking-cloud":           "CONTROL",
  "summon-fey":               "UTILITY",
  "summon-lesser-demons":     "UTILITY",
  "summon-shadowspawn":       "UTILITY",
  "summon-undead":            "UTILITY",
  "tidal-wave":               "DAMAGING",
  "tiny-servant":             "UTILITY",
  "tongues":                  "UTILITY",
  "vampiric-touch":           "DAMAGING",
  "wall-of-sand":             "CONTROL",
  "wall-of-water":            "CONTROL",
  "water-breathing":          "UTILITY",
  "water-walk":               "UTILITY",
  "wind-wall":                "CONTROL",

  // ── Level 4 ───────────────────────────────────────────────────────────────
  "arcane-eye":               "UTILITY",
  "aura-of-life":             "DEFENSE",
  "aura-of-purity":           "DEFENSE",
  "banishment":               "CONTROL",
  "blight":                   "DAMAGING",
  "charm-monster":            "CONTROL",
  "compulsion":               "CONTROL",
  "confusion":                "CONTROL",
  "conjure-minor-elementals": "UTILITY",
  "conjure-woodland-beings":  "UTILITY",
  "control-water":            "CONTROL",
  "death-ward":               "DEFENSE",
  "dimension-door":           "UTILITY",
  "divination":               "UTILITY",
  "dominate-beast":           "CONTROL",
  "elemental-bane":           "DEBUFF",
  "evard-s-black-tentacles":  "CONTROL",
  "evards-black-tentacles":   "CONTROL",
  "fabricate":                "UTILITY",
  "find-greater-steed":       "UTILITY",
  "fire-shield":              "DEFENSE",
  "freedom-of-movement":      "BUFF",
  "grasping-vine":            "CONTROL",
  "greater-invisibility":     "BUFF",
  "guardian-of-faith":        "DAMAGING",
  "hallucinatory-terrain":    "UTILITY",
  "ice-storm":                "DAMAGING",
  "leomund-s-secret-chest":   "UTILITY",
  "leomunds-secret-chest":    "UTILITY",
  "locate-creature":          "UTILITY",
  "mordenkainen-s-faithful-hound": "UTILITY",
  "mordenkainens-faithful-hound":  "UTILITY",
  "mordenkainen-s-private-sanctum":"UTILITY",
  "otiluke-s-resilient-sphere":    "CONTROL",
  "otilukes-resilient-sphere":     "CONTROL",
  "phantasmal-killer":        "DAMAGING",
  "polymorph":                "CONTROL",
  "staggering-smite":         "DAMAGING",
  "stone-shape":              "UTILITY",
  "stoneskin":                "DEFENSE",
  "storm-sphere":             "DAMAGING",
  "summon-aberration":        "UTILITY",
  "summon-construct":         "UTILITY",
  "summon-elemental":         "UTILITY",
  "summon-greater-demon":     "UTILITY",
  "vitriolic-sphere":         "DAMAGING",
  "wall-of-fire":             "DAMAGING",
  "watery-sphere":            "CONTROL",

  // ── Level 5 ───────────────────────────────────────────────────────────────
  "animate-objects":          "DAMAGING",
  "antilife-shell":           "CONTROL",
  "awaken":                   "UTILITY",
  "banishing-smite":          "CONTROL",
  "bigby-s-hand":             "DAMAGING",
  "bigbys-hand":              "DAMAGING",
  "circle-of-power":          "BUFF",
  "cloudkill":                "DAMAGING",
  "commune":                  "UTILITY",
  "commune-with-nature":      "UTILITY",
  "cone-of-cold":             "DAMAGING",
  "conjure-elemental":        "UTILITY",
  "conjure-volley":           "DAMAGING",
  "contact-other-plane":      "UTILITY",
  "contagion":                "DEBUFF",
  "control-winds":            "CONTROL",
  "creation":                 "UTILITY",
  "danse-macabre":            "UTILITY",
  "dawn":                     "DAMAGING",
  "destructive-wave":         "DAMAGING",
  "dispel-evil-and-good":     "DEFENSE",
  "dominate-person":          "CONTROL",
  "dream":                    "UTILITY",
  "enervation":               "DAMAGING",
  "far-step":                 "UTILITY",
  "flame-strike":             "DAMAGING",
  "forcecage":                "CONTROL",
  "geas":                     "CONTROL",
  "greater-restoration":      "HEALING",
  "hallow":                   "UTILITY",
  "hold-monster":             "CONTROL",
  "holy-weapon":              "BUFF",
  "immolation":               "DAMAGING",
  "infernal-calling":         "UTILITY",
  "insect-plague":            "DAMAGING",
  "legend-lore":              "UTILITY",
  "maelstrom":                "CONTROL",
  "mass-cure-wounds":         "HEALING",
  "mislead":                  "UTILITY",
  "modify-memory":            "CONTROL",
  "negative-energy-flood":    "DAMAGING",
  "passwall":                 "UTILITY",
  "planar-binding":           "CONTROL",
  "raise-dead":               "HEALING",
  "rary-s-telepathic-bond":   "UTILITY",
  "rarys-telepathic-bond":    "UTILITY",
  "reincarnate":              "HEALING",
  "scrying":                  "UTILITY",
  "seeming":                  "UTILITY",
  "skill-empowerment":        "BUFF",
  "steel-wind-strike":        "DAMAGING",
  "summon-celestial":         "UTILITY",
  "summon-draconic-spirit":   "UTILITY",
  "swift-quiver":             "BUFF",
  "synaptic-static":          "DEBUFF",
  "telekinesis":              "CONTROL",
  "telepathy":                "UTILITY",
  "teleportation-circle":     "UTILITY",
  "transmute-rock":           "CONTROL",
  "tree-stride":              "UTILITY",
  "wall-of-force":            "CONTROL",
  "wall-of-stone":            "CONTROL",
  "wrath-of-nature":          "DAMAGING",

  // ── Level 6 ───────────────────────────────────────────────────────────────
  "arcane-gate":              "UTILITY",
  "blade-barrier":            "DAMAGING",
  "bones-of-the-earth":       "CONTROL",
  "chain-lightning":          "DAMAGING",
  "circle-of-death":          "DAMAGING",
  "conjure-fey":              "UTILITY",
  "contingency":              "UTILITY",
  "create-homunculus":        "UTILITY",
  "create-undead":            "UTILITY",
  "disintegrate":             "DAMAGING",
  "drawmij-s-instant-summons":"UTILITY",
  "drawmijs-instant-summons": "UTILITY",
  "druid-grove":              "UTILITY",
  "eyebite":                  "CONTROL",
  "find-the-path":            "UTILITY",
  "flesh-to-stone":           "CONTROL",
  "forbiddance":              "UTILITY",
  "globe-of-invulnerability": "DEFENSE",
  "guards-and-wards":         "UTILITY",
  "harm":                     "DEBUFF",
  "heal":                     "HEALING",
  "heroes-feast":             "BUFF",
  "investiture-of-flame":     "DAMAGING",
  "investiture-of-ice":       "CONTROL",
  "investiture-of-stone":     "DEFENSE",
  "investiture-of-wind":      "UTILITY",
  "magic-jar":                "CONTROL",
  "mass-suggestion":          "CONTROL",
  "mental-prison":            "CONTROL",
  "move-earth":               "CONTROL",
  "otiluke-s-freezing-sphere":"DAMAGING",
  "otilukes-freezing-sphere": "DAMAGING",
  "otto-s-irresistible-dance":"CONTROL",
  "ottos-irresistible-dance": "CONTROL",
  "planar-ally":              "UTILITY",
  "primordial-ward":          "DEFENSE",
  "programmed-illusion":      "UTILITY",
  "scatter":                  "CONTROL",
  "soul-cage":                "UTILITY",
  "sunbeam":                  "DAMAGING",
  "tasha-s-otherworldly-guise":"BUFF",
  "tashas-otherworldly-guise":"BUFF",
  "tenser-s-transformation":  "BUFF",
  "tensers-transformation":   "BUFF",
  "transport-via-plants":     "UTILITY",
  "true-seeing":              "BUFF",
  "wall-of-ice":              "CONTROL",
  "wall-of-thorns":           "CONTROL",
  "wind-walk":                "UTILITY",
  "word-of-recall":           "UTILITY",

  // ── Level 7 ───────────────────────────────────────────────────────────────
  "conjure-celestial":        "UTILITY",
  "delayed-blast-fireball":   "DAMAGING",
  "divine-word":              "CONTROL",
  "etherealness":             "UTILITY",
  "finger-of-death":          "DAMAGING",
  "fire-storm":               "DAMAGING",
  "forcecage-2":              "CONTROL",
  "mirage-arcane":            "UTILITY",
  "mordenkainen-s-magnificent-mansion":"UTILITY",
  "mordenkainens-magnificent-mansion": "UTILITY",
  "mordenkainen-s-sword":     "DAMAGING",
  "mordenkainens-sword":      "DAMAGING",
  "plane-shift":              "CONTROL",
  "power-word-pain":          "DEBUFF",
  "prismatic-spray":          "DAMAGING",
  "project-image":            "UTILITY",
  "regenerate":               "HEALING",
  "resurrection":             "HEALING",
  "reverse-gravity":          "CONTROL",
  "sequester":                "UTILITY",
  "simulacrum":               "UTILITY",
  "symbol":                   "CONTROL",
  "teleport":                 "UTILITY",
  "whirlwind":                "DAMAGING",

  // ── Level 8 ───────────────────────────────────────────────────────────────
  "abi-dalzims-horrid-wilting":"DAMAGING",
  "animal-shapes":            "CONTROL",
  "antimagic-field":          "CONTROL",
  "antipathy-sympathy":       "CONTROL",
  "clone":                    "UTILITY",
  "control-weather":          "UTILITY",
  "demiplane":                "UTILITY",
  "dominate-monster":         "CONTROL",
  "earthquake":               "CONTROL",
  "feeblemind":               "DEBUFF",
  "glibness":                 "BUFF",
  "holy-aura":                "DEFENSE",
  "illusory-dragon":          "DAMAGING",
  "incendiary-cloud":         "DAMAGING",
  "maddening-darkness":       "DAMAGING",
  "maze":                     "CONTROL",
  "mind-blank":               "DEFENSE",
  "power-word-stun":          "CONTROL",
  "sunburst":                 "DAMAGING",
  "telepathy-2":              "UTILITY",
  "trap-the-soul":            "CONTROL",

  // ── Level 9 ───────────────────────────────────────────────────────────────
  "astral-projection":        "UTILITY",
  "foresight":                "BUFF",
  "gate":                     "UTILITY",
  "imprisonment":             "CONTROL",
  "invulnerability":          "DEFENSE",
  "mass-heal":                "HEALING",
  "mass-polymorph":           "CONTROL",
  "meteor-swarm":             "DAMAGING",
  "power-word-heal":          "HEALING",
  "power-word-kill":          "DAMAGING",
  "prismatic-wall":           "CONTROL",
  "psychic-scream":           "DAMAGING",
  "shapechange":              "UTILITY",
  "storm-of-vengeance":       "DAMAGING",
  "time-stop":                "CONTROL",
  "true-polymorph":           "CONTROL",
  "true-resurrection":        "HEALING",
  "weird":                    "DAMAGING",
  "wish":                     "UTILITY",
};

// ── Fallback heuristic — only runs for custom/homebrew spells ─────────────────

function categorizeSpellHeuristic(
  name:        string,
  school:      string,
  description: string,
): SpellCategory {
  const d = description.toLowerCase();
  const s = school.toLowerCase();

  // HEALING — specific phrasing only, avoid false positives
  if (/regains? \d+d\d+ hit points/.test(d))  return "HEALING";
  if (/restores? \d+d\d+ hit points/.test(d)) return "HEALING";
  if (/heals \d+d\d+/.test(d))                return "HEALING";

  // CONTROL — removes agency
  const controlConditions = ["restrained", "incapacitated", "paralyzed", "petrified", "stunned", "falls unconscious", "fall asleep"];
  if (controlConditions.some((c) => d.includes(c))) return "CONTROL";
  if (/can't (move|take actions|take reactions)/.test(d)) return "CONTROL";

  // DEBUFF — weakens without removing agency
  if (d.includes("disadvantage on attack rolls"))        return "DEBUFF";
  if (d.includes("disadvantage on saving throws"))       return "DEBUFF";
  if (d.includes("disadvantage on ability checks"))      return "DEBUFF";

  // BUFF — enhances allies
  if (d.includes("advantage on attack rolls"))           return "BUFF";
  if (d.includes("advantage on saving throws"))          return "BUFF";
  if (d.includes("bonus to attack rolls"))               return "BUFF";

  // DEFENSE — abjuration that doesn't deal damage
  if (s === "abjuration" && !/\d+d\d+.*damage/.test(d)) return "DEFENSE";

  // DAMAGING — explicit damage dice
  if (/\d+d\d+.*damage/.test(d) || /(evocation|necromancy)/.test(s) && d.includes("damage")) return "DAMAGING";

  return "UTILITY";
}

function categorizeSpell(index: string, name: string, school: string, description: string): SpellCategory {
  // Normalize index — try exact match first, then strip punctuation variants
  const normalized = index.toLowerCase().replace(/['']/g, "-").replace(/\s+/g, "-");
  if (SPELL_OVERRIDES[normalized])                     return SPELL_OVERRIDES[normalized];
  if (SPELL_OVERRIDES[name.toLowerCase()])             return SPELL_OVERRIDES[name.toLowerCase()];
  // Try without apostrophe variations
  const stripped = normalized.replace(/[^a-z0-9-]/g, "");
  const found = Object.entries(SPELL_OVERRIDES).find(([k]) => k.replace(/[^a-z0-9-]/g, "") === stripped);
  if (found) return found[1];
  // Fall back to heuristic for homebrew / custom spells
  return categorizeSpellHeuristic(name, school, description);
}

// ── Feature categorization (unchanged from original) ─────────────────────────

const PASSIVE_KEYWORDS = [
  "proficiency with", "proficiency in", "you can speak", "you can read",
  "darkvision", "you gain a +", "saving throw", "you are immune",
  "you have resistance", "you have advantage on saving", "you have advantage on ability",
  "you cannot be", "you can't be", "whenever you make a", "increases by",
  "you learn", "you know", "starting at", "beginning at", "at 1st level",
];

const ACTION_KEYWORDS   = ["as an action",     "you can use your action",     "you use your action"];
const BONUS_KEYWORDS    = ["as a bonus action", "you can use your bonus action","you use your bonus action"];
const REACTION_KEYWORDS = ["as a reaction",     "you can use your reaction",   "you use your reaction"];
const FREE_KEYWORDS     = ["no action required", "free action"];

function categorizeFeature(name: string, description: string): FeatureClassification {
  const d = description.toLowerCase();
  const n = name.toLowerCase();

  const hasActionKeyword = [...ACTION_KEYWORDS, ...BONUS_KEYWORDS, ...REACTION_KEYWORDS, ...FREE_KEYWORDS].some((kw) => d.includes(kw));
  const hasPassiveOnly   = PASSIVE_KEYWORDS.some((kw) => d.includes(kw)) && !hasActionKeyword;

  if (!hasActionKeyword || hasPassiveOnly) {
    return { combatUsable: false, actionType: "PASSIVE", category: null };
  }

  const actionType: ActionType =
    BONUS_KEYWORDS.some((kw)    => d.includes(kw)) ? "BONUS_ACTION" :
    REACTION_KEYWORDS.some((kw) => d.includes(kw)) ? "REACTION" :
    FREE_KEYWORDS.some((kw)     => d.includes(kw)) ? "FREE" :
    "ACTION";

  let category: ActionCategory = "UTILITY";

  if (d.includes("attack roll") || d.includes("make a melee") || d.includes("make a ranged") || n.includes("attack")) {
    category = "ATTACK";
  } else if ((d.includes("damage") && !d.includes("reduce")) || n.includes("smite") || n.includes("sneak attack") || n.includes("fury") || n.includes("strike")) {
    category = "DAMAGING";
  } else if (d.includes("regain") && d.includes("hit points") || d.includes("restore hit points") || n.includes("healing") || n.includes("lay on hands") || n.includes("second wind")) {
    category = "HEALING";
  } else if (d.includes("reduce the damage") || d.includes("resistance to") || n.includes("defense") || n.includes("deflect") || n.includes("uncanny dodge") || n.includes("evasion")) {
    category = "DEFENSIVE";
  } else if (d.includes("inspiration") || d.includes("add") && d.includes("die") || n.includes("bardic inspiration") || n.includes("maneuver")) {
    category = "SUPPORT";
  } else if (d.includes("movement speed") || d.includes("teleport") || n.includes("dash") || n.includes("cunning action")) {
    category = "MOVEMENT";
  }

  return { combatUsable: true, actionType, category };
}

// ── Reporting ─────────────────────────────────────────────────────────────────

function printBar(counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .forEach(([k, n]) => {
      const bar = "█".repeat(Math.round((n / total) * 24));
      console.log(`  ${k.padEnd(16)} ${String(n).padStart(4)}  ${bar}`);
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎲 Nat20 — Spell & Feature Categorization");
  console.log("==========================================\n");

  // Spells
  const spells = await prisma.spell.findMany({
    select:  { id: true, name: true, index: true, school: true, description: true },
    orderBy: { name: "asc" },
  });
  console.log(`📖 Processing ${spells.length} spells...`);

  const spellCounts: Record<SpellCategory, number> = { DAMAGING: 0, HEALING: 0, CONTROL: 0, BUFF: 0, DEBUFF: 0, UTILITY: 0, DEFENSE: 0 };
  const heuristicFallbacks: string[] = [];

  for (const spell of spells) {
    const normalized = (spell.index ?? spell.name).toLowerCase().replace(/['']/g, "-").replace(/\s+/g, "-");
    const usedOverride = !!SPELL_OVERRIDES[normalized] ||
      !!SPELL_OVERRIDES[spell.name.toLowerCase()] ||
      !!Object.entries(SPELL_OVERRIDES).find(([k]) => k.replace(/[^a-z0-9-]/g, "") === normalized.replace(/[^a-z0-9-]/g, ""));

    const category = categorizeSpell(spell.index ?? spell.name, spell.name, spell.school, spell.description);
    await prisma.spell.update({ where: { id: spell.id }, data: { category } });
    spellCounts[category]++;
    if (!usedOverride) heuristicFallbacks.push(`${spell.name} → ${category}`);
  }

  console.log("\nSpell categories:");
  printBar(spellCounts as Record<string, number>);

  if (heuristicFallbacks.length > 0) {
    console.log(`\n⚠️  ${heuristicFallbacks.length} spell(s) not in override table — heuristic used:`);
    heuristicFallbacks.forEach((s) => console.log(`   • ${s}`));
    console.log("   Add these to SPELL_OVERRIDES if incorrect.\n");
  }

  // Features
  const features = await prisma.feature.findMany({
    where:   { actionType: null },
    select:  { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  });
  console.log(`\n⚔️  Processing ${features.length} uncategorized features...`);

  const featureCounts: Record<ActionCategory | "PASSIVE", number> = { ATTACK: 0, DAMAGING: 0, HEALING: 0, SUPPORT: 0, DEFENSIVE: 0, MOVEMENT: 0, UTILITY: 0, PASSIVE: 0 };

  for (const feature of features) {
    const result = categorizeFeature(feature.name, feature.description);
    await prisma.feature.update({
      where: { id: feature.id },
      data: { combatUsable: result.combatUsable, actionType: result.actionType, category: result.category ?? undefined },
    });
    if (result.combatUsable) featureCounts[result.category ?? "UTILITY"]++;
    else featureCounts["PASSIVE"]++;
  }

  console.log("\nFeature categories:");
  printBar(featureCounts as Record<string, number>);

  console.log("\n==========================================");
  console.log("✦ Done.\n");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
