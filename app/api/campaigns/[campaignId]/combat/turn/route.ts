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

// POST /api/campaigns/[campaignId]/combat/turn
// Advance turn (DM only) or end combat
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

    const { action } = await req.json();
    // action: "next_turn" | "end_combat"

    const board = await prisma.campaignBoard.findUnique({ where: { campaignId } });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const currentState = (board.boardState as unknown as CombatBoardState) ?? {} as CombatBoardState;

    if (action === "end_combat") {
      // End the active combat session
      await prisma.combatSession.updateMany({
        where: { campaignId, active: true },
        data:  { active: false },
      });

      const newState = {
        ...currentState,
        combatActive:     false,
        currentTurnIndex: 0,
        round:            1,
        initiativeOrder:  [],
        combatSessionId:  null,
        // preserve token positions
        tokens: currentState.tokens ?? {},
      };

      await prisma.campaignBoard.update({
        where: { campaignId },
        data:  { combatActive: false, boardState: newState as unknown as Prisma.InputJsonValue },
      });

      await prisma.actionLog.create({
        data: {
          campaignId,
          userId:     session.user.id,
          actionType: "COMBAT_OTHER",
          description: "Combat ended.",
        },
      });

      const chEnd = campaignChannel(campaignId);
      await pusherServer.trigger(chEnd, PUSHER_EVENTS.BOARD_UPDATED, {
        board: { boardState: newState, combatActive: false },
      });
      await pusherServer.trigger(chEnd, PUSHER_EVENTS.COMBAT_ENDED, { boardState: newState });

      return NextResponse.json({ boardState: newState });
    }

    if (action === "next_turn") {
      const order     = currentState.initiativeOrder ?? [];
      if (order.length === 0) return NextResponse.json({ error: "No initiative order" }, { status: 400 });
      const nextIndex = ((currentState.currentTurnIndex ?? 0) + 1) % order.length;
      const isNewRound = nextIndex === 0;
      const newRound   = isNewRound ? ((currentState.round ?? 1) + 1) : (currentState.round ?? 1);

      // Reset action slots for next combatant
      const updatedOrder = order.map((e: InitiativeEntry, i: number) =>
        i === nextIndex
          ? { ...e, actionUsed: false, bonusActionUsed: false, reactionUsed: false }
          : e
      );

      const newState = {
        ...currentState,
        tokens:           currentState.tokens ?? {},
        currentTurnIndex: nextIndex,
        round:            newRound,
        initiativeOrder:  updatedOrder,
      };

      await prisma.campaignBoard.update({
        where: { campaignId },
        data:  { boardState: newState as unknown as Prisma.InputJsonValue },
      });

      const chTurn = campaignChannel(campaignId);
      await pusherServer.trigger(chTurn, PUSHER_EVENTS.BOARD_UPDATED, {
        board: { boardState: newState },
      });

      if (isNewRound) {
        await prisma.actionLog.create({
          data: {
            campaignId,
            sessionId:  currentState.combatSessionId ?? undefined,
            userId:     session.user.id,
            actionType: "COMBAT_OTHER",
            description: `Round ${newRound} begins.`,
          },
        });
      }

      await pusherServer.trigger(chTurn, PUSHER_EVENTS.TURN_ADVANCED, { boardState: newState });

      return NextResponse.json({ boardState: newState });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Combat turn error:", error);
    return NextResponse.json({ error: "Failed to advance turn" }, { status: 500 });
  }
}