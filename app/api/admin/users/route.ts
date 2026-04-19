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

// GET /api/admin/users
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, displayName: true, email: true,
      role: true, createdAt: true, image: true,
      _count: { select: { campaignsOwned: true, characters: true, memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PATCH /api/admin/users — update role
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { userId, role } = await req.json();
  if (!userId || !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (userId === guard.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { role },
    select: { id: true, email: true, displayName: true, role: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/users
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === guard.user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
