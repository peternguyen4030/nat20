import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  _req: NextRequest,
  { params }: { params: { characterId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const character = await prisma.character.findUnique({
      where: { id: params.characterId },
      select: { id: true, userId: true, campaignId: true },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    if (character.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Deactivate all other characters for this user in this campaign, then activate this one
    await prisma.$transaction([
      prisma.character.updateMany({
        where: {
          userId:     session.user.id,
          campaignId: character.campaignId,
          id:         { not: params.characterId },
        },
        data: { isActive: false },
      }),
      prisma.character.update({
        where: { id: params.characterId },
        data:  { isActive: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set active character error:", error);
    return NextResponse.json({ error: "Failed to set active character" }, { status: 500 });
  }
}