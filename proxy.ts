import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js requires this signature
export async function proxy(request: NextRequest) {
  return NextResponse.next();
}
