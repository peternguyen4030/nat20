import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusherServer, campaignChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

// POST /api/campaigns/[campaignId]/combat/notify
// DM sends this to prompt all players to roll initiative before combat starts.
// Does NOT start a combat session — just broadcasts an event.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campaignId: string }> },
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

    // The DM sends which character keys need to roll
    const { pendingKeys } = await req.json() as { pendingKeys: string[] };

    // Broadcast to all clients — players will check if their key is in pendingKeys
    await pusherServer.trigger(
      campaignChannel(campaignId),
      PUSHER_EVENTS.INITIATIVE_NOTIFY,
      { pendingKeys },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Initiative notify error:", error);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}