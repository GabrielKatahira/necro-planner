import type { DialogueGraph } from "../types/dialogue";

const STORAGE_KEY = "dialogue-planner:graph";

export function saveGraph(graph: DialogueGraph) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
}

export function loadGraph(): DialogueGraph | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DialogueGraph;
  } catch {
    return null; 
  }
}