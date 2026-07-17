export interface CharacterDef {
  id: string;
  displayName: string;
  portrait?: string; 
}

export const Character = {
  NARRATOR: { id: "NARRATOR", displayName: "", portrait: undefined },
  CUSTOM: { id:"CUSTOM", displayName: "", portrait: undefined },
  YORUME: { id: "YORUME", displayName: "Yorume", portrait: "portraits/yorume.png" },
  KUROSACHI: { id: "KUROSACHI", displayName: "Kurosachi", portrait: "portraits/kurosachi.png" },
  PRISCI: { id: "PRISCI", displayName: "Prisci", portrait: "portraits/prisci.png" },
  TOKI: { id: "TOKI", displayName: "Toki", portrait: "portraits/toki.png" },
} as const satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof Character;