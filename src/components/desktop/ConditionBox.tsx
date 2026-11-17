import { Handle, Position } from "reactflow";
import { memo } from "react";
import { useGraphStore } from "../../store/graphStore";
import type { ConditionBox } from "../../types/dialogue";
import ConditionFields from "../shared/ConditionFields";
import styles from "./ConditionBox.module.css";

interface Props {
  data: { box: ConditionBox };
  selected: boolean;
  id: string;
}

function ConditionBoxNode({ data, selected }: Props) {
  const { box } = data;

  const addEvaluation = useGraphStore((s) => s.addEvaluation);
  const updateEvaluation = useGraphStore((s) => s.updateEvaluation);
  const deleteEvaluation = useGraphStore((s) => s.deleteEvaluation);
  const deleteBox = useGraphStore((s) => s.deleteBox);

  return (
    <div className={`${styles.boxNode} ${selected ? styles.selected : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        id={`${box.id}-default`}
        isConnectable={true}
      />

      <div className={styles.header}>
        <div>Condition</div>
        <button className={styles.deleteBtn} onClick={() => deleteBox(box.id)} title="Delete box">
          ✕
        </button>
      </div>

      <div className={styles.evaluationsList}>
        {box.evaluations.map((evaluation) => (
          <div key={evaluation.id} className={styles.evaluationsRow}>
            <ConditionFields
              compact
              variable={evaluation.variable}
              evaluator={evaluation.evaluator}
              value={evaluation.value}
              onChange={(patch) => updateEvaluation(box.id, evaluation.id, patch)}
            />

            <input
              className={`${styles.textInput} ${styles.evalFallback} nodrag`}
              value={typeof evaluation.next === "string" ? evaluation.next : ""}
              placeholder="no connection..."
              disabled={true}
              readOnly
            />

            <button
              className={styles.deleteBtn}
              onClick={() => deleteEvaluation(box.id, evaluation.id)}
              title="Delete evaluation"
            >
              ✕
            </button>

            <Handle
              type="source"
              position={Position.Right}
              id={`${box.id}-${evaluation.id}`}
              isConnectable={true}
              style={{ top: "50%", right: -8, transform: "translateY(-50%)" }}
            />
          </div>
        ))}

        <button className={styles.addItemBtn} onClick={() => addEvaluation(box.id)}>
          + evaluation
        </button>
      </div>

      <div className={styles.defaultNextRow}>
        <label>fallback:</label>
        <input
          value={box.fallback ?? ""}
          placeholder="no connection..."
          disabled={true}
          readOnly
          className={`${styles.textInput} ${styles.defaultText} nodrag`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id={`${box.id}-fallback`}
          isConnectable={true}
          style={{ position: "relative", right: "-210%", top: "-180%" }}
        />
      </div>
    </div>
  );
}

export default memo(ConditionBoxNode, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.id === next.id &&
    prev.data.box === next.data.box
  );
});