import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/characters/[characterId]/proficiencies
// Body: { add: string[], remove: string[], expertise: string[] }
// add/remove are proficiency index strings
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { add = [], remove = [], expertise = [] } = await req.json();

    // Fetch proficiency IDs for the given indexes
    const [addProfs, removeProfs] = await Promise.all([
      add.length > 0
        ? prisma.proficiency.findMany({ where: { index: { in: add } }, select: { id: true, index: true } })
        : [],
      remove.length > 0
        ? prisma.proficiency.findMany({ where: { index: { in: remove } }, select: { id: true } })
        : [],
    ]);

    await prisma.$transaction([
      // Add new proficiencies
      ...addProfs.map((prof) =>
        prisma.characterProficiency.upsert({
          where:  { characterId_proficiencyId: { characterId, proficiencyId: prof.id } },
          update: { expertise: expertise.includes(prof.index) },
          create: { characterId, proficiencyId: prof.id, expertise: expertise.includes(prof.index) },
        })
      ),
      // Remove proficiencies
      ...(removeProfs.length > 0
        ? [prisma.characterProficiency.deleteMany({
            where: {
              characterId,
              proficiencyId: { in: removeProfs.map((p) => p.id) },
            },
          })]
        : []),
      // Update expertise for remaining proficiencies
      ...expertise
        .filter((idx: string) => !add.includes(idx))
        .map((idx: string) =>
          prisma.characterProficiency.updateMany({
            where: {
              characterId,
              proficiency:  { index: idx },
            },
            data: { expertise: true },
          })
        ),
    ]);

    // Return updated proficiencies
    const proficiencies = await prisma.characterProficiency.findMany({
      where:   { characterId },
      include: { proficiency: true },
    });

    return NextResponse.json(proficiencies);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update proficiencies" }, { status: 500 });
  }
}
