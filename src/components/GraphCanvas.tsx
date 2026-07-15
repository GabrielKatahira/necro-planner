import { useMemo, useCallback, useRef } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node, Edge, NodeChange } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/graphStore";
import DialogueBox from "./DialogueBox";
import type { DialogueGraph } from "../types/dialogue";
import ConditionBox from "./ConditionBox";
import { exportGraphAsFile,importGraphFromFile } from "../store/persist";
import StarfieldBackground from "./StarfieldBackground";

const nodeTypes = { dialogueBox: DialogueBox, conditionBox : ConditionBox};

export default function GraphCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const moveBox = useGraphStore((s) => s.moveBox);
  const addDialogueBox = useGraphStore((s) => s.addDialogueBox);
  const addConditionBox = useGraphStore((s) => s.addConditionBox);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function findBoxByKey(key: string, graph: DialogueGraph) {
    return Object.values(graph.boxes).find((b) => b.key === key) ?? null;
  }

  const nodes: Node[] = useMemo(
    () =>
      Object.values(graph.boxes).map((box) => ({
        id: box.id,
        type: box.kind+"Box",
        position: box.position,
        data: { box },
      })),
    [graph.boxes]
  );

  const edges: Edge[] = useMemo(() => {
  const list: Edge[] = [];
  Object.values(graph.boxes).forEach((box) => {
      if(box.kind=== "dialogue"){
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
      }

      if (box.kind === "condition") {
        box.evaluations.forEach((evaluation) => {
          if (typeof evaluation.next === "string" && evaluation.next) {
            const target = findBoxByKey(evaluation.next, graph);
            if(target) {
              list.push({
                id: `${box.id}-${evaluation.id}`,
                source: box.id,
                sourceHandle: `${box.id}-${evaluation.id}`,
                target: target.id
              })
            }
          }
        })

        if(box.fallback) {
          const target = findBoxByKey(box.fallback, graph);
          if (target) {
            list.push({
              id: `${box.id}-fallback`,
              source: box.id,
              sourceHandle: `${box.id}-fallback`,
              target: target.id,
              style: { strokeDasharray: "4 4"},
            });
          }
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

  const handleAddDialogueBox = () => {
    addDialogueBox({ x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
  };

  const handleAddConditionBox = () => {
    addConditionBox({ x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 });
  };



  return (
    <div className="graph-canvas-wrapper">
      <div className="toolbar">
        <button onClick={handleAddDialogueBox}>+ Add Dialogue Box</button>
        <button onClick={handleAddConditionBox}>+ Add Condition Box</button>
      </div>
      <div className="jsonbar">
        <button onClick={() => exportGraphAsFile(graph)}>Export JSON</button>
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const imported = await importGraphFromFile(file);
            useGraphStore.setState({ graph: imported });
          }}
        />
        <button onClick={() => fileInputRef.current?.click()}>Import JSON</button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <StarfieldBackground width={4000} height={4000}/>
      </ReactFlow>
    </div>
  );
}
