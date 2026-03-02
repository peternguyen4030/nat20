import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
  ].filter(Boolean) as string[],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    discord: { 
        clientId: process.env.DISCORD_CLIENT_ID as string, 
        clientSecret: process.env.DISCORD_CLIENT_SECRET as string, 
    },
    google: { 
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    },
  },
  plugins: [nextCookies()],
});