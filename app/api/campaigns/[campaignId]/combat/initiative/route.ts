import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface InitiativeEntry {
  key: string; name: string; initiative: number; type: string;
  rolled: boolean; actionUsed: boolean; bonusActionUsed: boolean; reactionUsed: boolean;
}

interface CombatBoardState {
  tokens:           Record<string, { col: number; row: number }>;
  combatActive?:    boolean;
  currentTurnIndex?: number;
  round?:           number;
  combatSessionId?: string | null;
  initiativeOrder?: InitiativeEntry[];
}

// POST /api/campaigns/[campaignId]/combat/initiative
// Player submits their initiative roll
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
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { characterId, total } = await req.json();

    // Update the board state with this player's initiative
    const board = await prisma.campaignBoard.findUnique({ where: { campaignId } });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const currentState = (board.boardState as unknown as CombatBoardState) ?? {} as CombatBoardState;
    const order = currentState.initiativeOrder ?? [];
    const key   = `char_${characterId}`;

    const updatedOrder = order.map((e: InitiativeEntry) =>
      e.key === key ? { ...e, initiative: total, rolled: true } : e
    );

    const newState = { ...currentState, tokens: currentState.tokens ?? {}, initiativeOrder: updatedOrder };

    await prisma.campaignBoard.update({
      where: { campaignId },
      data:  { boardState: newState as unknown as Prisma.InputJsonValue },
    });

    const ch = campaignChannel(campaignId);
    await pusherServer.trigger(ch, PUSHER_EVENTS.BOARD_UPDATED, {
      board: { boardState: newState },
    });
    await pusherServer.trigger(ch, PUSHER_EVENTS.INITIATIVE_ROLLED, {
      boardState: newState,
      characterId,
      total,
    });

    return NextResponse.json({ success: true, total });
  } catch (error) {
    console.error("Initiative submit error:", error);
    return NextResponse.json({ error: "Failed to submit initiative" }, { status: 500 });
  }
}