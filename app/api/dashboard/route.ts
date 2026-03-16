import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [ownedCampaigns, memberCampaigns, characters] = await Promise.all([
      prisma.campaign.findMany({
        where: { ownerId: userId },
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true, name: true, image: true, avatarUrl: true } } },
          },
          _count: { select: { characters: true, sessions: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),

      prisma.campaignMember.findMany({
        where: { userId, campaign: { ownerId: { not: userId } } },
        include: {
          campaign: {
            include: {
              owner: { select: { id: true, displayName: true, name: true } },
              _count: { select: { characters: true, sessions: true } },
            },
          },
        },
        orderBy: { campaign: { updatedAt: "desc" } },
        take: 10,
      }),

      prisma.character.findMany({
        where: { userId },
        include: {
          race: true,
          classes:  { include: { class: true } },
          campaign: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      ownedCampaigns,
      joinedCampaigns: memberCampaigns.map((m) => m.campaign),
      characters,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
