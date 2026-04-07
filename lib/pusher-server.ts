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

// Event names
export const PUSHER_EVENTS = {
  BOARD_UPDATED:    "board-updated",
  COMBAT_STARTED:   "combat-started",
  COMBAT_ENDED:     "combat-ended",
  TURN_ADVANCED:    "turn-advanced",
  INITIATIVE_ROLLED: "initiative-rolled",
  ACTION_TAKEN:     "action-taken",
} as const;