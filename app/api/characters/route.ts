import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ── Level 1 spell slot progression by class ───────────────────────────────────
// Only includes slots the class actually has at level 1
const LEVEL_1_SPELL_SLOTS: Record<string, Record<string, { max: number; used: number }>> = {
  bard:     { "1": { max: 2, used: 0 } },
  cleric:   { "1": { max: 2, used: 0 } },
  druid:    { "1": { max: 2, used: 0 } },
  sorcerer: { "1": { max: 2, used: 0 } },
  warlock:  { "1": { max: 1, used: 0 } },
  wizard:   { "1": { max: 2, used: 0 } },
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, gender, pronouns,
      raceId, subraceId, classId, backgroundId, campaignId,
      abilityScores, selectedSkills,
      selectedCantrips, selectedSpells,
      personality,
    } = body;

    if (!name || !raceId || !classId || !backgroundId || !campaignId || !abilityScores) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [race, characterClass] = await Promise.all([
      prisma.race.findUnique({ where: { id: raceId } }),
      prisma.class.findUnique({ where: { id: classId } }),
    ]);

    if (!race)           return NextResponse.json({ error: "Race not found" },  { status: 404 });
    if (!characterClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const conMod  = Math.floor((abilityScores.constitution - 10) / 2);
    const maxHp   = Math.max(1, characterClass.hitDie + conMod);
    const dexMod  = Math.floor((abilityScores.dexterity - 10) / 2);

    // Determine spell slots for this class at level 1
    const classIndex  = characterClass.index.toLowerCase();
    const spellSlots  = LEVEL_1_SPELL_SLOTS[classIndex] ?? null;

    const character = await prisma.$transaction(async (tx) => {
      // 1. Create character
      const newCharacter = await tx.character.create({
        data: {
          name,
          gender:           gender ?? null,
          pronouns:         pronouns ?? null,
          level:            1,
          maxHp,
          currentHp:        maxHp,
          temporaryHp:      0,
          armorClass:       10 + dexMod,
          proficiencyBonus: 2,
          speed:            race.speed,
          initiative:       dexMod,
          deathSaves:       { successes: 0, failures: 0 },
          hitDice:          { total: 1, used: 0 },
          spellSlots:       spellSlots,
          userId:           session.user.id,
          campaignId,
          raceId,
          backgroundId,
          // Personality
          personalityTrait: personality?.trait  ?? null,
          ideal:            personality?.ideal  ?? null,
          bond:             personality?.bond   ?? null,
          flaw:             personality?.flaw   ?? null,
          // Subrace stored temporarily until schema updated
          notes: subraceId ? `subraceId:${subraceId}` : null,
        },
      });

      // 2. Ability scores
      await tx.abilityScore.create({
        data: {
          characterId:  newCharacter.id,
          strength:     abilityScores.strength,
          dexterity:    abilityScores.dexterity,
          constitution: abilityScores.constitution,
          intelligence: abilityScores.intelligence,
          wisdom:       abilityScores.wisdom,
          charisma:     abilityScores.charisma,
        },
      });

      // 3. Class at level 1
      await tx.characterClass.create({
        data: { characterId: newCharacter.id, classId, level: 1 },
      });

      // 4. Skill proficiencies from selectedSkills
      if (selectedSkills?.length) {
        const proficiencies = await tx.proficiency.findMany({
          where: { type: "Skills" },
        });
        const skillProfs = proficiencies.filter((p) =>
          selectedSkills.some((s: string) =>
            p.name.toLowerCase().replace(/\s+/g, "-") === s ||
            p.index === s
          )
        );
        if (skillProfs.length) {
          await tx.characterProficiency.createMany({
            data: skillProfs.map((p) => ({
              characterId:   newCharacter.id,
              proficiencyId: p.id,
              expertise:     false,
            })),
            skipDuplicates: true,
          });
        }
      }

      // 5. Spells (cantrips + level 1 spells)
      const allSpellIndices = [
        ...(selectedCantrips ?? []),
        ...(selectedSpells   ?? []),
      ];
      if (allSpellIndices.length) {
        const spells = await tx.spell.findMany({
          where: { index: { in: allSpellIndices } },
        });
        if (spells.length) {
          await tx.characterSpell.createMany({
            data: spells.map((s) => ({
              characterId: newCharacter.id,
              spellId:     s.id,
              status:      "KNOWN",
            })),
            skipDuplicates: true,
          });
        }
      }

      // 6. Class features at level 1
      const classFeatures = await tx.feature.findMany({
        where: { classId, type: "CLASS" },
      });
      if (classFeatures.length) {
        await tx.characterFeature.createMany({
          data: classFeatures.map((f) => ({
            characterId: newCharacter.id,
            featureId:   f.id,
          })),
          skipDuplicates: true,
        });
      }

      // 7. Race features
      const raceFeatures = await tx.feature.findMany({
        where: { raceId, type: "RACE" },
      });
      if (raceFeatures.length) {
        await tx.characterFeature.createMany({
          data: raceFeatures.map((f) => ({
            characterId: newCharacter.id,
            featureId:   f.id,
          })),
          skipDuplicates: true,
        });
      }

      return newCharacter;
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error("Failed to create character:", error);
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
  }
}