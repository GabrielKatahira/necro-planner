import { create } from "zustand";
import type { DialogueGraph, DialogueBox, Choice } from "../types/dialogue";
import { starterGraph } from "../data/starterGraph";
import { saveGraph,loadGraph } from "./persist";
import { Character } from "../types/character";

interface GraphStore {
  graph: DialogueGraph;

  addBox: (position: { x: number; y: number }) => string;
  updateBox: (id: string, patch: Partial<DialogueBox>) => void;
  deleteBox: (id: string) => void;
  moveBox: (id: string, position: { x: number; y: number }) => void;

  resolveKeyToId: (key: string, graph: DialogueGraph) => string | null;
  resolveIdToKey: (id: string | null, graph: DialogueGraph) => string;

  addChoice: (boxId: string) => void;
  updateChoice: (boxId: string, choiceId: string, patch: Partial<Choice>) => void;
  deleteChoice: (boxId: string, choiceId: string) => void;

  setStartBox: (id: string) => void;
}

const nextId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const useGraphStore = create<GraphStore>((set) => ({
  graph: loadGraph() ?? starterGraph,

  addBox: (position) => {
    const id = nextId("box");
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: {
            id,
            key: "",
            speaker: Character.NARRATOR,
            text: "",
            choices: [],
            defaultNext: null,
            position,
          },
        },
      },
    }));
    return id;
  },

  updateBox: (id, patch) =>
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: { ...state.graph.boxes[id], ...patch },
        },
      },
    })),

  deleteBox: (id) =>
    set((state) => {
      const boxes = { ...state.graph.boxes };
      delete boxes[id];
      return {
        graph: {
          ...state.graph,
          boxes,
          startBoxId: state.graph.startBoxId === id ? null : state.graph.startBoxId,
        },
      };
    }),

  moveBox: (id, position) =>
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: { ...state.graph.boxes[id], position },
        },
      },
    })),

  resolveKeyToId: (key, graph) => {
    if (!key) return null;
    const match = Object.values(graph.boxes).find((b) => b.key === key);
    return match ? match.id : null;
  },

  resolveIdToKey: (id, graph) => {
    if (!id) return "";
    return graph.boxes[id]?.key ?? "";
  },

  addChoice: (boxId) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box) return state;
      const newChoice: Choice = {
        id: nextId("choice"),
        prompt: "",
        next: "",
      };
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: { ...box, choices: [...box.choices, newChoice] },
          },
        },
      };
    }),

  updateChoice: (boxId, choiceId, patch) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box) return state;
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: {
              ...box,
              choices: box.choices.map((c) => (c.id === choiceId ? { ...c, ...patch } : c)),
            },
          },
        },
      };
    }),

  deleteChoice: (boxId, choiceId) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box) return state;
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: { ...box, choices: box.choices.filter((c) => c.id !== choiceId) },
          },
        },
      };
    }),

  setStartBox: (id) =>
    set((state) => ({
      graph: { ...state.graph, startBoxId: id },
    })),
    
}));

useGraphStore.subscribe((state) => {
  saveGraph(state.graph);
});
