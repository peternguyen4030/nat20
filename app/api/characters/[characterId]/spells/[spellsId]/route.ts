import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH — toggle prepared/known status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string; spellsId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { spellsId } = await params;
    const { status } = await req.json();

    const updated = await prisma.characterSpell.update({
      where: { id: spellsId },
      data:  { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update spell" }, { status: 500 });
  }
}

// DELETE — remove spell from character
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ characterId: string; spellsId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { spellsId } = await params;
    await prisma.characterSpell.delete({ where: { id: spellsId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove spell" }, { status: 500 });
  }
}
