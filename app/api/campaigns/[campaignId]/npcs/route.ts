import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/campaigns/[campaignId]/npcs
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const npcs = await prisma.nPC.findMany({
      where: { campaignId: campaignId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(npcs);
  } catch (error) {
    console.error("NPC list error:", error);
    return NextResponse.json({ error: "Failed to fetch NPCs" }, { status: 500 });
  }
}

// POST /api/campaigns/[campaignId]/npcs
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, maxHp, armorClass, speed, initiativeModifier, attacks } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!maxHp || maxHp < 1) return NextResponse.json({ error: "HP must be at least 1" }, { status: 400 });

    const npc = await prisma.nPC.create({
      data: {
        campaignId:        campaignId,
        name:              name.trim(),
        maxHp:             Number(maxHp),
        currentHp:         Number(maxHp),
        armorClass:        Number(armorClass ?? 10),
        speed:             Number(speed ?? 30),
        initiativeModifier: Number(initiativeModifier ?? 0),
        attacks:           attacks ?? [],
      },
    });

    return NextResponse.json(npc, { status: 201 });
  } catch (error) {
    console.error("NPC create error:", error);
    return NextResponse.json({ error: "Failed to create NPC" }, { status: 500 });
  }
}