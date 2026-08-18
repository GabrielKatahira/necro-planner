import { create } from "zustand";
import type { DialogueGraph, DialogueBox, Choice, ConditionBox, ConditionEvaluation, NodeMapping, ChoiceConditionBox, VisibilityCheck } from "../types/dialogue";
import { starterGraph } from "../data/starterGraph";
import { loadGraph, saveGraphDebounced } from "./persist";
import { Character } from "../types/character";
import type { Edge } from "reactflow";

interface GraphStore {
  graph: DialogueGraph;

  addBox: (kind: string, position: { x: number; y: number }) => string;
  updateBox: <T extends keyof NodeMapping>(kind: T, id: string, patch: Partial<NodeMapping[T]>) => void;

  deleteBox: (id: string) => void;
  moveBox: (id: string, position: { x: number; y: number }) => void;

  //obsolete
  
  //resolveKeyToId: (key: string, graph: DialogueGraph) => string | null; 
  //resolveIdToKey: (id: string | null, graph: DialogueGraph) => string; 

  addChoice: (boxId: string) => void;
  updateChoice: (boxId: string, choiceId: string, patch: Partial<Choice>) => void;
  deleteChoice: (boxId: string, choiceId: string) => void;

  addChoiceCondition: (boxId: string, choiceId: string, position: {x: number, y: number}) => void;
  deleteChoiceCondition: (choiceConditionId: string) => void;
  addChoiceConditionCheck: (boxId: string) => void;
  updateChoiceConditionCheck: (boxId:string, checkId:string, patch: Partial<VisibilityCheck>) => void;
  deleteChoiceConditionCheck: (boxId:string, checkId:string) => void;

  addEvaluation: (boxId: string) => void;
  updateEvaluation: (boxId: string, evaluationId: string, patch: Partial<ConditionEvaluation>) => void;
  deleteEvaluation: (boxId: string, evaluationId: string) => void;

  connectNodes: (connection: { source: string | null; sourceHandle: string | null; target: string | null; targetHandle: string | null }) => void;
  onEdgesDelete: (edges: Edge[]) => void;

  setStartBox: (id: string) => void;
  resetGraph: (position: { x: number; y: number }) => void;
}

