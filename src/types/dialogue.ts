import { GameStateVar } from "./gamestate";
import type { CharacterDef } from "./character";

export type Evaluator = "==" | "!=" | ">" | "<" | ">=" | "<=";

export interface Condition {
  variable: typeof GameStateVar;
  evaluator: Evaluator;
  value: number;
  ifTrue: string; // box id
  ifFalse: string; // box id
}

export interface Choice {
  id: string;
  prompt: string; 
  next: string | Condition;
}

export interface DialogueBox {
  id: string;
  speaker: CharacterDef | null;
  customSpeakerName?: string | null;
  text: string;
  choices: Choice[]; 
  defaultNext: string | null; 
  position: { x: number; y: number };
}

export interface DialogueGraph {
  boxes: Record<string, DialogueBox>;
  startBoxId: string | null;
}