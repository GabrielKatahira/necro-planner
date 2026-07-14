import type { DialogueGraph } from "../types/dialogue";
import { Character } from "../types/character";

export const starterGraph: DialogueGraph = {
  startBoxId: "box_1",
  boxes: {
    box_1: {
      id: "box_1",
      key:"sample_1",
      speaker: Character.NARRATOR,
      text: "You arrive at the crossroads. The signpost is broken.",
      choices: [
        {
          id: "choice_1a",
          prompt: "Go left",
          next: "box_2",
        },
        {
          id: "choice_1b",
          prompt: "Go right",
          next: "box_3",
        },
      ],
      defaultNext: null,
      position: { x: 0, y: 0 },
    },
    box_2: {
      id: "box_2",
      key:"sample_2",
      speaker: Character.NARRATOR,
      text: "The left path leads into a quiet forest.",
      choices: [],
      defaultNext: null,
      position: { x: -250, y: 200 },
    },
    box_3: {
      id: "box_3",
      key:"sample_1",
      speaker: Character.NARRATOR,
      text: "The right path leads to a rocky cliff.",
      choices: [],
      defaultNext: null,
      position: { x: 250, y: 200 },
    },
  },
};
