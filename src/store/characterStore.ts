import { create } from "zustand";
import type { CharacterBoard, CharacterSheet } from "../types/characterSheet";
import { emptySheetFields } from "../types/characterSheet";
import { Character } from "../types/character";

const STORAGE_KEY = "dialogue-planner:characters";

function seedBoard(): CharacterBoard {
  const sheets: Record<string, CharacterSheet> = {};
  Object.values(Character)
    .filter((c) => c.id !== "NARRATOR" && c.id !== "CUSTOM")
    .forEach((c, i) => {
      sheets[c.id] = {
        id: c.id,
        name: c.displayName,
        position: { x: (i % 3) * 340, y: Math.floor(i / 3) * 260 },
        ...emptySheetFields,
      };
    });
  return { sheets };
}

// Validates parsed JSON and fills in fields added after the board was first saved.
// Throws if the data isn't a character board.
export function normalizeBoard(data: unknown): CharacterBoard {
  const sheets = (data as CharacterBoard | null)?.sheets;
  if (!sheets || typeof sheets !== "object") throw new Error("Not a character board");
  const out: Record<string, CharacterSheet> = {};
  for (const [id, sheet] of Object.entries(sheets)) {
    out[id] = { ...emptySheetFields, ...sheet, id, position: sheet.position ?? { x: 0, y: 0 } };
  }
  return { sheets: out };
}

function loadBoard(): CharacterBoard {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeBoard(JSON.parse(raw));
  } catch {
    // fall through to seed
  }
  return seedBoard();
}

export function exportBoardAsFile(board: CharacterBoard) {
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `characters-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBoardFromFile(file: File): Promise<CharacterBoard> {
  return normalizeBoard(JSON.parse(await file.text()));
}

interface CharacterStore {
  board: CharacterBoard;
  openId: string | null;
  openSheet: (id: string) => void;
  closeSheet: () => void;
  addSheet: (position: { x: number; y: number }) => string;
  updateSheet: (id: string, patch: Partial<Omit<CharacterSheet, "id">>) => void;
  moveSheet: (id: string, position: { x: number; y: number }) => void;
  deleteSheet: (id: string) => void;
  replaceBoard: (board: CharacterBoard) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  board: loadBoard(),
  openId: null,
  openSheet: (id) => set({ openId: id }),
  closeSheet: () => set({ openId: null }),

  addSheet: (position) => {
    const id = `char_${crypto.randomUUID()}`;
    set((s) => ({
      board: {
        sheets: {
          ...s.board.sheets,
          [id]: { id, name: "New Character", position, ...emptySheetFields },
        },
      },
    }));
    return id;
  },

  updateSheet: (id, patch) =>
    set((s) => {
      const sheet = s.board.sheets[id];
      if (!sheet) return s;
      return { board: { sheets: { ...s.board.sheets, [id]: { ...sheet, ...patch } } } };
    }),

  moveSheet: (id, position) =>
    set((s) => {
      const sheet = s.board.sheets[id];
      if (!sheet) return s;
      return { board: { sheets: { ...s.board.sheets, [id]: { ...sheet, position } } } };
    }),

  replaceBoard: (board) => set({ board, openId: null }),

  deleteSheet: (id) =>
    set((s) => {
      const rest = { ...s.board.sheets };
      delete rest[id];
      return { board: { sheets: rest } };
    }),
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSavedBoard: CharacterBoard | null = null;
useCharacterStore.subscribe((state) => {
  if (state.board === lastSavedBoard) return;
  lastSavedBoard = state.board;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.board));
  }, 400);
});
