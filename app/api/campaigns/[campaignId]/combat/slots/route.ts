import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

// POST /api/campaigns/[campaignId]/combat/slots
// Persists action slot usage (action/bonus/reaction) to boardState
// so it survives refreshes and is visible to all clients.
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

    const { characterKey, slot } = await req.json() as {
      characterKey: string;
      slot: "action" | "bonus" | "reaction";
    };

    const board = await prisma.campaignBoard.findUnique({ where: { campaignId } });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    type InitiativeEntry = {
      key: string; actionUsed: boolean; bonusActionUsed: boolean; reactionUsed: boolean;
      [key: string]: unknown;
    };
    type BoardStateType = {
      initiativeOrder?: InitiativeEntry[];
      [key: string]: unknown;
    };

    const state = (board.boardState as unknown as BoardStateType) ?? {};
    const order = state.initiativeOrder ?? [];

    const updatedOrder = order.map((e) =>
      e.key === characterKey ? {
        ...e,
        actionUsed:      slot === "action"   ? true : e.actionUsed,
        bonusActionUsed: slot === "bonus"     ? true : e.bonusActionUsed,
        reactionUsed:    slot === "reaction"  ? true : e.reactionUsed,
      } : e
    );

    const newState = { ...state, initiativeOrder: updatedOrder };

    await prisma.campaignBoard.update({
      where: { campaignId },
      data:  { boardState: newState as unknown as object },
    });

    // Broadcast so all clients update action slot display
    await pusherServer.trigger(
      campaignChannel(campaignId),
      PUSHER_EVENTS.TURN_ADVANCED,
      { boardState: newState },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slot update error:", error);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}