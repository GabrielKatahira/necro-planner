import type { CharacterSheet } from "../types/characterSheet";

// Special speakers that don't have a character sheet.
export const SPEAKER_NARRATOR = "NARRATOR";
export const SPEAKER_CUSTOM = "CUSTOM";

export function speakerDisplayName(
  speakerId: string | null,
  customName: string | null | undefined,
  sheets: Record<string, CharacterSheet>
): string {
  if (speakerId === null) return "";
  if (speakerId === SPEAKER_NARRATOR) return "Narrator";
  if (speakerId === SPEAKER_CUSTOM) return customName ?? "";
  const sheet = sheets[speakerId];
  return sheet ? sheet.name || "Unnamed" : "(deleted character)";
}
