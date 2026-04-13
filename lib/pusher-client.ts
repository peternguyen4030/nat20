import PusherJS from "pusher-js";

let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS | null {
  if (typeof window === "undefined") return null; // server-side guard

  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn("[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER — realtime disabled");
    return null;
  }

  if (!pusherClient) {
    console.log("[Pusher] Initializing client with key:", key, "cluster:", cluster);
    pusherClient = new PusherJS(key, { cluster });
  }

  return pusherClient;
}