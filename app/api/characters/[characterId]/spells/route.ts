import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/characters/[characterId]/spells — add a spell
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { characterId } = await params;
    const { spellIndex } = await req.json();
    const spell = await prisma.spell.findUnique({ where: { index: spellIndex } });
    if (!spell) return NextResponse.json({ error: "Spell not found" }, { status: 404 });

    await prisma.characterSpell.upsert({
      where:  { characterId_spellId: { characterId, spellId: spell.id } },
      update: {},
      create: {
        characterId,
        spellId: spell.id,
        status:  spell.level === 0 ? "KNOWN" : "PREPARED",
      },
    });

    // Return updated spell list
    const spells = await prisma.characterSpell.findMany({
      where:   { characterId },
      include: { spell: true },
      orderBy: { spell: { level: "asc" } },
    });

    return NextResponse.json(spells);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add spell" }, { status: 500 });
  }
}
