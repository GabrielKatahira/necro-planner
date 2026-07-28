import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactFlow from "reactflow";
import type { Node, Edge } from "reactflow";
import { useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/graphStore";
import DialogueBox from "./DialogueBox";
import ConditionBox from "./ConditionBox";
import Toolbar from "./Toolbar";
import StarfieldBackground from "./StarfieldBackground";
import type { GraphNode } from "../types/dialogue";

const nodeTypes = { dialogueBox: DialogueBox, conditionBox : ConditionBox};

export default function GraphCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const moveBox = useGraphStore((s) => s.moveBox);
  const edgesRef = useRef<Map<string, Edge>>(new Map());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  useEffect(() => {
  const nextNodes = Object.values(graph.boxes).map((box) => ({
    id: box.id,
    type: box.kind + "Box",
    position: box.position,
    data: { box },
  }));
  setNodes(nextNodes);
  }, [graph.boxes, setNodes]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      moveBox(node.id, node.position);
    },
    [moveBox]
  );

  const keyToBox = useMemo(() => {
    const map = new Map<string, GraphNode>();
    Object.values(graph.boxes).forEach((box) => map.set(box.key, box));
    return map;
  }, [graph.boxes]);


  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];
    const nextEdgeMap = new Map<string, Edge>();

    function makeOrReuseEdge(id: string, source: string, sourceHandle: string, target: string, style?: any) {
      const prev = edgesRef.current.get(id);
      
      if (prev && prev.source === source && prev.target === target && prev.sourceHandle === sourceHandle) {
        nextEdgeMap.set(id, prev);
        return prev;
      }
      const edge: Edge = { id, source, sourceHandle, target, style };
      nextEdgeMap.set(id, edge);
      return edge;
    }

    Object.values(graph.boxes).forEach((box) => {
      if (box.kind === "dialogue") {
        box.choices.forEach((choice) => {
          if (typeof choice.next === "string" && choice.next) {
            const target = keyToBox.get(choice.next);
            if (target) list.push(makeOrReuseEdge(`${box.id}-${choice.id}`, box.id, `${box.id}-${choice.id}`, target.id));
          }
        });
        if (box.defaultNext) {
          const target = keyToBox.get(box.defaultNext);
          if (target) list.push(makeOrReuseEdge(`${box.id}-default`, box.id, `${box.id}-default`, target.id, { strokeDasharray: "4 4" }));
        }
      }
      if (box.kind === "condition") {
        box.evaluations.forEach((evaluation) => {
          if (typeof evaluation.next === "string" && evaluation.next) {
            const target = keyToBox.get(evaluation.next);
            if (target) list.push(makeOrReuseEdge(`${box.id}-${evaluation.id}`, box.id, `${box.id}-${evaluation.id}`, target.id));
          }
        });
        if (box.fallback) {
          const target = keyToBox.get(box.fallback);
          if (target) list.push(makeOrReuseEdge(`${box.id}-fallback`, box.id, `${box.id}-fallback`, target.id, { strokeDasharray: "4 4" }));
        }
      }
    });

    edgesRef.current = nextEdgeMap;
    return list;
}, [graph.boxes, keyToBox]);

  return (
    <div className="graph-canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        onlyRenderVisibleElements
      >
        <StarfieldBackground/>
        <Toolbar/>
      </ReactFlow>
    </div>
  );
}
