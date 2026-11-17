import { useEffect, useState } from "react";
import { useGraphStore } from "../../store/graphStore";
import { EVALUATORS, type Evaluator } from "../../types/dialogue";
import styles from "./ChoiceConditionEditor.module.css";

interface Props {
    conditionId: string;
}

export default function ChoiceConditionEditor({ conditionId }: Props) {
    const condition = useGraphStore((s) => s.graph.boxes[conditionId]);
    const addCheck = useGraphStore((s) => s.addChoiceConditionCheck);
    const updateCheck = useGraphStore((s) => s.updateChoiceConditionCheck);
    const deleteCheck = useGraphStore((s) => s.deleteChoiceConditionCheck);

    const [localVariables, setLocalVariables] = useState<Record<string, string>>({});
    const [localValues, setLocalValues] = useState<Record<string, string>>({});

    const checks = condition?.kind === "choiceCondition" ? condition.checks : null;

    useEffect(() => {
        if (!checks) return;
        const vars: Record<string, string> = {};
        const vals: Record<string, string> = {};
        checks.forEach((check) => {
            vars[check.id] = check.variable;
            vals[check.id] = String(check.value);
        });
        setLocalVariables(vars);
        setLocalValues(vals);
    }, [checks]);

    if (!checks) return null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>Visible when</div>
            {checks.map((check) => (
                <div key={check.id} className={styles.checkRow}>
                    <input
                        className={styles.varInput}
                        value={localVariables[check.id] ?? check.variable}
                        placeholder="variable..."
                        onChange={(e) => setLocalVariables((prev) => ({ ...prev, [check.id]: e.target.value }))}
                        onBlur={() => updateCheck(conditionId, check.id, { variable: localVariables[check.id] ?? check.variable })}
                    />
                    <select
                        className={styles.evalSelect}
                        value={check.evaluator}
                        onChange={(e) => updateCheck(conditionId, check.id, { evaluator: e.target.value as Evaluator })}
                    >
                        {EVALUATORS.map((evaluator) => (
                            <option key={evaluator} value={evaluator}>{evaluator}</option>
                        ))}
                    </select>
                    <input
                        className={styles.valInput}
                        value={localValues[check.id] ?? String(check.value)}
                        placeholder="value..."
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, [check.id]: e.target.value }))}
                        onBlur={() => updateCheck(conditionId, check.id, { value: localValues[check.id] ?? String(check.value) })}
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
