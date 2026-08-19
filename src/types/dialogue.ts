
import type { CharacterDef } from "./character";

export const EVALUATORS = [
  "==",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
] as const;

export type Evaluator = typeof EVALUATORS[number];

export interface Choice {
  id: string;
  prompt: string; 
  next: string | null;
  choiceConditionId?: string;
}

export interface DialogueBox {
  id: string;
  kind: "dialogue";
  speaker: CharacterDef | null;
  customSpeakerName?: string | null;
  text: string;
  choices: Choice[]; 
  defaultNext: string | null; 
  position: { x: number; y: number };
}

export interface DialogueGraph {
  boxes: Record<string, GraphNode>;
  startBoxId: string | null;
}

export interface ConditionEvaluation {
  id: string;
  variable: string;
  evaluator: Evaluator;
  value: string | number;
  next: string | null;
}

export interface ConditionBox {
  id: string;
  kind: "condition";
  evaluations: ConditionEvaluation[];
  fallback: string;
  position: { x: number; y: number };
}

export interface VisibilityCheck {
  id: string;
  variable: string;
  evaluator: Evaluator;
  value: string;
}

export interface ChoiceConditionBox {
  id: string;
  kind: "choiceCondition";
  parentId: string;
  checks: VisibilityCheck[]; 
  position: { x: number; y: number };
}

export type GraphNode = DialogueBox | ConditionBox | ChoiceConditionBox
export interface NodeMapping {
  dialogue: DialogueBox;
  condition: ConditionBox;
  choiceCondition: ChoiceConditionBox;
}