import ReactFlow from "reactflow";
import { useMemo } from "react";
import { useGraphStore } from "../../store/graphStore";
import { getAutoLayoutedElements } from "../../utils/autoLayout";
import { ConditionTreeNode, DialogueTreeNode } from "./MobileTreeNodes";
import styles from "./MobileTreeOverlay.module.css";

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
        <div className={styles.treeModal}>
        <button className={styles.closeTreeBtn} onClick={onClose}>
            ✕ Close Map
        </button>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={mobileNodeTypes}
            onNodeClick={(_, node) => {
                onSelectBox(node.id);
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