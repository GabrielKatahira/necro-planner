import ReactFlow from "reactflow";
import { useMemo } from "react";
import { useGraphStore } from "../../store/graphStore";
import { getAutoLayoutedElements } from "../../utils/autoLayout";
import { ConditionTreeNode, DialogueTreeNode } from "./MobileTreeNodes";

const mobileNodeTypes = {
    dialogueBox: DialogueTreeNode,
    conditionBox: ConditionTreeNode
}

interface Props {
    onSelectBox: (boxId: string) => void;
    onClose: () => void;
}

export default function MobileTreeOverlay({onSelectBox, onClose} : Props) {
    const graph = useGraphStore((s) => s.graph);

    const { nodes, edges } = useMemo(() => {
        return getAutoLayoutedElements(graph);
    }, [graph]);

    return (
        <div className="mobile-tree-modal" style={{ width: "100vw", height: "100vh" }}>
        <button className="close-tree-btn" onClick={onClose} style={{ position: "absolute", zIndex: 10 , top: "12px", left:"12px"}}>
            ✕ Close Map
        </button>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={mobileNodeTypes}
            onNodeClick={(_, node) => {
            onSelectBox(node.id);
            onClose();
            }}
            nodesDraggable={false}
            zoomOnPinch={true}
            panOnScroll={true}
            fitView
        >
        </ReactFlow>
        </div>
    );
}