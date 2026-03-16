import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new UploadThingError("Unauthorized");
  return session.user;
}

export const ourFileRouter = {
  characterAvatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata: _metadata, file }) => {
      return { url: file.ufsUrl };
    }),

  userAvatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata: _metadata, file }) => {
      return { url: file.ufsUrl };
    }),

  dmAsset: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata: _metadata, file }) => {
      return { url: file.ufsUrl };
    }),

  campaignBanner: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const user = await getUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata: _metadata, file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;