import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const backgrounds = await prisma.background.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(backgrounds);
  } catch (error) {
    console.error("Failed to fetch backgrounds:", error);
    return NextResponse.json(
      { error: "Failed to fetch backgrounds" },
      { status: 500 }
    );
  }
}
