import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.STORAGE_PRISMA_DATABASE_URL;
if (!connectionString) throw new Error("Missing STORAGE_PRISMA_DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

// ── Types ─────────────────────────────────────────────────────────────────────

type SpellCategory =
  | "DAMAGING"
  | "HEALING"
  | "CONTROL"
  | "BUFF"
  | "DEBUFF"
  | "UTILITY"
  | "DEFENSE";

type ActionCategory =
  | "ATTACK"
  | "DAMAGING"
  | "HEALING"
  | "SUPPORT"
  | "DEFENSIVE"
  | "MOVEMENT"
  | "UTILITY";

type ActionType =
  | "ACTION"
  | "BONUS_ACTION"
  | "REACTION"
  | "FREE"
  | "PASSIVE";

interface FeatureClassification {
  combatUsable: boolean;
  actionType:   ActionType;
  category:     ActionCategory | null;
}

// ── Spell heuristic ───────────────────────────────────────────────────────────

function categorizeSpell(
  name: string,
  school: string,
  description: string
): SpellCategory {
  const d = description.toLowerCase();
  const s = school.toLowerCase();
  const n = name.toLowerCase();

  // HEALING — check first, high confidence keywords
  if (
    d.includes("regain") ||
    d.includes("restore hit points") ||
    d.includes("heals") ||
    (d.includes("hit points") && (d.includes("gain") || d.includes("recover")))
  ) return "HEALING";

  // CONTROL — immobilization and status effects
  if (
    d.includes("restrained") ||
    d.includes("incapacitated") ||
    d.includes("paralyzed") ||
    d.includes("petrified") ||
    d.includes("stunned") ||
    d.includes("unconscious") ||
    d.includes("fall asleep") ||
    d.includes("falls unconscious") ||
    n.includes("hold ") ||
    n.includes("sleep") ||
    n.includes("entangle") ||
    n.includes("web") ||
    n.includes("hypnotic")
  ) return "CONTROL";

  // DEFENSE — abjuration school or damage reduction language
  if (
    s === "abjuration" ||
    d.includes("reduce the damage") ||
    d.includes("resistance to") ||
    d.includes("immunity to") ||
    d.includes("protected from") ||
    n.includes("shield") ||
    n.includes("ward") ||
    n.includes("armor") ||
    n.includes("protection")
  ) return "DEFENSE";

  // DEBUFF — weakens enemies without direct damage
  if (
    d.includes("disadvantage on attack") ||
    d.includes("disadvantage on ability") ||
    d.includes("disadvantage on saving") ||
    d.includes("cursed") ||
    n.includes("bane") ||
    n.includes("hex") ||
    n.includes("faerie fire") ||
    n.includes("bestow curse") ||
    n.includes("slow")
  ) return "DEBUFF";

  // BUFF — enhances allies
  if (
    d.includes("advantage on attack") ||
    d.includes("advantage on ability") ||
    d.includes("advantage on saving") ||
    d.includes("bonus to attack") ||
    d.includes("bonus to damage") ||
    d.includes("add your spellcasting") ||
    (s === "enchantment" && d.includes("willing creature")) ||
    n.includes("bless") ||
    n.includes("haste") ||
    n.includes("enlarge") ||
    n.includes("heroism") ||
    n.includes("aid")
  ) return "BUFF";

  // DAMAGING — deals damage to targets
  if (
    (d.includes("takes") && d.includes("damage")) ||
    (d.includes("deal") && d.includes("damage")) ||
    (d.includes("suffering") && d.includes("damage")) ||
    (s === "evocation" && d.includes("damage")) ||
    (s === "necromancy" && d.includes("damage"))
  ) return "DAMAGING";

  // Default fallback
  return "UTILITY";
}

// ── Feature heuristic ─────────────────────────────────────────────────────────

const PASSIVE_KEYWORDS = [
  "proficiency with",
  "proficiency in",
  "you can speak",
  "you can read",
  "darkvision",
  "you gain a +",
  "saving throw",
  "you are immune",
  "you have resistance",
  "you have advantage on saving",
  "you have advantage on ability",
  "you cannot be",
  "you can't be",
  "whenever you make a",
  "increases by",
  "you learn",
  "you know",
  "starting at",
  "beginning at",
  "at 1st level",
];

const ACTION_KEYWORDS   = ["as an action",     "you can use your action",     "you use your action"];
const BONUS_KEYWORDS    = ["as a bonus action", "you can use your bonus action","you use your bonus action"];
const REACTION_KEYWORDS = ["as a reaction",     "you can use your reaction",   "you use your reaction"];
const FREE_KEYWORDS     = ["no action required","free action"];

function categorizeFeature(
  name: string,
  description: string
): FeatureClassification {
  const d = description.toLowerCase();
  const n = name.toLowerCase();

  const hasPassiveKeyword = PASSIVE_KEYWORDS.some((kw) => d.includes(kw));
  const hasActionKeyword  = [
    ...ACTION_KEYWORDS,
    ...BONUS_KEYWORDS,
    ...REACTION_KEYWORDS,
    ...FREE_KEYWORDS,
  ].some((kw) => d.includes(kw));

  // Passive if no action keyword, or passive keyword without action keyword
  if (hasPassiveKeyword && !hasActionKeyword) {
    return { combatUsable: false, actionType: "PASSIVE", category: null };
  }
  if (!hasActionKeyword) {
    return { combatUsable: false, actionType: "PASSIVE", category: null };
  }

  // Determine action type
  let actionType: ActionType = "ACTION";
  if (BONUS_KEYWORDS.some((kw)    => d.includes(kw))) actionType = "BONUS_ACTION";
  else if (REACTION_KEYWORDS.some((kw) => d.includes(kw))) actionType = "REACTION";
  else if (FREE_KEYWORDS.some((kw)    => d.includes(kw))) actionType = "FREE";

  // Determine category
  let category: ActionCategory = "UTILITY";

  if (
    d.includes("attack roll") ||
    d.includes("make a melee") ||
    d.includes("make a ranged") ||
    d.includes("make one attack") ||
    d.includes("make two attacks") ||
    n.includes("attack")
  ) {
    category = "ATTACK";
  } else if (
    (d.includes("damage") && !d.includes("reduce")) ||
    n.includes("smite") ||
    n.includes("sneak attack") ||
    n.includes("fury") ||
    n.includes("strike")
  ) {
    category = "DAMAGING";
  } else if (
    d.includes("regain") ||
    d.includes("restore hit points") ||
    d.includes("heals") ||
    n.includes("healing") ||
    n.includes("lay on hands") ||
    n.includes("second wind")
  ) {
    category = "HEALING";
  } else if (
    d.includes("reduce the damage") ||
    d.includes("resistance to") ||
    d.includes("immunity to") ||
    d.includes("protected") ||
    n.includes("defense") ||
    n.includes("guard") ||
    n.includes("deflect")
  ) {
    category = "DEFENSIVE";
  } else if (
    d.includes("advantage") ||
    (d.includes("add") && d.includes("die")) ||
    d.includes("inspiration") ||
    d.includes("help") ||
    n.includes("bardic inspiration") ||
    n.includes("channel divinity") ||
    n.includes("maneuver")
  ) {
    category = "SUPPORT";
  } else if (
    d.includes("movement speed") ||
    d.includes("speed increases") ||
    d.includes("teleport") ||
    d.includes("move through") ||
    n.includes("dash") ||
    n.includes("step of the wind") ||
    n.includes("misty step")
  ) {
    category = "MOVEMENT";
  }

  return { combatUsable: true, actionType, category };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎲 Nat20 — Heuristic Category Seed");
  console.log("====================================\n");

  // ── 1. Categorize spells ──────────────────────────────────────────────────

  const spells = await prisma.spell.findMany({
    where:   { category: "UTILITY" },
    select:  { id: true, name: true, school: true, description: true },
    orderBy: { name: "asc" },
  });

  console.log(`📖 Found ${spells.length} spells to categorize\n`);

  const spellResults: Record<SpellCategory, number> = {
    DAMAGING: 0, HEALING: 0, CONTROL: 0,
    BUFF: 0, DEBUFF: 0, UTILITY: 0, DEFENSE: 0,
  };

  for (const spell of spells) {
    const category = categorizeSpell(spell.name, spell.school, spell.description);
    await prisma.spell.update({ where: { id: spell.id }, data: { category } });
    spellResults[category]++;
    console.log(`  ✦ ${spell.name.padEnd(32)} → ${category}`);
  }

  console.log("\nSpell category breakdown:");
  Object.entries(spellResults)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  // ── 2. Categorize features ────────────────────────────────────────────────

  const features = await prisma.feature.findMany({
    where:   { actionType: null },
    select:  { id: true, name: true, description: true, type: true },
    orderBy: { name: "asc" },
  });

  console.log(`\n⚔️  Found ${features.length} features to categorize\n`);

  let combatUsableCount = 0;
  let passiveCount      = 0;

  const actionResults: Record<ActionCategory | "passive", number> = {
    ATTACK: 0, DAMAGING: 0, HEALING: 0, SUPPORT: 0,
    DEFENSIVE: 0, MOVEMENT: 0, UTILITY: 0, passive: 0,
  };

  for (const feature of features) {
    const result = categorizeFeature(feature.name, feature.description);

    await prisma.feature.update({
      where: { id: feature.id },
      data: {
        combatUsable: result.combatUsable,
        actionType:   result.actionType,
        category:     result.category ?? undefined,
      },
    });

    if (result.combatUsable) {
      combatUsableCount++;
      actionResults[result.category ?? "UTILITY"]++;
      console.log(`  ⚔️  ${feature.name.padEnd(32)} → ${result.category} (${result.actionType})`);
    } else {
      passiveCount++;
      actionResults["passive"]++;
      console.log(`  💤 ${feature.name.padEnd(32)} → passive`);
    }
  }

  console.log("\nFeature breakdown:");
  console.log(`  Combat usable: ${combatUsableCount}`);
  console.log(`  Passive:       ${passiveCount}`);

  if (combatUsableCount > 0) {
    console.log("\nCombat feature categories:");
    Object.entries(actionResults)
      .filter(([key, count]) => count > 0 && key !== "passive")
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log("\n====================================");
  console.log("✦ Categorization complete");
  console.log("\nTip: Review anything categorized as UTILITY manually —");
  console.log("those are most likely to be miscategorized. You can update");
  console.log("them directly in the DB or re-run after adjusting keywords.\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });