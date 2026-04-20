import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

// POST /api/campaigns/[campaignId]/combat/action
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

    const {
      sessionId,
      actorId,
      targetKey,
      actionType,
      actionSlot,
      spellLevel,
      description,
      attackRoll,
      damageDealt,
      notes,
    } = await req.json();

    const combatSession = await prisma.combatSession.findFirst({
      where: { id: sessionId, campaignId, active: true },
    });
    if (!combatSession) return NextResponse.json({ error: "No active combat session" }, { status: 400 });

    // Consume spell slot for leveled spell casts
    if (actionType === "CAST" && typeof spellLevel === "number" && spellLevel > 0) {
      const actor = await prisma.character.findUnique({
        where: { id: actorId },
        select: { id: true, spellSlots: true },
      });
      if (!actor) return NextResponse.json({ error: "Actor not found" }, { status: 404 });

      const slots = (actor.spellSlots as Record<string, { max: number; used: number }> | null) ?? {};
      const levelKey = String(spellLevel);
      const entry = slots[levelKey];
      if (!entry || entry.max <= 0 || entry.used >= entry.max) {
        return NextResponse.json({ error: `No level ${spellLevel} spell slots remaining` }, { status: 400 });
      }

      const updatedSlots: Record<string, { max: number; used: number }> = {
        ...slots,
        [levelKey]: { ...entry, used: entry.used + 1 },
      };

      await prisma.character.update({
        where: { id: actorId },
        data: { spellSlots: updatedSlots },
      });
    }

    // Apply damage to target if provided
    if (damageDealt && damageDealt > 0 && targetKey) {
      if (targetKey.startsWith("char_")) {
        const characterId = targetKey.replace("char_", "");
        const character = await prisma.character.findUnique({ where: { id: characterId } });
        if (character) {
          const newHp = Math.max(0, character.currentHp - damageDealt);
          await prisma.character.update({
            where: { id: characterId },
            data:  { currentHp: newHp },
          });
        }
      } else if (targetKey.startsWith("npc_")) {
        const npcId = targetKey.replace("npc_", "");
        const npc = await prisma.nPC.findUnique({ where: { id: npcId } });
        if (npc) {
          const newHp = Math.max(0, npc.currentHp - damageDealt);
          await prisma.nPC.update({
            where: { id: npcId },
            data:  { currentHp: newHp },
          });
        }
      }
    }

    // Record the action
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
        description: description ?? "Action taken",
        result:      attackRoll ? `Roll: ${attackRoll}${damageDealt ? `, Damage: ${damageDealt}` : ""}` : undefined,
      },
    });

    // Broadcast so clients refresh HP and spell slots immediately
    await pusherServer.trigger(
      campaignChannel(campaignId),
      PUSHER_EVENTS.ACTION_TAKEN,
      { targetKey: targetKey ?? null, damageDealt: damageDealt ?? null },
    );

    // Also trigger a BOARD_UPDATED so all clients re-fetch character HP
    const updatedBoard = await prisma.campaignBoard.findUnique({
      where:   { campaignId },
      include: { activeMap: true },
    });
    if (updatedBoard) {
      await pusherServer.trigger(
        campaignChannel(campaignId),
        PUSHER_EVENTS.BOARD_UPDATED,
        { board: updatedBoard },
      );
    }

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Combat action error:", error);
    return NextResponse.json({ error: "Failed to record action" }, { status: 500 });
  }
}