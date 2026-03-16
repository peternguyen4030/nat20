import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/characters/[characterId]/inventory
// Body: { itemIndex: string } OR { customName, customDescription, customType }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.itemIndex) {
      // Add from seeded Item table
      const item = await prisma.item.findUnique({ where: { index: body.itemIndex } });
      if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      const characterItem = await prisma.characterItem.upsert({
        where:  {
          // If already exists just increment quantity
          characterId_itemId: { characterId, itemId: item.id },
        },
        update: { quantity: { increment: 1 } },
        create: { characterId, itemId: item.id, quantity: 1 },
        include: { item: true },
      });

      return NextResponse.json(characterItem, { status: 201 });
    }

    if (body.customName) {
      // Add custom item — no itemId reference
      const characterItem = await prisma.characterItem.create({
        data: {
          characterId,
          itemId:            null,
          quantity:          1,
          customName:        body.customName,
          customDescription: body.customDescription ?? null,
          customType:        body.customType ?? "GEAR",
        },
        include: { item: true },
      });

      return NextResponse.json(characterItem, { status: 201 });
    }

    return NextResponse.json({ error: "Provide itemIndex or customName" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
