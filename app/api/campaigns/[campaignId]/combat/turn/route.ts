import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface InitiativeEntry {
  key: string; name: string; initiative: number; type: string;
  rolled: boolean; actionUsed: boolean; bonusActionUsed: boolean; reactionUsed: boolean;
}

interface CombatBoardState {
  tokens:            Record<string, { col: number; row: number }>;
  combatActive?:     boolean;
  currentTurnIndex?: number;
  round?:            number;
  combatSessionId?:  string | null;
  initiativeOrder?:  InitiativeEntry[];
}

// POST /api/campaigns/[campaignId]/combat/turn
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
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action } = await req.json();

    const board = await prisma.campaignBoard.findUnique({ where: { campaignId } });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const currentState = (board.boardState as unknown as CombatBoardState) ?? {} as CombatBoardState;

    if (action === "end_combat") {
      if (member.role !== "DM") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await prisma.combatSession.updateMany({
        where: { campaignId, active: true },
        data:  { active: false },
      });

      const newState: CombatBoardState = {
        ...currentState,
        tokens:           currentState.tokens ?? {},
        combatActive:     false,
        currentTurnIndex: 0,
        round:            1,
        initiativeOrder:  [],
        combatSessionId:  null,
      };

      await prisma.campaignBoard.update({
        where: { campaignId },
        data:  { combatActive: false, boardState: newState as unknown as object },
      });

      await prisma.actionLog.create({
        data: {
          campaignId,
          userId:      session.user.id,
          actionType:  "COMBAT_OTHER",
          description: "Combat ended.",
        },
      });

      await pusherServer.trigger(
        campaignChannel(campaignId),
        PUSHER_EVENTS.COMBAT_ENDED,
        { boardState: newState },
      );

      return NextResponse.json({ boardState: newState });
    }

    if (action === "next_turn") {
      const order = currentState.initiativeOrder ?? [];
      if (order.length === 0) {
        return NextResponse.json({ error: "No initiative order" }, { status: 400 });
      }

      if (member.role !== "DM") {
        const turnIdx = currentState.currentTurnIndex ?? 0;
        const currentEntry = order[turnIdx];
        if (!currentEntry || currentEntry.type !== "character") {
          return NextResponse.json(
            { error: "Only the DM can advance the turn right now" },
            { status: 403 },
          );
        }
        const m = /^char_(.+)$/.exec(currentEntry.key);
        if (!m) {
          return NextResponse.json({ error: "Invalid initiative entry" }, { status: 400 });
        }
        const actingChar = await prisma.character.findFirst({
          where: { id: m[1], campaignId, userId: session.user.id },
          select: { id: true },
        });
        if (!actingChar) {
          return NextResponse.json({ error: "Not your turn" }, { status: 403 });
        }
      }

      const nextIndex  = ((currentState.currentTurnIndex ?? 0) + 1) % order.length;
      const isNewRound = nextIndex === 0;
      const newRound   = isNewRound ? (currentState.round ?? 1) + 1 : (currentState.round ?? 1);

      const updatedOrder = order.map((e: InitiativeEntry, i: number) =>
        i === nextIndex
          ? { ...e, actionUsed: false, bonusActionUsed: false, reactionUsed: false }
          : e
      );

      const newState: CombatBoardState = {
        ...currentState,
        tokens:           currentState.tokens ?? {},
        currentTurnIndex: nextIndex,
        round:            newRound,
        initiativeOrder:  updatedOrder,
      };

      await prisma.campaignBoard.update({
        where: { campaignId },
        data:  { boardState: newState as unknown as object },
      });

      if (isNewRound) {
        await prisma.actionLog.create({
          data: {
            campaignId,
            sessionId:   currentState.combatSessionId ?? undefined,
            userId:      session.user.id,
            actionType:  "COMBAT_OTHER",
            description: `Round ${newRound} begins.`,
          },
        });
      }

      await pusherServer.trigger(
        campaignChannel(campaignId),
        PUSHER_EVENTS.TURN_ADVANCED,
        { boardState: newState },
      );

      return NextResponse.json({ boardState: newState });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Combat turn error:", error);
    return NextResponse.json({ error: "Failed to advance turn" }, { status: 500 });
  }
}