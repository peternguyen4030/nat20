import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

// POST /api/campaigns/[campaignId]/combat/start
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> },
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
    if (!initiativeOrder?.length) {
      return NextResponse.json({ error: "Initiative order is required" }, { status: 400 });
    }

    // End any existing active session
    await prisma.combatSession.updateMany({
      where: { campaignId, active: true },
      data:  { active: false },
    });

    // Create new combat session
    const combatSession = await prisma.combatSession.create({
      data: { campaignId, active: true, round: 1, currentTurnCharacterId: null },
    });

    // Preserve existing token positions and any player initiative rolls already submitted
    const existingBoard = await prisma.campaignBoard.findUnique({
      where: { campaignId },
      select: { boardState: true },
    });

    type ExistingState = {
      tokens?: Record<string, { col: number; row: number }>;
      initiativeOrder?: { key: string; initiative: number; rolled: boolean }[];
    };
    const existingState = existingBoard?.boardState as unknown as ExistingState | null;
    const existingTokens = existingState?.tokens ?? {};

    // Build a lookup of rolls already submitted by players via the initiative route
    const existingRolls: Record<string, { initiative: number; rolled: boolean }> = {};
    for (const entry of existingState?.initiativeOrder ?? []) {
      if (entry.rolled) existingRolls[entry.key] = { initiative: entry.initiative, rolled: true };
    }

    const sorted = [...initiativeOrder].sort((a, b) => b.initiative - a.initiative);
    const newBoardState = {
      tokens:           existingTokens,
      combatActive:     true,
      currentTurnIndex: 0,
      round:            1,
      combatSessionId:  combatSession.id,
      initiativeOrder:  sorted.map((e) => {
        // Use the player's pre-submitted roll if available, otherwise use what DM entered
        const preRolled = existingRolls[e.key];
        return {
          ...e,
          initiative:      preRolled ? preRolled.initiative : e.initiative,
          rolled:          e.type === "npc" || !!preRolled,
          actionUsed:      false,
          bonusActionUsed: false,
          reactionUsed:    false,
        };
      }),
    };

    await prisma.campaignBoard.upsert({
      where:  { campaignId },
      create: { campaignId, combatActive: true, boardState: newBoardState as unknown as object },
      update: { combatActive: true, boardState: newBoardState as unknown as object },
    });

    await prisma.actionLog.create({
      data: {
        campaignId,
        sessionId:   combatSession.id,
        userId:      session.user.id,
        actionType:  "COMBAT_OTHER",
        description: `Combat started. Initiative: ${sorted.map((e) => `${e.name} (${e.initiative})`).join(", ")}`,
      },
    });

    // Broadcast full board so all clients flip to combat mode and see the initiative prompt
    const updatedBoard = await prisma.campaignBoard.findUnique({
      where:   { campaignId },
      include: { activeMap: true },
    });

    await pusherServer.trigger(
      campaignChannel(campaignId),
      PUSHER_EVENTS.COMBAT_STARTED,
      { board: { ...updatedBoard, boardState: newBoardState } },
    );

    return NextResponse.json({ combatSession, boardState: newBoardState });
  } catch (error) {
    console.error("Start combat error:", error);
    return NextResponse.json({ error: "Failed to start combat" }, { status: 500 });
  }
}