import { useGraphStore } from "../../store/graphStore";
import type { VisibilityCheck } from "../../types/dialogue";
import ConditionFields from "../shared/ConditionFields";
import styles from "./ChoiceConditionEditor.module.css";

interface Props {
    conditionId: string;
}

export default function ChoiceConditionEditor({ conditionId }: Props) {
    const condition = useGraphStore((s) => s.graph.boxes[conditionId]);
    const addCheck = useGraphStore((s) => s.addChoiceConditionCheck);
    const updateCheck = useGraphStore((s) => s.updateChoiceConditionCheck);
    const deleteCheck = useGraphStore((s) => s.deleteChoiceConditionCheck);

    if (condition?.kind !== "choiceCondition") return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>Visible when</div>
            {condition.checks.map((check) => (
                <div key={check.id} className={styles.checkRow}>
                    <ConditionFields
                        stringValues
                        variable={check.variable}
                        evaluator={check.evaluator}
                        value={check.value}
                        onChange={(patch) => updateCheck(conditionId, check.id, patch as Partial<VisibilityCheck>)}
                    />
                    <button className={styles.deleteBtn} onClick={() => deleteCheck(conditionId, check.id)}>
                        ✕
                    </button>
                </div>
            ))}
            <button className={styles.addBtn} onClick={() => addCheck(conditionId)}>
                + check
            </button>
        </div>
    );
}
