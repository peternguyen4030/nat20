import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/campaigns/[campaignId]/combat/action
// Submit an action during combat
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
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { sessionId, actorId, actionType, actionSlot, description, attackRoll, damageDealt, notes } = await req.json();

    const combatSession = await prisma.combatSession.findFirst({
      where: { id: sessionId, campaignId, active: true },
    });
    if (!combatSession) return NextResponse.json({ error: "No active combat session" }, { status: 400 });

    const action = await prisma.combatAction.create({
      data: {
        sessionId,
        actorId,
        actionType: actionType ?? "OTHER",
        actionSlot: actionSlot ?? "ACTION",
        attackRoll:  attackRoll  ?? null,
        damageDealt: damageDealt ?? null,
        notes:       notes ?? null,
      },
    });

    await prisma.actionLog.create({
      data: {
        campaignId,
        sessionId,
        userId:      session.user.id,
        characterId: actorId,
        actionType:  "COMBAT_ATTACK",
        description: description ?? `Action taken`,
        result:      attackRoll ? `Roll: ${attackRoll}${damageDealt ? `, Damage: ${damageDealt}` : ""}` : undefined,
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Combat action error:", error);
    return NextResponse.json({ error: "Failed to record action" }, { status: 500 });
  }
}
