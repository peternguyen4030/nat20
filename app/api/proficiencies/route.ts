import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/proficiencies — fetch all seeded proficiencies
export async function GET() {
  try {
    const proficiencies = await prisma.proficiency.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(proficiencies);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proficiencies" }, { status: 500 });
  }
}
