import { Handle, Position} from "reactflow";
import { useGraphStore } from "../store/graphStore";
import { EVALUATORS, type ConditionBox, type Evaluator } from "../types/dialogue";
import { useState, useEffect } from "react";

interface Props {
  data: { box: ConditionBox };
  selected: boolean;
  id: string;
}

export default function conditionBox({data, selected} : Props) {
    const { box } = data;

    
    const updateBox = useGraphStore((s) => s.updateConditionBox);
    const addEvaluation = useGraphStore((s) => s.addEvaluation);
    const updateEvaluation = useGraphStore((s) => s.updateEvaluation);
    const deleteEvaluation = useGraphStore((s) => s.deleteEvaluation);
    const deleteBox = useGraphStore((s) => s.deleteBox);

    const [localKey, setLocalKey] = useState(box.key ?? "");
    const [localEvaluations, setLocalEvaluations] = useState(
        box.evaluations.map((c) => ({ 
            id: c.id, 
            variable: c.variable, 
            evaluator: typeof c.evaluator === "string" ? c.evaluator : "==" ,
            value: typeof c.value === "number" ? c.value : "0",
            next: typeof c.next === "string" ? c.next : ""
        }))
    );
    const [localFallback, setLocalFallback] = useState(box.fallback ?? "");

    useEffect(() => { setLocalKey(box.key ?? ""); }, [box.key]);
    useEffect(() => { setLocalFallback(box.fallback); }, [box.fallback]);
    useEffect(() => {
        setLocalEvaluations(box.evaluations.map((c) => ({ 
            id: c.id, 
            variable: c.variable, 
            evaluator: typeof c.evaluator === "string" ? c.evaluator : "==" ,
            value: typeof c.value === "number" ? c.value : "0",
            next: typeof c.next === "string" ? c.next : ""
        })))
    }, [box.evaluations]);

    return(
        <div className={`box-node ${selected ? "selected" : ""}`}>
            <Handle
                type="target"
                position={Position.Left}
                id={`${box.id}-default`}
                isConnectable={false}
            />
            <div className="condition-header">
                <input 
                type="text"
                defaultValue={localKey}
                key={`key-${box.id}`}
                placeholder="current key..."   
                onChange={(e) => setLocalKey(e.target.value)}
                onBlur={() => updateBox(box.id, { key: localKey || undefined })}
                className="text-input nodrag key-text"
                />
                <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
                    ✕
                </button>
            </div>
            <div className="evaluations-list">
                {box.evaluations.map((evaluation, index) => (
                    <div
                        key={evaluation.id} 
                        className="evaluations-row" >
                        <input
                            className="text-input nodrag"
                            defaultValue={localEvaluations[index]?.variable ?? ""}
                            key={`variable-${evaluation.id}`}
                            onChange={(e) => {
                                const next = [...localEvaluations];
                                next[index] = { ...next[index], variable: e.target.value };
                                setLocalEvaluations(next);
                            }}
                            onBlur={() => updateEvaluation(box.id, evaluation.id, { variable: localEvaluations[index]?.variable ?? "" })}
                            placeholder="variable..."
                        />
                        <select value={evaluation.evaluator}
                                className="dropdown-select eval-select"
                                onChange={(e) => {
                                    updateEvaluation(box.id,evaluation.id, {evaluator: e.target.value as Evaluator})
                                    }}>
                            {EVALUATORS.map((obj) => (
                                <option value={obj}>{obj}</option>
                            ))}
                        </select>
                        <input
                            className="text-input eval-value nodrag"
                            defaultValue={localEvaluations[index]?.value ?? ""}
                            key={`value-${evaluation.id}`}
                            onChange={(e) => {
                                const next = [...localEvaluations];
                                next[index] = { ...next[index], value: e.target.value };
                                setLocalEvaluations(next);
                            }}
                            onBlur={() => updateEvaluation(box.id, evaluation.id, { value: localEvaluations[index]?.value ?? "" })}
                            placeholder="value..."
                        />
                        <input
                            className="text-input eval-fallback nodrag"
                            defaultValue={localEvaluations[index]?.next ?? ""}
                            key={`next-${evaluation.id}`}
                            onChange={(e) => {
                                const next = [...localEvaluations];
                                next[index] = { ...next[index], next: e.target.value };
                                setLocalEvaluations(next);
                            }}
                            onBlur={() => updateEvaluation(box.id, evaluation.id, { next: localEvaluations[index]?.next ?? "" })}
                            placeholder="box key..."
                        />
                        <button className="delete-btn" onClick={() => deleteEvaluation(box.id,evaluation.id)} title="Delete box">
                            ✕
                        </button>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${box.id}-${evaluation.id}`}
                            isConnectable={false}
                            style={{top: "50%", right: -8, transform: "translateY(-50%)"}}
                        />
                    </div>
                ))}
                <button className="add-item-btn" onClick={() => addEvaluation(box.id)}>
                + evaluation
                </button>
            </div>

            <div className="default-next-row">
                <label>fallback:</label>
                <input
                defaultValue={localFallback}
                placeholder="box key..."
                onChange={(e) => setLocalFallback(e.target.value)}
                onBlur={() => updateBox(box.id, { fallback: localFallback || undefined })}
                className="text-input default-text nodrag"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id={`${box.id}-fallback`}
                    isConnectable={false}
                    style={{position:"relative",right:"-210%",top:"-180%"}}
                />
            </div>
        </div>
    )

}