import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify membership
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: params.campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch or create board
    let board = await prisma.campaignBoard.findUnique({
      where: { campaignId: params.campaignId },
      include: { activeMap: true },
    });

    if (!board) {
      board = await prisma.campaignBoard.create({
        data: { campaignId: params.campaignId },
        include: { activeMap: true },
      });
    }

    // Fetch active characters with full stats
    const characters = await prisma.character.findMany({
      where: { campaignId: params.campaignId, isActive: true },
      select: {
        id: true,
        name: true,
        level: true,
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        armorClass: true,
        speed: true,
        avatarUrl: true,
        conditions: true,
        inspiration: true,
        user: { select: { id: true, displayName: true, name: true } },
        race: { select: { name: true } },
        classes: { select: { level: true, class: { select: { name: true } } } },
      },
    });

    // Fetch campaign assets for map picker (DM only — safe to include, UI controls visibility)
    const assets = await prisma.campaignAsset.findMany({
      where: { campaignId: params.campaignId, type: "MAP" },
      select: { id: true, name: true, url: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ board, characters, assets });
  } catch (error) {
    console.error("Board fetch error:", error);
    return NextResponse.json({ error: "Failed to load board" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // DM only
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: params.campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { activeMapId, boardState, combatActive } = await req.json();

    // When updating boardState tokens, merge with existing state rather than replace
    // This prevents token positions from being wiped when other fields update
    let mergedBoardState = boardState;
    if (boardState !== undefined) {
      const existing = await prisma.campaignBoard.findUnique({
        where: { campaignId: params.campaignId },
        select: { boardState: true },
      });
      const existingState = (existing?.boardState as Record<string, unknown> | null) ?? {};
      mergedBoardState = { ...existingState, ...boardState };
    }

    const board = await prisma.campaignBoard.upsert({
      where: { campaignId: params.campaignId },
      create: { campaignId: params.campaignId, activeMapId, boardState: mergedBoardState, combatActive },
      update: {
        ...(activeMapId    !== undefined && { activeMapId }),
        ...(boardState     !== undefined && { boardState: mergedBoardState }),
        ...(combatActive   !== undefined && { combatActive }),
      },
      include: { activeMap: true },
    });

    // Broadcast the updated board with merged boardState to all clients
    const broadcastBoard = { ...board, boardState: mergedBoardState };
    await pusherServer.trigger(
      campaignChannel(params.campaignId),
      PUSHER_EVENTS.BOARD_UPDATED,
      { board: broadcastBoard }
    );

    return NextResponse.json(broadcastBoard);
  } catch (error) {
    console.error("Board update error:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}