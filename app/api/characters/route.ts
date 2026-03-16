import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ── GET — fetch characters for a campaign ────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    const characters = await prisma.character.findMany({
      where: {
        userId: session.user.id,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        race:       true,
        background: true,
        classes:    { include: { class: true } },
        abilityScores: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error("Failed to fetch characters:", error);
    return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 });
  }
}

// ── POST — create a new character ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      gender,
      pronouns,
      raceId,
      subraceId,
      classId,
      backgroundId,
      campaignId,
      abilityScores,
      selectedSkills   = [],
      selectedCantrips = [],
      selectedSpells   = [],
      personality      = {},
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────

    if (!name?.trim()) {
      return NextResponse.json({ error: "Character name is required" }, { status: 400 });
    }
    if (!raceId || !classId || !backgroundId || !campaignId || !abilityScores) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── Fetch race and class for derived stats ────────────────────────────────

    const [race, characterClass] = await Promise.all([
      prisma.race.findUnique({ where: { id: raceId } }),
      prisma.class.findUnique({ where: { id: classId } }),
    ]);

    if (!race)           return NextResponse.json({ error: "Race not found"  }, { status: 404 });
    if (!characterClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // ── Derived stats ─────────────────────────────────────────────────────────

    const conMod  = Math.floor((abilityScores.constitution - 10) / 2);
    const dexMod  = Math.floor((abilityScores.dexterity    - 10) / 2);
    const maxHp   = Math.max(1, characterClass.hitDie + conMod);
    const ac      = 10 + dexMod;

    // ── Resolve spell IDs ─────────────────────────────────────────────────────

    const allSpellIndices = [...selectedCantrips, ...selectedSpells];
    const spellRecords    = allSpellIndices.length > 0
      ? await prisma.spell.findMany({
          where: { index: { in: allSpellIndices } },
          select: { id: true, index: true, level: true },
        })
      : [];

    // ── Resolve skill proficiency IDs ─────────────────────────────────────────
    // Skills are stored as proficiency records with index format "skill-{key}"

    const skillProficiencies = selectedSkills.length > 0
      ? await prisma.proficiency.findMany({
          where: {
            index: {
              in: selectedSkills.map((s: string) =>
                s.startsWith("skill-") ? s : `skill-${s}`
              ),
            },
          },
          select: { id: true },
        })
      : [];

    // ── Fetch level 1 class features ──────────────────────────────────────────

    const classFeatures = await prisma.feature.findMany({
      where:  { classId, type: "CLASS" },
      select: { id: true },
    });

    const raceFeatures = await prisma.feature.findMany({
      where:  { raceId, type: "RACE" },
      select: { id: true },
    });

    // ── Transaction ───────────────────────────────────────────────────────────

    const character = await prisma.$transaction(async (tx) => {

      // 1. Create character
      const newCharacter = await tx.character.create({
        data: {
          name:             name.trim(),
          gender:           gender    || null,
          pronouns:         pronouns  || null,
          level:            1,
          maxHp,
          currentHp:        maxHp,
          armorClass:       ac,
          proficiencyBonus: 2,
          speed:            race.speed ?? 30,
          inspiration:      false,

          // Personality
          personalityTrait: personality?.trait || null,
          ideal:            personality?.ideal || null,
          bond:             personality?.bond  || null,
          flaw:             personality?.flaw  || null,

          // Subrace stored in notes for MVP
          notes: subraceId ? `subraceId:${subraceId}` : null,

          userId:       session.user.id,
          campaignId,
          raceId,
          backgroundId,
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

      // 3. Class link
      await tx.characterClass.create({
        data: {
          characterId: newCharacter.id,
          classId,
          level: 1,
        },
      });

      // 4. Skill proficiencies
      if (skillProficiencies.length > 0) {
        await tx.characterProficiency.createMany({
          data: skillProficiencies.map((p) => ({
            characterId:   newCharacter.id,
            proficiencyId: p.id,
            expertise:     false,
          })),
          skipDuplicates: true,
        });
      }

      // 5. Spells
      if (spellRecords.length > 0) {
        await tx.characterSpell.createMany({
          data: spellRecords.map((spell) => ({
            characterId: newCharacter.id,
            spellId:     spell.id,
            // Cantrips are always KNOWN; level 1 spells start PREPARED
            status: spell.level === 0 ? "KNOWN" : "PREPARED",
          })),
          skipDuplicates: true,
        });
      }

      // 6. Class features
      if (classFeatures.length > 0) {
        await tx.characterFeature.createMany({
          data: classFeatures.map((f) => ({
            characterId: newCharacter.id,
            featureId:   f.id,
          })),
          skipDuplicates: true,
        });
      }

      // 7. Race features
      if (raceFeatures.length > 0) {
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

    // Return character with full relations for immediate use
    const fullCharacter = await prisma.character.findUnique({
      where: { id: character.id },
      include: {
        race:          true,
        background:    true,
        abilityScores: true,
        classes:       { include: { class: true } },
        features:      { include: { feature: true } },
        spells:        { include: { spell: true } },
        proficiencies: { include: { proficiency: true } },
      },
    });

    return NextResponse.json(fullCharacter, { status: 201 });

  } catch (error) {
    console.error("Failed to create character:", error);
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
  }
}