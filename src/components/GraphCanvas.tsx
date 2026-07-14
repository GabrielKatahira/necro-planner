import { useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node, Edge, NodeChange } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/graphStore";
import DialogueBox from "./DialogueBox";
import type { DialogueGraph } from "../types/dialogue";

const nodeTypes = { dialogueBox: DialogueBox };

export default function GraphCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const moveBox = useGraphStore((s) => s.moveBox);
  const addBox = useGraphStore((s) => s.addBox);

  function findBoxByKey(key: string, graph: DialogueGraph) {
    return Object.values(graph.boxes).find((b) => b.key === key) ?? null;
  }

  const nodes: Node[] = useMemo(
    () =>
      Object.values(graph.boxes).map((box) => ({
        id: box.id,
        type: "dialogueBox",
        position: box.position,
        data: { box },
      })),
    [graph.boxes]
  );

  const edges: Edge[] = useMemo(() => {
  const list: Edge[] = [];
  Object.values(graph.boxes).forEach((box) => {
      box.choices.forEach((choice) => {
        if (typeof choice.next === "string" && choice.next) {
          const target = findBoxByKey(choice.next, graph);
          if (target) {
            list.push({
              id: `${box.id}-${choice.id}`,
              source: box.id,
              sourceHandle: `${box.id}-${choice.id}`,
              target: target.id,
            });
          }
        } else if (typeof choice.next === "object") {
          const trueTarget = findBoxByKey(choice.next.ifTrue, graph);
          if (trueTarget) {
            list.push({
              id: `${box.id}-${choice.id}-true`,
              source: box.id,
              target: trueTarget.id,
              label: `${choice.prompt || "(auto)"} [true]`,
            });
          }
          const falseTarget = findBoxByKey(choice.next.ifFalse, graph);
          if (falseTarget) {
            list.push({
              id: `${box.id}-${choice.id}-false`,
              source: box.id,
              target: falseTarget.id,
              label: `${choice.prompt || "(auto)"} [false]`,
            });
          }
        }
      });

      if (box.defaultNext) {
        const target = findBoxByKey(box.defaultNext, graph);
        if (target) {
          list.push({
            id: `${box.id}-default`,
            source: box.id,
            sourceHandle: `${box.id}-default`,
            target: target.id,
            style: { strokeDasharray: "4 4"},
          });
        }
      }
    });
    return list;
  }, [graph.boxes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          moveBox(change.id, change.position);
        }
      });
    },
    [moveBox]
  );

  const handleAddBox = () => {
    addBox({ x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
  };

  return (
    <div className="graph-canvas-wrapper">
      <div className="toolbar">
        <button onClick={handleAddBox}>+ Add Box</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
      >
      </ReactFlow>
    </div>
  );
}
