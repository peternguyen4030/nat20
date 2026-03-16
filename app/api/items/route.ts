import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ItemType } from "@prisma/client";

const VALID_ITEM_TYPES = new Set(Object.values(ItemType));

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const items = await prisma.item.findMany({
      where: type && VALID_ITEM_TYPES.has(type as ItemType) ? { type: type as ItemType } : {},
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
