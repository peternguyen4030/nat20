import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify membership
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch or create board
    const board = await prisma.campaignBoard.upsert({
      where: { campaignId },
      create: { campaignId },
      update: {},
      include: { activeMap: true },
    });

    // Fetch active characters with full stats
    const characters = await prisma.character.findMany({
      where: { campaignId, isActive: true },
      select: {
        id: true,
        name: true,
        level: true,
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        armorClass: true,
        speed: true,
        avatarUrl: true,
        conditions: true,
        inspiration: true,
        user: { select: { id: true, displayName: true, name: true } },
        race: { select: { name: true } },
        classes: { select: { level: true, class: { select: { name: true } } } },
      },
    });

    // Fetch campaign assets for map picker (DM only — safe to include, UI controls visibility)
    const assets = await prisma.campaignAsset.findMany({
      where: { campaignId, type: "MAP" },
      select: { id: true, name: true, url: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { board, characters, assets },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Board fetch error:", error);
    return NextResponse.json({ error: "Failed to load board" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // DM only
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { activeMapId, boardState, combatActive } = await req.json();

    const board = await prisma.campaignBoard.upsert({
      where: { campaignId },
      create: { campaignId, activeMapId, boardState, combatActive },
      update: {
        ...(activeMapId !== undefined && { activeMapId }),
        ...(boardState  !== undefined && { boardState }),
        ...(combatActive !== undefined && { combatActive }),
      },
      include: { activeMap: true },
    });

    return NextResponse.json(board, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Board update error:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}