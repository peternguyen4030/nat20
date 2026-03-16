import { createAuthClient } from "better-auth/react";

/**
 * Auth client base URL: in the browser we always use the current origin
 * so localhost stays on localhost and production stays on production.
 * Only use env in SSR or when explicitly overriding (e.g. in tests).
 */
function getAuthBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});
