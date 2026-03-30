import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0,O,1,I)
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, emoji } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (await prisma.campaign.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
      if (++attempts > 10) throw new Error("Could not generate unique invite code");
    }

    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.campaign.create({
        data: {
          name:       name.trim(),
          emoji:      emoji ?? "⚔️",
          ownerId:    session.user.id,
          inviteCode,
        },
      });
      await tx.campaignMember.create({
        data: {
          campaignId: newCampaign.id,
          userId:     session.user.id,
          role:       "DM",
        },
      });
      return newCampaign;
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}