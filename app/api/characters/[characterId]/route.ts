import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { characterId } = await params;

    const character = await prisma.character.findUnique({
      where:   { id: characterId },
      include: {
        race:          true,
        background:    true,
        abilityScores: true,
        classes:       { include: { class: true }, orderBy: { level: "desc" } },
        features:      { include: { feature: true }, orderBy: { feature: { name: "asc" } } },
        spells:        { include: { spell: true }, orderBy: { spell: { level: "asc" } } },
        proficiencies: { include: { proficiency: true } },
        inventory:     { include: { item: true }, orderBy: { id: "asc" } },
        campaign:      true,
      },
    });

    if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(character);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch character" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { characterId } = await params;

    const existing = await prisma.character.findUnique({ where: { id: characterId }, select: { userId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    const ALLOWED_FIELDS = [
      "name", "gender", "pronouns", "avatarUrl",
      "currentHp", "maxHp", "temporaryHp", "armorClass",
      "speed", "initiative", "proficiencyBonus", "inspiration",
      "personalityTrait", "ideal", "bond", "flaw", "notes",
      "deathSaves", "hitDice", "spellSlots", "conditions",
      "savingThrowBonuses", "skillBonuses", "languages",
    ];

    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    // Ability scores handled via nested relation
    if (body.abilityScores) {
      await prisma.abilityScore.update({
        where: { characterId },
        data:  body.abilityScores,
      });
    }

    const character = await prisma.character.update({
      where: { id: characterId },
      data,
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { characterId } = await params;

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.character.delete({ where: { id: characterId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete character" }, { status: 500 });
  }
}