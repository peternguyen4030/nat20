import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prisma } from "@/lib/db";
import { validatePasswordStrength } from "@/lib/password-validation";

export { validatePasswordStrength };

// ── Auth config ───────────────────────────────────────────────────────────────

const authBaseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: authBaseURL,
  trustedOrigins: [
    authBaseURL,
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "https://localhost:3000",
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
        returned: true,
      },
      avatarUrl: {
        type: "string",
        required: false,
        input: true,
        returned: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const password = ctx.body?.password as string | undefined;
      if (!password) return;
      const error = validatePasswordStrength(password);
      if (error) throw new APIError("BAD_REQUEST", { message: error });
    }),
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        image: profile.image ?? null,
      }),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        image: profile.picture ?? null,
      }),
    },
  },
  plugins: [nextCookies()],
});