import { Handle, Position } from "reactflow";
import { useGraphStore } from "../../store/graphStore";
import type { ChoiceConditionBox, VisibilityCheck } from "../../types/dialogue";
import ConditionFields from "../shared/ConditionFields";
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
                {box.checks.map((check) => (
                    <div className={styles.checkRow} key={`${check.id}`}>
                        <ConditionFields
                            compact
                            stringValues
                            variable={check.variable}
                            evaluator={check.evaluator}
                            value={check.value}
                            onChange={(patch) => updateCheck(box.id, check.id, patch as Partial<VisibilityCheck>)}
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
