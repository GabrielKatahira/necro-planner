import { Handle, Position } from "reactflow";
import { useState } from "react";
import { useGraphStore } from "../../store/graphStore";
import type { ChoiceConditionBox, Evaluator } from "../../types/dialogue";
import { EVALUATORS } from "../../types/dialogue";
import styles from "./ChoiceConditionBox.module.css";

interface Props {
  data: { box: ChoiceConditionBox };
  selected: boolean;
  id: string;
}

export default function ChoiceConditionBoxNode({data, selected} : Props) {
    const { box } = data;

    const addCheck = useGraphStore((s) => s.addChoiceConditionCheck);
    const updateCheck = useGraphStore((s) => s.updateChoiceConditionCheck);
    const deleteCheck = useGraphStore((s) => s.deleteChoiceConditionCheck);


    const [localChecks, setLocalChecks] = useState(
        box.checks.map((c) => ({ 
            id: c.id, 
            variable: c.variable, 
            evaluator: typeof c.evaluator === "string" ? c.evaluator : "==" ,
            value: typeof c.value === "number" ? c.value : "0"
        }))
    );
        
    

    return(
        <div className={`${styles.boxNode} ${selected ? styles.selected : ""}`}>
            <Handle
                type="source"
                position={Position.Right}
                id={`${box.id}`}
                isConnectable={false}
                style={{opacity:0}}
            />
            <div className={styles.checksWrapper}>
                {box.checks.map((check, index) => (
                    <div className={styles.checkRow} key={`${check.id}`}>
                        <input
                            className={`${styles.textInput} nodrag`}
                            defaultValue={localChecks[index]?.variable ?? ""}
                            key={`variable-${check.id}`}
                            onChange={(e) => {
                                const next = [...localChecks];
                                next[index] = { ...next[index], variable: e.target.value };
                                setLocalChecks(next);
                            }}
                            onBlur={() => updateCheck(box.id, check.id, { variable: localChecks[index]?.variable ?? "" })}
                            placeholder="variable..."
                        />
                        <select value={check.evaluator}
                                className={styles.evalSelect}
                                onChange={(e) => {
                                    updateCheck(box.id,check.id, {evaluator: e.target.value as Evaluator})
                                    }}>
                            {EVALUATORS.map((obj) => (
                                <option key={obj} value={obj}>{obj}</option>
                            ))}
                        </select>
                        <input
                            className={`${styles.textInput} ${styles.evalValue} nodrag`}
                            defaultValue={localChecks[index]?.value ?? ""}
                            key={`value-${check.id}`}
                            onChange={(e) => {
                                const next = [...localChecks];
                                next[index] = { ...next[index], value: e.target.value };
                                setLocalChecks(next);
                            }}
                            onBlur={() => updateCheck(box.id, check.id, { value: localChecks[index]?.value ?? "" })}
                            placeholder="value..."
                        />
                        <button className={styles.deleteBtn} onClick={()=>deleteCheck(box.id,check.id)}>
                            ✕
                        </button>
                    </div>
                ))}
                <button className={styles.addItemBtn} onClick={() => addCheck(box.id)}>+</button>
            </div>
        </div>
    )

}
