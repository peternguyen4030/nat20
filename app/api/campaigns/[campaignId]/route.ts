import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: { select: { id: true, name: true, displayName: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, displayName: true, image: true, avatarUrl: true } },
          },
        },
        characters: {
          include: {
            race:    true,
            classes: { include: { class: true } },
            user:    { select: { id: true, name: true, displayName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isMember = campaign.members.some((m) => m.user.id === session.user.id);
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(campaign, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;

    // Only DM can edit campaign
    const membership = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!membership || membership.role !== "DM") {
      return NextResponse.json({ error: "Only the DM can edit this campaign" }, { status: 403 });
    }

    const body  = await req.json();
    const ALLOWED = ["name", "emoji", "description", "bannerUrl"];
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) data[key] = body[key];
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (campaign.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the campaign owner can delete it" }, { status: 403 });
    }

    await prisma.campaign.delete({ where: { id: campaignId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
