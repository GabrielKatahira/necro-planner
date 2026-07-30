import { create } from "zustand";
import type { DialogueGraph, DialogueBox, Choice, ConditionBox, ConditionEvaluation, NodeMapping } from "../types/dialogue";
import { starterGraph } from "../data/starterGraph";
import { loadGraph, saveGraphDebounced } from "./persist";
import { Character } from "../types/character";

interface GraphStore {
  graph: DialogueGraph;

  addDialogueBox: (position: { x: number; y: number }) => string;
  updateDialogueBox: (id: string, patch: Partial<DialogueBox>) => void;
  
  addConditionBox: (position: { x: number; y: number }) => string;
  updateConditionBox: (id: string, patch: Partial<ConditionBox>) => void;

  addBox: (kind: string, position: { x: number; y: number }) => string;
  updateBox: <T extends keyof NodeMapping>(kind: T, id: string, patch: Partial<NodeMapping[T]>) => void;

  deleteBox: (id: string) => void;
  moveBox: (id: string, position: { x: number; y: number }) => void;
  
  resolveKeyToId: (key: string, graph: DialogueGraph) => string | null;
  resolveIdToKey: (id: string | null, graph: DialogueGraph) => string;

  addChoice: (boxId: string) => void;
  updateChoice: (boxId: string, choiceId: string, patch: Partial<Choice>) => void;
  deleteChoice: (boxId: string, choiceId: string) => void;

  addEvaluation: (boxId: string) => void;
  updateEvaluation: (boxId: string, evaluationId: string, patch: Partial<ConditionEvaluation>) => void;
  deleteEvaluation: (boxId: string, evaluationId: string) => void;

  setStartBox: (id: string) => void;
  resetGraph: (position: { x: number; y: number }) => void;
}

const nextId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const useGraphStore = create<GraphStore>((set) => ({
  graph: loadGraph() ?? starterGraph,

  addDialogueBox: (position) => {
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
            kind:"dialogue",
            text: "",
            choices: [],
            defaultNext: null,
            position,
          } satisfies DialogueBox,
        },
      },
    }));
    return id;
  },

  updateDialogueBox: (id, patch) =>
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: { ...state.graph.boxes[id], ...patch } as DialogueBox,
        },
      },
    })),

  addBox: (kind, position) => {
    const id = nextId("box");
    switch (kind) {
      case "dialogue":
        set((state) => ({
          graph: {
            ...state.graph,
            boxes: {
              ...state.graph.boxes,
              [id]: {
                id,
                key: "",
                speaker: Character.NARRATOR,
                kind:"dialogue",
                text: "",
                choices: [],
                defaultNext: null,
                position,
              } satisfies DialogueBox,
              },
          },
        }));
        break;
      case "condition":
        set((state) => ({
          graph: {
            ...state.graph,
            boxes: {
              ...state.graph.boxes,
              [id]: {
                id,
                key: "",
                kind:"condition",
                evaluations:[],
                fallback:"",
                position
              } satisfies ConditionBox,
            },
          },
        }));
        break;
    }
    return id;
  },

  updateBox: <T extends keyof NodeMapping>(kind: T, id: string, patch: Partial<NodeMapping[T]>) => {
    set((state) => {
      const currentBox = state.graph.boxes[id];

      if (!currentBox || currentBox.kind !== kind.toString()) {
        console.warn(`Cannot update: Box ${id} is not of type ${kind}`);
        return state;
      }

      return{
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [id]: { ...currentBox, ...patch } as NodeMapping[T]
          },
        },
      }
    })
  },

  addConditionBox: (position) => {
    const id = nextId("box");
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: {
            id,
            key: "",
            kind:"condition",
            evaluations:[],
            fallback:"",
            position
          } satisfies ConditionBox,
        },
      },
    }));
    return id;
  },

  updateConditionBox: (id, patch) =>
    set((state) => ({
      graph: {
        ...state.graph,
        boxes: {
          ...state.graph.boxes,
          [id]: { ...state.graph.boxes[id], ...patch } as ConditionBox,
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
      if (!box || box.kind != "dialogue") return state;
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
      if (!box || box.kind != "dialogue") return state;
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
      if (!box || box.kind != "dialogue") return state;
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

  addEvaluation: (boxId) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind != "condition") return state;
      const newEvaluation: ConditionEvaluation = {
        id: nextId("eval"),
        variable: "",
        evaluator: "==",
        value:"",
        next:""
      }
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: { ...box, evaluations: [...box.evaluations, newEvaluation] },
          },
        },
      };
    }),

  updateEvaluation: (boxId, evaluationId, patch) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind != "condition") return state;
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: {
              ...box,
              evaluations: box.evaluations.map((e) => (e.id === evaluationId ? { ...e, ...patch } : e)),
            },
          },
        },
      };
    }),

  deleteEvaluation: (boxId, evaluationId) =>
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind != "condition") return state;
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: { ...box, evaluations: box.evaluations.filter((e) => e.id !== evaluationId) },
          },
        },
      };
    }),

  setStartBox: (id) =>
    set((state) => ({
      graph: { ...state.graph, startBoxId: id },
    })),
    
  resetGraph: (position) =>
    set(() => {
      const startKey = window.prompt("Name your starting box key:");
      if (!startKey) {
        return { graph: { boxes: {}, startBoxId: null } };
      }

      const id = nextId("box");
      const startBox: DialogueBox = {
        id,
        key: startKey,
        kind: "dialogue",
        speaker: null,
        customSpeakerName: null,
        text: "New box",
        choices: [],
        defaultNext: null,
        position
      };

      return {
        graph: {
          boxes: { [id]: startBox },
          startBoxId: startBox.key,
        },
      };
  }),
}));

useGraphStore.subscribe((state) => {
  saveGraphDebounced(state.graph);
});
