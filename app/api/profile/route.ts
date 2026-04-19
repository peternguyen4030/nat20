import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/profile — returns current user's profile including role
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id:          true,
        name:        true,
        displayName: true,
        email:       true,
        image:       true,
        avatarUrl:   true,
        bio:         true,
        role:        true,
        createdAt:   true,
        _count: {
          select: { characters: true, campaignsOwned: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body    = await req.json();
    const ALLOWED = ["displayName", "bio", "avatarUrl"];
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) data[key] = body[key];
    }

    const user = await prisma.user.update({
      where:  { id: session.user.id },
      data,
      select: {
        id: true, name: true, email: true, displayName: true,
        bio: true, avatarUrl: true, image: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
