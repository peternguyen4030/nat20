import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify membership
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch or create board
    let board = await prisma.campaignBoard.findUnique({
      where: { campaignId: campaignId },
      include: { activeMap: true },
    });

    if (!board) {
      board = await prisma.campaignBoard.create({
        data: { campaignId: campaignId },
        include: { activeMap: true },
      });
    }

    const campaignMembers = await prisma.campaignMember.findMany({
      where: { campaignId: campaignId },
      select: { userId: true, role: true },
    });
    const dmUserIds = new Set(
      campaignMembers
        .filter((m) => m.role === "DM")
        .map((m) => m.userId)
    );

    const rawState = (board.boardState as Record<string, unknown> | null) ?? {};
    const visibleNpcIds = Array.isArray(rawState.visibleNpcIds)
      ? rawState.visibleNpcIds.filter((id): id is string => typeof id === "string")
      : [];
    const visibleDmCharacterIds = Array.isArray(rawState.visibleDmCharacterIds)
      ? rawState.visibleDmCharacterIds.filter((id): id is string => typeof id === "string")
      : [];

    // Active player characters + all DM characters so DMs can manage visibility for board use.
    const allCharacters = await prisma.character.findMany({
      where: {
        campaignId: campaignId,
        OR: [
          { isActive: true },
          { userId: { in: Array.from(dmUserIds) } },
        ],
      },
      select: {
        id: true,
        name: true,
        level: true,
        currentHp: true,
        maxHp: true,
        temporaryHp: true,
        spellSlots: true,
        abilityScores: {
          select: {
            strength: true,
            dexterity: true,
            constitution: true,
            intelligence: true,
            wisdom: true,
            charisma: true,
          },
        },
        armorClass: true,
        speed: true,
        initiative: true,
        avatarUrl: true,
        pronouns: true,
        conditions: true,
        inspiration: true,
        isActive: true,
        userId: true,
        user: { select: { id: true, displayName: true, name: true } },
        race: { select: { name: true } },
        classes: { select: { level: true, class: { select: { name: true, spellcastingAbility: true } } } },
        features: { select: { feature: { select: { name: true, actionType: true, combatUsable: true } } } },
        spells:   {
          select: {
            spell: {
              select: {
                id: true,
                name: true,
                level: true,
                castingTime: true,
                range: true,
                damageDice: true,
                damageType: true,
                healingDice: true,
                scalingDice: true,
              },
            },
          },
        },
      },
    });

    const isRequesterDM = member.role === "DM";
    const characters = isRequesterDM
      ? allCharacters
      : allCharacters.filter((c) => {
          const ownerIsDM = dmUserIds.has(c.userId);
          if (!ownerIsDM) return c.isActive;
          return visibleDmCharacterIds.includes(c.id);
        });

    const allNpcs = await prisma.nPC.findMany({
      where: { campaignId: campaignId },
      orderBy: { createdAt: "asc" },
    });
    const npcs = isRequesterDM
      ? allNpcs
      : allNpcs.filter((n) => visibleNpcIds.includes(n.id));

    // Fetch campaign assets for map picker (DM only — safe to include, UI controls visibility)
    const assets = await prisma.campaignAsset.findMany({
      where: { campaignId: campaignId, type: "MAP" },
      select: { id: true, name: true, url: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ board, characters, npcs, assets });
  } catch (error) {
    console.error("Board fetch error:", error);
    return NextResponse.json({ error: "Failed to load board" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { activeMapId, boardState, combatActive } = await req.json();

    // Players can update boardState (token positions) but only DMs can change map/combat
    if ((activeMapId !== undefined || combatActive !== undefined) && member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // When updating boardState tokens, merge with existing state rather than replace
    // This prevents token positions from being wiped when other fields update
    let mergedBoardState = boardState;
    if (boardState !== undefined) {
      const existing = await prisma.campaignBoard.findUnique({
        where: { campaignId: campaignId },
        select: { boardState: true },
      });
      const existingState = (existing?.boardState as Record<string, unknown> | null) ?? {};
      mergedBoardState = { ...existingState, ...boardState };
    }

    const board = await prisma.campaignBoard.upsert({
      where: { campaignId: campaignId },
      create: { campaignId: campaignId, activeMapId, boardState: mergedBoardState, combatActive },
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
      campaignChannel(campaignId),
      PUSHER_EVENTS.BOARD_UPDATED,
      { board: broadcastBoard }
    );

    return NextResponse.json(broadcastBoard);
  } catch (error) {
    console.error("Board update error:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}