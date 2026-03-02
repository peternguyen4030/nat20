// app/api/debug/route.ts
export async function GET() {
    return Response.json({
      hasSecret: !!process.env.BETTER_AUTH_SECRET,
      hasBaseURL: !!process.env.BETTER_AUTH_URL,
      hasBaseURLAlt: !!process.env.BETTER_AUTH_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    })
  }