import Pusher from "pusher";

function pusherEnvOk(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  );
}

let pusherInstance: Pusher | null = null;

function getPusher(): Pusher | null {
  if (!pusherEnvOk()) return null;
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId:   process.env.PUSHER_APP_ID!,
      key:     process.env.PUSHER_KEY!,
      secret:  process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS:  true,
    });
  }
  return pusherInstance;
}

/** Same API as `Pusher.prototype.trigger`; resolves immediately when Pusher is not configured (e.g. `next build`, CI). */
export const pusherServer = {
  trigger(channel: string | string[], event: string, data: object): Promise<unknown> {
    const client = getPusher();
    if (!client) return Promise.resolve();
    return client.trigger(channel, event, data);
  },
};

export function campaignChannel(campaignId: string) {
  return `campaign-${campaignId}`;
}

export const PUSHER_EVENTS = {
  BOARD_UPDATED:     "board-updated",
  COMBAT_STARTED:    "combat-started",
  COMBAT_ENDED:      "combat-ended",
  TURN_ADVANCED:     "turn-advanced",
  INITIATIVE_ROLLED: "initiative-rolled",
  ACTION_TAKEN:      "action-taken",
} as const;
