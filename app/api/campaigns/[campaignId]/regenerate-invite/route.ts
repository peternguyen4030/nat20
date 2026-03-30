import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify requester is the DM
    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate a new unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (await prisma.campaign.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
      if (++attempts > 10) throw new Error("Could not generate unique invite code");
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data:  { inviteCode },
      select: { inviteCode: true },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Regenerate invite error:", error);
    return NextResponse.json({ error: "Failed to regenerate invite code" }, { status: 500 });
  }
}