import { useMemo, useCallback, useRef } from "react";
import ReactFlow from "reactflow";
import type { Node, Edge, NodeChange } from "reactflow";
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

  const nodesCacheRef = useRef<Map<string, Node>>(new Map());

  const prevNodesArrayRef = useRef<Node[]>([]);

  const nodes: Node[] = useMemo(() => {
    const list: Node[] = [];
    const nextCache = new Map<string, Node>();

    Object.values(graph.boxes).forEach((box) => {
      const prev = nodesCacheRef.current.get(box.id);
      if (prev && prev.data.box === box) {
        nextCache.set(box.id, prev);
        list.push(prev);
        return;
      }
      const node: Node = { id: box.id, type: box.kind + "Box", position: box.position, data: { box } };
      nextCache.set(box.id, node);
      list.push(node);
    });

    nodesCacheRef.current = nextCache;

    const prevArray = prevNodesArrayRef.current;
    const sameArray =
      prevArray.length === list.length && prevArray.every((n, i) => n === list[i]);

    const finalList = sameArray ? prevArray : list;
    prevNodesArrayRef.current = finalList;
    return finalList;
  }, [graph.boxes]);

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

  const dragUpdateThrottle = useRef<number | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          if (change.dragging === false) {
            if (dragUpdateThrottle.current) {
              clearTimeout(dragUpdateThrottle.current);
              dragUpdateThrottle.current = null;
            }
            moveBox(change.id, change.position);
          } else {
            if (dragUpdateThrottle.current) return;
            dragUpdateThrottle.current = window.setTimeout(() => {
              moveBox(change.id, change.position!);
              dragUpdateThrottle.current = null;
            }, 50); 
          }
        }
      });
    },
    [moveBox]
  );



  return (
    <div className="graph-canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
