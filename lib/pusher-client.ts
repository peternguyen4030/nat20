import PusherJS from "pusher-js";

let pusherClient: PusherJS | null = null;

function clientEnvOk(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
}

/** Returns `null` when public Pusher env is not set (board still works via polling / refresh). */
export function getPusherClient(): PusherJS | null {
  if (!clientEnvOk()) return null;
  if (!pusherClient) {
    pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}
