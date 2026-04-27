import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH — promote/demote member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, userId } = await params;

    // Only DM can change roles
    const myMembership = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!myMembership || myMembership.role !== "DM") {
      return NextResponse.json({ error: "Only the DM can manage members" }, { status: 403 });
    }

    const { role } = await req.json();
    if (!["DM", "PLAYER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // Demoting the owner to player moves ownership to another DM (MVP: owner is always a DM with full control).
    let transferOwnerTo: string | null = null;
    if (role === "PLAYER" && campaign.ownerId === userId) {
      const otherDm = await prisma.campaignMember.findFirst({
        where:  { campaignId, userId: { not: userId }, role: "DM" },
        orderBy: { id: "asc" },
      });
      if (!otherDm) {
        return NextResponse.json(
          {
            error:
              "You must promote another member to DM before the current DM/owner can become a player.",
          },
          { status: 400 }
        );
      }
      transferOwnerTo = otherDm.userId;
    }

    // Promoting to DM also transfers campaign ownership to that member.
    const updated = await prisma.$transaction(async (tx) => {
      if (role === "DM") {
        await tx.campaign.update({
          where: { id: campaignId },
          data:  { ownerId: userId },
        });
      }
      if (role === "PLAYER" && transferOwnerTo) {
        await tx.campaign.update({
          where: { id: campaignId },
          data:  { ownerId: transferOwnerTo },
        });
      }
      const member = await tx.campaignMember.update({
        where: { campaignId_userId: { campaignId, userId } },
        data:  { role },
      });
      if (role === "DM") {
        await tx.character.updateMany({
          where: { campaignId, userId, isActive: true },
          data:  { isActive: false },
        });
      }
      return member;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// DELETE — remove member from campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, userId } = await params;

    // Only DM can remove members (or member removing themselves)
    const myMembership = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });

    const isSelf = userId === session.user.id;
    const isDM   = myMembership?.role === "DM";

    if (!isSelf && !isDM) {
      return NextResponse.json({ error: "Only the DM can remove members" }, { status: 403 });
    }

    await prisma.campaignMember.delete({
      where: { campaignId_userId: { campaignId, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