const nextId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const useGraphStore = create<GraphStore>((set) => ({
  graph: loadGraph() ?? starterGraph,

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

  deleteBox: (id) =>
    set((state) => {
      const boxes = { ...state.graph.boxes };
      delete boxes[id];
      Object.keys(boxes).forEach((key) => {
        const box = boxes[key];
        if (box.kind === "choiceCondition" && box.parentId === id) {
          delete boxes[key];
        }
      });
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
    connectNodes: (connection) =>
  set((state) => {
    const { source, sourceHandle, target } = connection;
    if (!source || !sourceHandle || !target) return state;

    const sourceBox = state.graph.boxes[source];
    if (!sourceBox) return state;

    const updatedBoxes = { ...state.graph.boxes };

    if (sourceBox.kind === "dialogue") {
      if (sourceHandle === `${source}-default`) {
        updatedBoxes[source] = { ...sourceBox, defaultNext: target };
      } else {
        const choices = sourceBox.choices.map((choice) => {
          if (`${source}-${choice.id}` === sourceHandle) {
            return { ...choice, next: target };
          }
          return choice;
        });
        updatedBoxes[source] = { ...sourceBox, choices };
      }
    }

    if (sourceBox.kind === "condition") {
      if (sourceHandle === `${source}-fallback`) {
        updatedBoxes[source] = { ...sourceBox, fallback: target };
      } else {
        const evaluations = sourceBox.evaluations.map((evalItem) => {
          if (`${source}-${evalItem.id}` === sourceHandle) {
            return { ...evalItem, next: target };
          }
          return evalItem;
        });
        updatedBoxes[source] = { ...sourceBox, evaluations };
      }
    }

    return { graph: { ...state.graph, boxes: updatedBoxes } };
  }),

onEdgesDelete: (deletedEdges) =>
  set((state) => {
    const updatedBoxes = { ...state.graph.boxes };

    deletedEdges.forEach((edge) => {
      const sourceBox = updatedBoxes[edge.source];
      if (!sourceBox) return;

      if (sourceBox.kind === "dialogue") {
        if (edge.sourceHandle === `${edge.source}-default`) {
          updatedBoxes[edge.source] = { ...sourceBox, defaultNext: null };
        } else {
          const choices = sourceBox.choices.map((choice) =>
            `${edge.source}-${choice.id}` === edge.sourceHandle ? { ...choice, next: "" } : choice
          );
          updatedBoxes[edge.source] = { ...sourceBox, choices };
        }
      }

      if (sourceBox.kind === "condition") {
        if (edge.sourceHandle === `${edge.source}-fallback`) {
          updatedBoxes[edge.source] = { ...sourceBox, fallback: "" };
        } else {
          const evaluations = sourceBox.evaluations.map((evalItem) =>
            `${edge.source}-${evalItem.id}` === edge.sourceHandle ? { ...evalItem, next: "" } : evalItem
          );
          updatedBoxes[edge.source] = { ...sourceBox, evaluations };
        }
      }
    });

    return { graph: { ...state.graph, boxes: updatedBoxes } };
  }),

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

      const targetChoice = box.choices.find((c) => c.id === choiceId);
      const boxes = { ...state.graph.boxes };

      if (targetChoice?.choiceConditionId && boxes[targetChoice.choiceConditionId]) {
        delete boxes[targetChoice.choiceConditionId];
      }
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
  addChoiceCondition: (boxId: string, choiceId: string, position: { x: number; y: number }) => {
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind !== "dialogue") return state;

      const conditionId = nextId("cc");

      const newChoiceConditionBox: ChoiceConditionBox = {
        id: conditionId,
        kind: "choiceCondition",
        parentId: boxId, 
        checks: [],
        position,
      };

      const updatedChoices = box.choices.map((c) =>
        c.id === choiceId ? { ...c, choiceConditionId: conditionId } : c
      );

      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [conditionId]: newChoiceConditionBox,
            [boxId]: {
              ...box,
              choices: updatedChoices,
            },
          },
        },
      };
    });
  },

  deleteChoiceCondition:(choiceConditionId) =>{
    set((state) =>{
      const conditionBox = state.graph.boxes[choiceConditionId];
      if (!conditionBox || conditionBox.kind !== "choiceCondition") return state;

      const boxes = { ...state.graph.boxes };

      delete boxes[choiceConditionId];

      const parentBox = boxes[conditionBox.parentId];
      if (parentBox && parentBox.kind === "dialogue") {
        boxes[conditionBox.parentId] = {
          ...parentBox,
          choices: parentBox.choices.map((choice) =>
            choice.choiceConditionId === choiceConditionId
              ? { ...choice, choiceConditionId: undefined }
              : choice
          ),
        };
      }

      return {
        graph: {
          ...state.graph,
          boxes,
        },
      };
    })
  },

  addChoiceConditionCheck: (boxId) => 
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind != "choiceCondition") return state;
      const newCheck: VisibilityCheck = {
        id: nextId("cc-chk"),
        variable: "",
        evaluator: "==",
        value: ""
      }
      return {
        graph: {
          ...state.graph,
          boxes: {
            ...state.graph.boxes,
            [boxId]: {...box,checks:[...box.checks, newCheck]},
          },
        },
      };
    }),
  
  updateChoiceConditionCheck: (boxId,checkId,patch) => 
    set((state) => {
      const box = state.graph.boxes[boxId];
      if (!box || box.kind != "choiceCondition") return state;
      return {
        graph: {
          ...state.graph,
          boxes:{
            ...state.graph.boxes,
            [boxId]:{
              ...box,
              checks: box.checks.map((c) => (c.id === checkId ? {...c,...patch} : c)),
            },
          },
        },
      };
    }),
  
    deleteChoiceConditionCheck : (boxId,checkId) => 
      set((state) => {
        const box = state.graph.boxes[boxId];
        if (!box || box.kind != "choiceCondition") return state;
        return {
          graph: {
            ...state.graph,
            boxes: {
              ...state.graph.boxes,
              [boxId]: {...box,checks: box.checks.filter((c) => c.id !== checkId)},
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
          startBoxId: startBox.id,
        },
      };
  }),
}));

useGraphStore.subscribe((state) => {
  saveGraphDebounced(state.graph);
});
