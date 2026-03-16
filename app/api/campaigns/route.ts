import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, emoji } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    // Create campaign + add creator as DM member in one transaction
    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.campaign.create({
        data: {
          name:    name.trim(),
          emoji:   emoji ?? "⚔️",
          ownerId: session.user.id,
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
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
