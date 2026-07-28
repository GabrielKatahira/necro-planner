import { Handle, Position} from "reactflow";
import { useGraphStore } from "../store/graphStore";
import { EVALUATORS, type ConditionBox, type Evaluator } from "../types/dialogue";

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
    
    function updateKey(key: string){
        updateBox(box.id, { key:key || undefined })
    }

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
                value={box.key ?? ""}
                placeholder="current key..."   
                onChange={(e) => updateKey(e.target.value)}
                className="text-input nodrag key-text"
                />
                <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
                    ✕
                </button>
            </div>
            <div className="evaluations-list">
                {box.evaluations.map((evaluation) => (
                    <div
                        key={evaluation.id} 
                        className="evaluations-row" >
                        <input
                            className="text-input nodrag"
                            value={evaluation.variable}
                            placeholder="variable..."
                            onChange={(e) => updateEvaluation(box.id, evaluation.id, { variable: e.target.value })}
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
                            value={evaluation.value}
                            placeholder="value..."
                            onChange={(e) => updateEvaluation(box.id, evaluation.id, { value: e.target.value })}
                        />
                        <input
                            className="text-input eval-fallback nodrag"
                            value={evaluation.next}
                            placeholder="box key..."
                            onChange={(e) => updateEvaluation(box.id, evaluation.id, { next: e.target.value })}
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
                value={box.fallback ?? ""}
                placeholder="box key..."
                onChange={(e) => updateBox(box.id, { fallback: e.target.value || undefined })}
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