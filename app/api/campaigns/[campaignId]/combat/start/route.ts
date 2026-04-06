import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/campaigns/[campaignId]/combat/start
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { initiativeOrder } = await req.json();
    // initiativeOrder: Array<{ key: string; name: string; initiative: number; type: "character"|"npc" }>

    if (!initiativeOrder?.length) {
      return NextResponse.json({ error: "Initiative order is required" }, { status: 400 });
    }

    await prisma.combatSession.updateMany({
      where: { campaignId, active: true },
      data:  { active: false },
    });

    const combatSession = await prisma.combatSession.create({
      data: {
        campaignId,
        active:     true,
        round:      1,
        currentTurnCharacterId: null,
      },
    });

    const sorted = [...initiativeOrder].sort((a: { initiative: number }, b: { initiative: number }) => b.initiative - a.initiative);
    const newBoardState = {
      combatActive:     true,
      currentTurnIndex: 0,
      round:            1,
      combatSessionId:  combatSession.id,
      initiativeOrder:  sorted.map((e: Record<string, unknown>) => ({
        ...e,
        actionUsed:      false,
        bonusActionUsed: false,
        reactionUsed:    false,
      })),
    };

    await prisma.campaignBoard.upsert({
      where:  { campaignId },
      create: {
        campaignId,
        combatActive: true,
        boardState: newBoardState as unknown as Prisma.InputJsonValue,
      },
      update: {
        combatActive: true,
        boardState: newBoardState as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.actionLog.create({
      data: {
        campaignId,
        sessionId:   combatSession.id,
        userId:      session.user.id,
        actionType:  "COMBAT_OTHER",
        description: `Combat started. Initiative order: ${sorted.map((e: { name: string; initiative: number }) => `${e.name} (${e.initiative})`).join(", ")}`,
      },
    });

    return NextResponse.json({ combatSession, boardState: newBoardState });
  } catch (error) {
    console.error("Start combat error:", error);
    return NextResponse.json({ error: "Failed to start combat" }, { status: 500 });
  }
}
