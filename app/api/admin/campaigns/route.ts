import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return { error: "Forbidden", status: 403 };
  return { user };
}

// GET /api/admin/campaigns
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const campaigns = await prisma.campaign.findMany({
    include: {
      owner: { select: { id: true, displayName: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, displayName: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { members: true, characters: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

// DELETE /api/admin/campaigns
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { campaignId } = await req.json();
  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  await prisma.campaign.delete({ where: { id: campaignId } });
  return NextResponse.json({ success: true });
}
