import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

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

    const body = await req.json() as
      | { type: "rest_prompt"; restType: "short" | "long" }
      | { type: "hp_adjust"; targetType: "character" | "npc"; targetId: string; delta: number };

    if (body.type === "rest_prompt") {
      const label = body.restType === "long" ? "Long Rest" : "Short Rest";
      await prisma.actionLog.create({
        data: {
          campaignId,
          userId: session.user.id,
          actionType: "CAMPAIGN_EVENT",
          description: `DM prompted the party to take a ${label}.`,
        },
      });
      await pusherServer.trigger(campaignChannel(campaignId), PUSHER_EVENTS.ACTION_TAKEN, { kind: "rest_prompt" });
      return NextResponse.json({ success: true });
    }

    if (body.type === "hp_adjust") {
      const delta = Number(body.delta);
      if (!Number.isFinite(delta) || delta === 0) {
        return NextResponse.json({ error: "Delta must be a non-zero number" }, { status: 400 });
      }

      if (body.targetType === "character") {
        const character = await prisma.character.findFirst({
          where: { id: body.targetId, campaignId },
          select: { id: true, name: true, currentHp: true, maxHp: true },
        });
        if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });
        const nextHp = Math.max(0, Math.min(character.maxHp, character.currentHp + delta));
        await prisma.character.update({ where: { id: character.id }, data: { currentHp: nextHp } });
        await prisma.actionLog.create({
          data: {
            campaignId,
            userId: session.user.id,
            characterId: character.id,
            actionType: "HP_CHANGE",
            description: `DM ${delta > 0 ? "healed" : "damaged"} ${character.name}.`,
            result: `${character.currentHp} -> ${nextHp} (${delta > 0 ? "+" : ""}${delta})`,
          },
        });
      } else {
        const npc = await prisma.nPC.findFirst({
          where: { id: body.targetId, campaignId },
          select: { id: true, name: true, currentHp: true, maxHp: true },
        });
        if (!npc) return NextResponse.json({ error: "NPC not found" }, { status: 404 });
        const nextHp = Math.max(0, Math.min(npc.maxHp, npc.currentHp + delta));
        await prisma.nPC.update({ where: { id: npc.id }, data: { currentHp: nextHp } });
        await prisma.actionLog.create({
          data: {
            campaignId,
            userId: session.user.id,
            actionType: "HP_CHANGE",
            description: `DM ${delta > 0 ? "healed" : "damaged"} ${npc.name}.`,
            result: `${npc.currentHp} -> ${nextHp} (${delta > 0 ? "+" : ""}${delta})`,
          },
        });
      }

      await pusherServer.trigger(campaignChannel(campaignId), PUSHER_EVENTS.ACTION_TAKEN, { kind: "hp_adjust" });
      const updatedBoard = await prisma.campaignBoard.findUnique({
        where: { campaignId },
        include: { activeMap: true },
      });
      if (updatedBoard) {
        await pusherServer.trigger(campaignChannel(campaignId), PUSHER_EVENTS.BOARD_UPDATED, { board: updatedBoard });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid tool action" }, { status: 400 });
  } catch (error) {
    console.error("DM tools error:", error);
    return NextResponse.json({ error: "Failed to execute DM tool action" }, { status: 500 });
  }
}
