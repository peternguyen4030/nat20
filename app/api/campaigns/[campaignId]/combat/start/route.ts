import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

// POST /api/campaigns/[campaignId]/combat/start
export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: params.campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { initiativeOrder } = await req.json();
    // initiativeOrder: Array<{ key: string; name: string; initiative: number; type: "character"|"npc" }>

    if (!initiativeOrder?.length) {
      return NextResponse.json({ error: "Initiative order is required" }, { status: 400 });
    }

    // End any existing active session first
    await prisma.combatSession.updateMany({
      where: { campaignId: params.campaignId, active: true },
      data:  { active: false },
    });

    // Create new combat session
    const combatSession = await prisma.combatSession.create({
      data: {
        campaignId: params.campaignId,
        active:     true,
        round:      1,
        currentTurnCharacterId: null,
      },
    });

    // Preserve existing token positions when starting combat
    const existingBoard = await prisma.campaignBoard.findUnique({
      where: { campaignId: params.campaignId },
      select: { boardState: true },
    });
    const existingTokens = (existingBoard?.boardState as unknown as { tokens?: Record<string, { col: number; row: number }> } | null)?.tokens ?? {};

    const sorted = [...initiativeOrder].sort((a, b) => b.initiative - a.initiative);
    const newBoardState = {
      tokens:           existingTokens,
      combatActive:     true,
      currentTurnIndex: 0,
      round:            1,
      combatSessionId:  combatSession.id,
      initiativeOrder:  sorted.map((e) => ({
        ...e,
        rolled:          e.type === "npc", // NPCs are pre-rolled, players roll their own
        actionUsed:      false,
        bonusActionUsed: false,
        reactionUsed:    false,
      })),
    };

    await prisma.campaignBoard.upsert({
      where:  { campaignId: params.campaignId },
      create: { campaignId: params.campaignId, combatActive: true, boardState: newBoardState },
      update: { combatActive: true, boardState: newBoardState },
    });

    // Log combat start
    await prisma.actionLog.create({
      data: {
        campaignId:  params.campaignId,
        sessionId:   combatSession.id,
        userId:      session.user.id,
        actionType:  "COMBAT_OTHER",
        description: `Combat started. Initiative order: ${sorted.map((e) => `${e.name} (${e.initiative})`).join(", ")}`,
      },
    });

    // Notify all clients that combat has started
    await pusherServer.trigger(campaignChannel(params.campaignId), PUSHER_EVENTS.BOARD_UPDATED, {
      board: { boardState: newBoardState, combatActive: true },
    });

    // Fetch the updated board to broadcast full record including combatActive=true
    const updatedBoard = await prisma.campaignBoard.findUnique({
      where: { campaignId: params.campaignId },
      include: { activeMap: true },
    });

    await pusherServer.trigger(
      campaignChannel(params.campaignId),
      PUSHER_EVENTS.COMBAT_STARTED,
      { board: { ...updatedBoard, boardState: newBoardState } }
    );

    return NextResponse.json({ combatSession, boardState: newBoardState });
  } catch (error) {
    console.error("Start combat error:", error);
    return NextResponse.json({ error: "Failed to start combat" }, { status: 500 });
  }
}