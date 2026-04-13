import Pusher from "pusher";

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher server environment variables");
}

export const pusherServer = new Pusher({
  appId:   process.env.PUSHER_APP_ID,
  key:     process.env.PUSHER_KEY,
  secret:  process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS:  true,
});

// Channel name helper — scoped per campaign
export function campaignChannel(campaignId: string) {
  return `campaign-${campaignId}`;
}

// Re-export from shared file so server routes can import from one place
export { PUSHER_EVENTS } from "@/lib/pusher-events";