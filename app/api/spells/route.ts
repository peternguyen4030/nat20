import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const spells = await prisma.spell.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(spells);
  } catch (error) {
    console.error("Failed to fetch spells:", error);
    return NextResponse.json(
      { error: "Failed to fetch spells" },
      { status: 500 }
    );
  }
}
