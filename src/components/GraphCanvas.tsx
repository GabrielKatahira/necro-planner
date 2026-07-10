import { useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node, Edge, NodeChange } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/graphStore";
import DialogueBox from "./DialogueBox";

const nodeTypes = { dialogueBox: DialogueBox };

export default function GraphCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const moveBox = useGraphStore((s) => s.moveBox);
  const addBox = useGraphStore((s) => s.addBox);

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
        if (typeof choice.next === "string" && choice.next && graph.boxes[choice.next]) {
          list.push({
            id: `${box.id}-${choice.id}`,
            source: box.id,
            target: choice.next,
            label: choice.prompt || "(auto)",
          });
        } else if (typeof choice.next === "object") {
          if (graph.boxes[choice.next.ifTrue]) {
            list.push({
              id: `${box.id}-${choice.id}-true`,
              source: box.id,
              target: choice.next.ifTrue,
              label: `${choice.prompt || "(auto)"} [true]`,
            });
          }
          if (graph.boxes[choice.next.ifFalse]) {
            list.push({
              id: `${box.id}-${choice.id}-false`,
              source: box.id,
              target: choice.next.ifFalse,
              label: `${choice.prompt || "(auto)"} [false]`,
            });
          }
        }
      });
      if (box.defaultNext && graph.boxes[box.defaultNext]) {
        list.push({
          id: `${box.id}-default`,
          source: box.id,
          target: box.defaultNext,
          label: "(default)",
          style: { strokeDasharray: "4 4" },
        });
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
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
