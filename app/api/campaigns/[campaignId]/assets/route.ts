import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/campaigns/[campaignId]/assets — create map/token asset (DM only)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member || member.role !== "DM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, url, type } = body as { name?: string; url?: string; type?: string };
    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Name and url are required" }, { status: 400 });
    }
    if (type !== "MAP" && type !== "TOKEN") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const asset = await prisma.campaignAsset.create({
      data: {
        campaignId,
        name: name.trim(),
        url:  url.trim(),
        type: type === "MAP" ? "MAP" : "TOKEN",
      },
      select: { id: true, name: true, url: true },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (e) {
    console.error("Asset create error:", e);
    return NextResponse.json({ error: "Failed to save asset" }, { status: 500 });
  }
}
