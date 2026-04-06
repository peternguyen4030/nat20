import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/campaigns/[campaignId]/action-log
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: session.user.id } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const logs = await prisma.actionLog.findMany({
      where:   { campaignId },
      orderBy: { createdAt: "desc" },
      take:    50,
      select: {
        id:          true,
        actionType:  true,
        description: true,
        result:      true,
        createdAt:   true,
        user:        { select: { displayName: true, name: true } },
        character:   { select: { name: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Action log error:", error);
    return NextResponse.json({ error: "Failed to fetch action log" }, { status: 500 });
  }
}