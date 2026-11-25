import type { DialogueGraph } from "../types/dialogue";

const STORAGE_KEY = "dialogue-planner:graph";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveGraphDebounced(graph: DialogueGraph, delayMs = 400) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveGraph(graph);
  }, delayMs);
}


export function saveGraph(graph: DialogueGraph) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
}

// Older graphs stored `speaker: { id, displayName, ... }`; now it's just `speakerId`.
// Seeded character sheets reuse the old ids, so the id carries over directly.
function migrateGraph(graph: DialogueGraph): DialogueGraph {
  for (const box of Object.values(graph.boxes)) {
    if (box.kind !== "dialogue") continue;
    const legacy = box as unknown as { speaker?: { id: string } | null; speakerId?: string | null };
    if (legacy.speakerId === undefined) {
      legacy.speakerId = legacy.speaker?.id ?? null;
    }
    delete legacy.speaker;
  }
  return graph;
}

export function loadGraph(): DialogueGraph | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return migrateGraph(JSON.parse(raw) as DialogueGraph);
  } catch {
    return null; 
  }
}

export function exportGraphAsFile(graph: DialogueGraph) {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dialogue-graph-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importGraphFromFile(file: File): Promise<DialogueGraph> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(migrateGraph(JSON.parse(reader.result as string) as DialogueGraph));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}