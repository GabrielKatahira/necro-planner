export const GameStateVar = {
  TRUST_MIRA: { id: "TRUST_MIRA", displayName: "Trust (Mira)", defaultValue: 0 },
  ACT: { id: "ACT", displayName: "Current Act", defaultValue: 1 },
} as const satisfies Record<string, { id: string; displayName: string; defaultValue: number }>;

export type GameStateVarId = keyof typeof GameStateVar;