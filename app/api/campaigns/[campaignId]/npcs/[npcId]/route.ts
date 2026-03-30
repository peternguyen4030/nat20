import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH /api/campaigns/[campaignId]/npcs/[npcId]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string; npcId: string }> }
) {
  try {
    const { campaignId, npcId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, maxHp, currentHp, armorClass, speed, initiativeModifier, attacks } = await req.json();

    const npc = await prisma.nPC.update({
      where: { id: npcId },
      data: {
        ...(name              !== undefined && { name: name.trim() }),
        ...(maxHp             !== undefined && { maxHp: Number(maxHp) }),
        ...(currentHp         !== undefined && { currentHp: Number(currentHp) }),
        ...(armorClass        !== undefined && { armorClass: Number(armorClass) }),
        ...(speed             !== undefined && { speed: Number(speed) }),
        ...(initiativeModifier !== undefined && { initiativeModifier: Number(initiativeModifier) }),
        ...(attacks           !== undefined && { attacks }),
      },
    });

    return NextResponse.json(npc);
  } catch (error) {
    console.error("NPC update error:", error);
    return NextResponse.json({ error: "Failed to update NPC" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[campaignId]/npcs/[npcId]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string; npcId: string }> }
) {
  try {
    const { campaignId, npcId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.nPC.delete({ where: { id: npcId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("NPC delete error:", error);
    return NextResponse.json({ error: "Failed to delete NPC" }, { status: 500 });
  }
}