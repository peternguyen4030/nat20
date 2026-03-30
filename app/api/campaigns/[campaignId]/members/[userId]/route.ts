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

    const [updated] = await prisma.$transaction([
      prisma.campaignMember.update({
        where: { campaignId_userId: { campaignId, userId } },
        data:  { role },
      }),
      // If a member becomes DM, ensure none of their characters remain "active"/visible.
      ...(role === "DM"
        ? [
            prisma.character.updateMany({
              where: { campaignId, userId, isActive: true },
              data:  { isActive: false },
            }),
          ]
        : []),
    ]);

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
