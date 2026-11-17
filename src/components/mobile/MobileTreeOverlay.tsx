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
    onCreateBox: (kind: "dialogue" | "condition") => void;
}

export default function MobileTreeOverlay({onSelectBox, onClose, onCreateBox} : Props) {
    const graph = useGraphStore((s) => s.graph);

    const { nodes, edges } = useMemo(() => {
        const boxes = Object.fromEntries(
            Object.entries(graph.boxes).filter(([, box]) => box.kind !== "choiceCondition")
        );
        return getAutoLayoutedElements({ ...graph, boxes });
    }, [graph]);

    return (
        <div className={styles.treeModal}>
        <button className={styles.closeTreeBtn} onClick={onClose}>
            ✕ Close Map
        </button>

        {nodes.length === 0 && (
            <div className={styles.emptyMap}>
                <p>No boxes yet.</p>
                <div className={styles.createActions}>
                    <button className={styles.createBtn} onClick={() => onCreateBox("dialogue")}>
                        + Dialogue Box
                    </button>
                    <button className={styles.createBtn} onClick={() => onCreateBox("condition")}>
                        + Condition Box
                    </button>
                </div>
            </div>
        )}

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