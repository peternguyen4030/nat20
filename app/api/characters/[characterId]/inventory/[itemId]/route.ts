import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH — update quantity or equipped status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string; itemId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    if ("quantity" in body) allowed.quantity = Number(body.quantity);
    if ("equipped" in body) allowed.equipped = Boolean(body.equipped);
    if ("attuned"  in body) allowed.attuned  = Boolean(body.attuned);

    const updated = await prisma.characterItem.update({
      where: { id: itemId },
      data:  allowed,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE — remove item from inventory
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ characterId: string; itemId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    await prisma.characterItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
