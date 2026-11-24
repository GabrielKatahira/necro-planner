export interface CharacterSheet {
  id: string;
  name: string;
  position: { x: number; y: number };
  // Free-form strings: ages and birthdays in fiction are rarely clean numbers/dates.
  age: string;
  birthday: string;
  aliases: string;
  personality: string;
  backstory: string;
}

export interface CharacterBoard {
  sheets: Record<string, CharacterSheet>;
}

export const emptySheetFields = {
  age: "",
  birthday: "",
  aliases: "",
  personality: "",
  backstory: "",
};
