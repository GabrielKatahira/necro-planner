export interface CharacterDef {
  id: string;
  displayName: string;
  portrait?: string; 
}

export const Character = {
  NARRATOR: { id: "NARRATOR", displayName: "", portrait: undefined },
  CUSTOM: { id:"CUSTOM", displayName: "", portrait: undefined },
  YORUME: { id: "YORUME", displayName: "Yorume", portrait: undefined },
  KUROSACHI: { id: "KUROSACHI", displayName: "Kurosachi", portrait: undefined },
} as const satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof Character;