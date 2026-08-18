import { useMemo, useCallback, useRef, useEffect } from "react";
import ReactFlow from "reactflow";
import type { Node, Edge, Connection } from "reactflow";
import { useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { useGraphStore } from "../store/graphStore";
import DialogueBox from "./DialogueBox";
import ConditionBox from "./ConditionBox";
import ChoiceConditionBox from "./ChoiceConditionBox";
import Toolbar from "./Toolbar";
import StarfieldBackground from "./StarfieldBackground";

const nodeTypes = { dialogueBox: DialogueBox, conditionBox : ConditionBox, choiceConditionBox: ChoiceConditionBox};

export default function GraphCanvas() {
  const graph = useGraphStore((s) => s.graph);
  const moveBox = useGraphStore((s) => s.moveBox);

  const connectNodes = useGraphStore((s) => s.connectNodes);
  const onEdgesDelete = useGraphStore((s) => s.onEdgesDelete);

  const edgesRef = useRef<Map<string, Edge>>(new Map());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const onConnect = useCallback(
    (connection: Connection) => {
      connectNodes(connection);
    },
    [connectNodes]
  );

  useEffect(() => {
  const nextNodes = Object.values(graph.boxes).map((box) => ({
    id: box.id,
    type: box.kind + "Box",
    position: box.position,
    parentId: box.kind === "choiceCondition" ? box.parentId : undefined,
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


  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = [];
    const nextEdgeMap = new Map<string, Edge>();

    function makeOrReuseEdge(id: string, source: string, sourceHandle: string, target: string, targetHandle?: string, style?: any) {
      const prev = edgesRef.current.get(id);
      if (
        prev &&
        prev.source === source &&
        prev.target === target &&
        prev.sourceHandle === sourceHandle &&
        prev.targetHandle === targetHandle
      ) {
        nextEdgeMap.set(id, prev);
        return prev;
      }
      const edge: Edge = { id, source, sourceHandle, target, targetHandle, style };
      nextEdgeMap.set(id, edge);
      return edge;
    }

    Object.values(graph.boxes).forEach((box) => {
      if (box.kind === "dialogue") {
        box.choices.forEach((choice) => {
          if (choice.next && graph.boxes[choice.next]) {
            list.push(makeOrReuseEdge(`${box.id}-${choice.id}`, box.id, `${box.id}-${choice.id}`, choice.next));
          }

          if (choice.choiceConditionId) {
            const conditionBox = graph.boxes[choice.choiceConditionId];
            if (conditionBox) {
              list.push(
                makeOrReuseEdge(
                  `${conditionBox.id}`,
                  conditionBox.id,
                  `${conditionBox.id}`,
                  box.id,
                  `${box.id}-${choice.id}-condition-target`
                )
              );
            }
          }
        });

        if (box.defaultNext && graph.boxes[box.defaultNext]) {
          list.push(
            makeOrReuseEdge(`${box.id}-default`, box.id, `${box.id}-default`, box.defaultNext, undefined, { strokeDasharray: "4 4" })
          );
        }
      }

      if (box.kind === "condition") {
        box.evaluations.forEach((evaluation) => {
          if (evaluation.next && graph.boxes[evaluation.next]) {
            list.push(makeOrReuseEdge(`${box.id}-${evaluation.id}`, box.id, `${box.id}-${evaluation.id}`, evaluation.next));
          }
        });

        if (box.fallback && graph.boxes[box.fallback]) {
          list.push(
            makeOrReuseEdge(`${box.id}-fallback`, box.id, `${box.id}-fallback`, box.fallback, undefined, { strokeDasharray: "4 4" })
          );
        }
      }
    });

    edgesRef.current = nextEdgeMap;
    return list;
  }, [graph.boxes]);

  return (
    <div className="graph-canvas-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        fitView
      >
        <StarfieldBackground/>
        <Toolbar/>
      </ReactFlow>
    </div>
  );
}
