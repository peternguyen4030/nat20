import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// DELETE /api/campaigns/[campaignId]/assets/[assetId] — DM only
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string; assetId: string }> }
) {
  try {
    const { campaignId, assetId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const asset = await prisma.campaignAsset.findFirst({
      where: { id: assetId, campaignId },
    });
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.campaignBoard.updateMany({
        where: { campaignId, activeMapId: assetId },
        data: { activeMapId: null },
      });
      await tx.campaignAsset.delete({ where: { id: assetId } });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Asset delete error:", e);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
