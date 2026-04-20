import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.STORAGE_PRISMA_DATABASE_URL;
if (!connectionString) throw new Error("Missing STORAGE_PRISMA_DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma  = new PrismaClient({ adapter });

// ── Dice extraction ───────────────────────────────────────────────────────────

interface DiceResult {
  damageDice:  string | null;
  damageType:  string | null;
  healingDice: string | null;
  scalingDice: string | null;
}

const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning",
  "necrotic", "piercing", "poison", "psychic", "radiant",
  "slashing", "thunder",
];

// Matches patterns like: "2d6 fire damage", "1d8 + 3 necrotic damage",
//   "deals 3d10 radiant damage", "takes 4d6 cold damage"
const DAMAGE_PATTERN = new RegExp(
  `(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?)\\s+(?:(${DAMAGE_TYPES.join("|")})\\s+)?damage`,
  "i"
);

// Matches: "regains 2d8 + 5 hit points", "heals 4d6 hit points"
const HEALING_PATTERN = /(?:regains?|restores?|heals?)\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+hit points?/i;

// Matches upcast/scaling language: "for each slot level above 1st" or
//   "increases by 1d6 for each slot level"
const SCALING_PATTERN = /(?:increases?|additional|extra|plus)\s+(\d+d\d+)(?:\s+(?:for each|per)\s+slot\s+level|\s+for each level)/i;

function extractDice(description: string, category: string): DiceResult {
  const result: DiceResult = {
    damageDice:  null,
    damageType:  null,
    healingDice: null,
    scalingDice: null,
  };

  // Healing spells — check for healing dice first
  if (category === "HEALING") {
    const healMatch = description.match(HEALING_PATTERN);
    if (healMatch) {
      result.healingDice = normalise(healMatch[1]);
    }
    // Some healing spells also deal damage (e.g. nothing in SRD, but homebrew might)
  }

  // Damage dice — skip for pure healing
  if (category !== "HEALING") {
    const dmgMatch = description.match(DAMAGE_PATTERN);
    if (dmgMatch) {
      result.damageDice = normalise(dmgMatch[1]);
      // Capture damage type if present in the match group
      const typeMatch = description.match(
        new RegExp(`(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?)\\s+(${DAMAGE_TYPES.join("|")})\\s+damage`, "i")
      );
      if (typeMatch) {
        result.damageType = typeMatch[2].toLowerCase();
      } else {
        // Try to find damage type near the dice expression
        const typeOnly = description.match(
          new RegExp(`(${DAMAGE_TYPES.join("|")})\\s+damage`, "i")
        );
        if (typeOnly) result.damageType = typeOnly[1].toLowerCase();
      }
    }
  }

  // Scaling dice (upcast bonus)
  const scaleMatch = description.match(SCALING_PATTERN);
  if (scaleMatch) {
    result.scalingDice = normalise(scaleMatch[1]);
  }

  return result;
}

// Normalise spacing around +/- modifiers: "1d8 + 3" → "1d8+3"
function normalise(dice: string): string {
  return dice.replace(/\s*([+-])\s*/g, "$1").trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎲 Nat20 — Spell Dice Backfill");
  console.log("================================\n");

  const spells = await prisma.spell.findMany({
    select:  { id: true, name: true, description: true, category: true },
    orderBy: { name: "asc" },
  });

  console.log(`Processing ${spells.length} spells...\n`);

  const counts = { damage: 0, healing: 0, scaling: 0, empty: 0 };
  const noMatch: string[] = [];

  for (const spell of spells) {
    const { damageDice, damageType, healingDice, scalingDice } =
      extractDice(spell.description, spell.category ?? "UTILITY");

    await prisma.spell.update({
      where: { id: spell.id },
      data: {
        damageDice:  damageDice  ?? null,
        damageType:  damageType  ?? null,
        healingDice: healingDice ?? null,
        scalingDice: scalingDice ?? null,
      },
    });

    const hasAny = damageDice || healingDice;
    if (damageDice)  counts.damage++;
    if (healingDice) counts.healing++;
    if (scalingDice) counts.scaling++;
    if (!hasAny)     { counts.empty++; noMatch.push(spell.name); }

    if (hasAny) {
      const parts = [];
      if (damageDice)  parts.push(`damage: ${damageDice}${damageType ? ` (${damageType})` : ""}`);
      if (healingDice) parts.push(`healing: ${healingDice}`);
      if (scalingDice) parts.push(`scaling: +${scalingDice}/slot`);
      console.log(`  ✦ ${spell.name.padEnd(36)} ${parts.join(" · ")}`);
    }
  }

  console.log(`\n================================`);
  console.log(`✓ Damage dice found:   ${counts.damage}`);
  console.log(`✓ Healing dice found:  ${counts.healing}`);
  console.log(`✓ Scaling dice found:  ${counts.scaling}`);
  console.log(`  No dice extracted:   ${counts.empty}`);

  if (noMatch.length > 0) {
    console.log(`\n⚠️  Spells with no dice extracted — likely utility/buff/control:`);
    noMatch.forEach((n) => console.log(`   • ${n}`));
  }

  console.log("\nDone. Review any damage spells in the no-match list above");
  console.log("and add manual overrides if the description phrasing is unusual.\n");
}

main()
  .catch((e) => { console.error("Backfill failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
