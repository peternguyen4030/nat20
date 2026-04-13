// Shared Pusher event name constants — safe to import on both client and server.
// Keep this file free of any Node.js-only imports.
export const PUSHER_EVENTS = {
    BOARD_UPDATED:     "board-updated",
    COMBAT_STARTED:    "combat-started",
    COMBAT_ENDED:      "combat-ended",
    TURN_ADVANCED:     "turn-advanced",
    INITIATIVE_ROLLED: "initiative-rolled",
    ACTION_TAKEN:      "action-taken",
    INITIATIVE_NOTIFY: "initiative-notify",
  } as const;