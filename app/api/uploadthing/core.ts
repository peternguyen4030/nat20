import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

// ── File router ───────────────────────────────────────────────────────────────

export const ourFileRouter = {

  // Character portrait — used on character sheet and combat sessions
  characterAvatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Character avatar uploaded by ${metadata.userId}: ${file.url}`);
      return { url: file.url };
    }),

  // User profile picture — displayed on dashboard and profile page
  userAvatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`User avatar uploaded by ${metadata.userId}: ${file.url}`);
      return { url: file.url };
    }),

  // DM assets — maps, handouts, monster images, etc.
  dmAsset: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    pdf:   { maxFileSize: "16MB", maxFileCount: 5  },
  })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`DM asset uploaded by ${metadata.userId}: ${file.url}`);
      return { url: file.url };
    }),

  // Campaign banner — displayed on campaign detail page
  campaignBanner: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`Campaign banner uploaded by ${metadata.userId}: ${file.url}`);
      return { url: file.url };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
