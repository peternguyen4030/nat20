import PusherJS from "pusher-js";

if (
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher client environment variables");
}

// Singleton — reuse across the app
let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherClient) {
    pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}