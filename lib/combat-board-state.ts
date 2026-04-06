/**
 * Shape of entries in boardState.initiativeOrder (JSON on CampaignBoard).
 */
export interface InitiativeOrderEntry {
  key: string;
  initiative?: number;
  rolled?: boolean;
  actionUsed?: boolean;
  bonusActionUsed?: boolean;
  reactionUsed?: boolean;
}

/**
 * Subset of boardState JSON we read/write in combat routes.
 */
export interface CombatBoardStateJson {
  initiativeOrder?: InitiativeOrderEntry[];
  currentTurnIndex?: number;
  round?: number;
  combatSessionId?: string | null;
  combatActive?: boolean;
  tokens?: Record<string, unknown>;
  [key: string]: unknown;
}

export function parseCombatBoardState(raw: unknown): CombatBoardStateJson {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as CombatBoardStateJson;
  }
  return {};
}
