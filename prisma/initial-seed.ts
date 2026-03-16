import "dotenv/config";
import { PrismaClient, type ItemType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.STORAGE_PRISMA_DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing STORAGE_PRISMA_DATABASE_URL. Ensure .env is loaded.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const BASE = "https://www.dnd5eapi.co/api";

async function get<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

interface ApiAbilityBonus {
  ability_score: { index: string };
  bonus: number;
}

interface ApiTrait {
  name: string;
}

interface ApiRace {
  index: string;
  name: string;
  speed: number;
  size: string | null;
  alignment: string | null;
  ability_bonuses: ApiAbilityBonus[];
  traits: ApiTrait[] | null;
  subraces?: { index: string }[];
}

interface ApiSubrace {
  index: string;
  name: string;
  desc: string | null;
  ability_bonuses?: ApiAbilityBonus[];
}

interface ApiProficiency {
  index: string;
}

interface ApiFeature {
  index: string;
  name: string;
  desc: string | string[];
  level?: number;
}

interface ApiEquipmentCategory {
  name: string;
}

interface ApiCost {
  quantity: number;
  unit: string;
}

interface ApiDamage {
  damage_dice: string;
  damage_type: { name: string };
}

interface ApiArmorClass {
  base: number;
}

interface ApiEquipment {
  index: string;
  name: string;
  desc: string[] | null;
  equipment_category: ApiEquipmentCategory;
  weight: number | null;
  cost: ApiCost | null;
  damage?: ApiDamage;
  weapon_range?: string;
  armor_class?: ApiArmorClass;
}

// ── Races ─────────────────────────────────────────────────────────────────────

async function seedRaces() {
  console.log("🌱 Seeding races...");
  const { results } = await get<{ results: { index: string }[] }>("/races");

  for (const { index: raceIndex } of results) {
    const r = await get<ApiRace>(`/races/${raceIndex}`);

    await prisma.race.upsert({
      where: { index: r.index },
      update: {},
      create: {
        index: r.index,
        name: r.name,
        speed: r.speed,
        size: r.size,
        description: r.alignment ?? null,
        abilityBonuses: r.ability_bonuses.map((b) => ({
          ability: b.ability_score.index.toUpperCase(),
          bonus: b.bonus,
        })),
        traitNames: r.traits?.map((t) => t.name) ?? [],
      },
    });

    for (const sub of r.subraces ?? []) {
      const s = await get<ApiSubrace>(`/subraces/${sub.index}`);
      await prisma.subrace.upsert({
        where: { index: s.index },
        update: {},
        create: {
          index: s.index,
          name: s.name,
          raceId: (await prisma.race.findUniqueOrThrow({ where: { index: r.index } })).id,
          description: s.desc ?? null,
          abilityBonuses:
            s.ability_bonuses?.map((b) => ({
              ability: b.ability_score.index.toUpperCase(),
              bonus: b.bonus,
            })) ?? [],
        },
      });
    }
  }

  console.log(`   ✓ ${results.length} races seeded`);
}

// ── Classes ───────────────────────────────────────────────────────────────────

async function seedClasses() {
  console.log("🌱 Seeding classes...");
  const { results } = await get<{ results: { index: string }[] }>("/classes");

  for (const { index: classIndex } of results) {
    const c = await get<{ index: string; name: string; hit_die: number }>(`/classes/${classIndex}`);

    let spellcastingAbility: string | null = null;
    try {
      const sc = await get<{ spellcasting_ability?: { index: string } }>(
        `/classes/${classIndex}/spellcasting`
      );
      spellcastingAbility = sc.spellcasting_ability?.index?.toUpperCase() ?? null;
    } catch {
      // non-spellcasting class
    }

    await prisma.class.upsert({
      where: { index: c.index },
      update: {},
      create: {
        index: c.index,
        name: c.name,
        hitDie: c.hit_die,
        spellcastingAbility,
      },
    });

    const { results: subclassResults } = await get<{ results: { index: string }[] }>(
      `/subclasses?class=${classIndex}`
    ).catch(() => ({ results: [] }));
    for (const { index: subIndex } of subclassResults) {
      const sub = await get<{ index: string; name: string }>(`/subclasses/${subIndex}`);
      const parentClass = await prisma.class.findUniqueOrThrow({ where: { index: classIndex } });
      await prisma.subclass.upsert({
        where: { index: sub.index },
        update: {},
        create: {
          index: sub.index,
          name: sub.name,
          classId: parentClass.id,
        },
      });
    }

    const { results: featureResults } = await get<{ results: ApiFeature[] }>(
      `/classes/${classIndex}/features`
    );
    const level1Features = featureResults.filter((f) => f.level === 1);

    for (const { index: featIndex } of level1Features) {
      const feat = await get<ApiFeature>(`/features/${featIndex}`);
      const parentClass = await prisma.class.findUniqueOrThrow({ where: { index: classIndex } });

      await prisma.feature.upsert({
        where: { index: feat.index },
        update: {},
        create: {
          index: feat.index,
          name: feat.name,
          description: Array.isArray(feat.desc) ? feat.desc.join("\n") : feat.desc,
          type: "CLASS",
          classId: parentClass.id,
        },
      });
    }
  }

  console.log(`   ✓ ${results.length} classes seeded`);
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

async function seedBackgrounds() {
  console.log("🌱 Seeding backgrounds...");
  const { results } = await get<{ results: { index: string }[] }>("/backgrounds");

  for (const { index } of results) {
    const b = await get<{
      index: string;
      name: string;
      feature?: { name: string; desc: string[] };
      starting_proficiencies?: ApiProficiency[];
      language_options?: { choose: number };
    }>(`/backgrounds/${index}`);

    const skillProfs =
      b.starting_proficiencies
        ?.filter((p) => p.index.startsWith("skill-"))
        .map((p) => p.index.replace("skill-", "")) ?? [];

    await prisma.background.upsert({
      where: { index: b.index },
      update: {},
      create: {
        index: b.index,
        name: b.name,
        description: b.feature?.desc?.join("\n") ?? null,
        feature: b.feature?.name ?? null,
        skillProficiencies: skillProfs,
        languages: b.language_options?.choose ?? 0,
      },
    });
  }

  console.log(`   ✓ ${results.length} backgrounds seeded`);
}

// ── Proficiencies ─────────────────────────────────────────────────────────────

async function seedProficiencies() {
  console.log("🌱 Seeding proficiencies...");
  const { results } = await get<{ results: { index: string }[] }>("/proficiencies");

  let count = 0;
  for (const { index } of results) {
    const p = await get<{ index: string; name: string; type?: string }>(
      `/proficiencies/${index}`
    );

    await prisma.proficiency.upsert({
      where: { index: p.index },
      update: {},
      create: {
        index: p.index,
        name: p.name,
        type: p.type?.toUpperCase().replace(/ /g, "_") ?? "OTHER",
      },
    });
    count++;
  }

  console.log(`   ✓ ${count} proficiencies seeded`);
}

// ── Spells ────────────────────────────────────────────────────────────────────

async function seedSpells() {
  console.log("🌱 Seeding spells (this may take a moment)...");
  const { results } = await get<{ results: { index: string }[] }>("/spells");

  let count = 0;
  for (const { index } of results) {
    const s = await get<{
      index: string;
      name: string;
      level: number;
      school: { name: string };
      casting_time: string;
      range: string;
      duration: string;
      desc: string | string[];
      higher_level?: string[];
    }>(`/spells/${index}`);

    await prisma.spell.upsert({
      where: { index: s.index },
      update: {},
      create: {
        index: s.index,
        name: s.name,
        level: s.level,
        school: s.school?.name ?? "Unknown",
        castingTime: s.casting_time,
        range: s.range,
        duration: s.duration,
        description: Array.isArray(s.desc) ? s.desc.join("\n") : s.desc,
        higherLevels: s.higher_level?.join("\n") ?? null,
      },
    });
    count++;
  }

  console.log(`   ✓ ${count} spells seeded`);
}

// ── Equipment ─────────────────────────────────────────────────────────────────

const itemTypeMap: Record<string, ItemType> = {
  Weapon: "WEAPON",
  Armor: "ARMOR",
  "Adventuring Gear": "GEAR",
  Tools: "TOOL",
  "Mounts and Vehicles": "GEAR",
};

async function seedEquipment() {
  console.log("🌱 Seeding equipment...");
  const { results } = await get<{ results: { index: string }[] }>("/equipment");

  let count = 0;
  for (const { index } of results) {
    const e = await get<ApiEquipment>(`/equipment/${index}`);

    const rawType = e.equipment_category?.name ?? "Gear";
    const type = itemTypeMap[rawType] ?? "GEAR";

    await prisma.item.upsert({
      where: { index: e.index },
      update: {},
      create: {
        index: e.index,
        name: e.name,
        description: e.desc?.join("\n") ?? null,
        type,
        weight: e.weight ?? null,
        cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : null,
        damageDice: e.damage?.damage_dice ?? null,
        damageType: e.damage?.damage_type?.name ?? null,
        weaponRange: e.weapon_range ?? null,
        armorClass: e.armor_class?.base ?? null,
      },
    });
    count++;
  }

  console.log(`   ✓ ${count} equipment items seeded`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎲 Starting Nat20 seed...\n");

  await seedRaces();
  await seedClasses();
  await seedBackgrounds();
  await seedProficiencies();
  await seedSpells();
  await seedEquipment();

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
