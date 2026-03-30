import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find campaign by invite code
    const campaign = await prisma.campaign.findUnique({
      where: { inviteCode: code.trim().toUpperCase() },
      select: { id: true, name: true, emoji: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You are already a member of this campaign", campaignId: campaign.id }, { status: 409 });
    }

    // Add as player
    await prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        userId:     session.user.id,
        role:       "PLAYER",
      },
    });

    return NextResponse.json({ campaignId: campaign.id, name: campaign.name, emoji: campaign.emoji }, { status: 201 });
  } catch (error) {
    console.error("Join campaign error:", error);
    return NextResponse.json({ error: "Failed to join campaign" }, { status: 500 });
  }
}