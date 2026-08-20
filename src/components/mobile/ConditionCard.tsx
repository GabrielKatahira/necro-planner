import type { ConditionBox } from "../../types/dialogue";
import { useGraphStore } from "../../store/graphStore";
import { useEffect,useState } from "react";
import { EVALUATORS, type Evaluator } from "../../types/dialogue";

interface Props {
    box: ConditionBox,
    changeActiveBox: (id:string)=>void
    onInitiateConnect: (onTargetPicked: (targetId: string) => void) => void;
}

export default function ConditionCard ({box, changeActiveBox, onInitiateConnect}:Props) {
    
    const addBox = useGraphStore((s) => s.addBox);
    const updateBox = useGraphStore((s) => s.updateBox);
    const addEvaluation = useGraphStore((s) => s.addEvaluation);
    const updateEvaluation = useGraphStore((s) => s.updateEvaluation);
    const deleteEvaluation = useGraphStore((s) => s.deleteEvaluation);
    const deleteBox = useGraphStore((s) => s.deleteBox);
    const boxes = useGraphStore((s) => s.graph.boxes);

    const parseInputValue = (val: string): string | number => {
        if (val.trim() === "") return "";
        const num = Number(val);
        return isNaN(num) ? val : num;
      };
    
      const [localVariables, setLocalVariables] = useState<Record<string, string>>({});
      const [localValues, setLocalValues] = useState<Record<string, string | number>>({});
    
      useEffect(() => {
        const vars: Record<string, string> = {};
        const vals: Record<string, string | number> = {};
    
        box.evaluations.forEach((evalItem) => {
          vars[evalItem.id] = evalItem.variable;
          vals[evalItem.id] = evalItem.value;
        });
    
        setLocalVariables(vars);
        setLocalValues(vals);
    }, [box.evaluations]);

    function getNewNodePosition(parentBox: { position: { x: number; y: number }; choices?: any[] }, index = 0) {
        const HORIZONTAL_GAP = 400; 
        const VERTICAL_GAP = 10;   

        return {
            x: parentBox.position.x + HORIZONTAL_GAP,
            y: parentBox.position.y + (index * VERTICAL_GAP),
        };
    }
    function getNonOverlappingPosition(
        basePosition: { x: number; y: number }, 
        existingBoxes: Record<string, { position: { x: number; y: number } }>
    ) {
        let { x, y } = basePosition;
        const boxesArray = Object.values(existingBoxes);

        while (boxesArray.some((b) => Math.abs(b.position.x - x) < 50 && Math.abs(b.position.y - y) < 50)) {
            y += 180; 
        }

        return { x, y };
    }

    return(
        <div className="mobile-card" key={box.id}>
            <div className="mobile-card-header-wrapper">
                <div className="mobile-label">Condition</div>
                <button className="delete-btn mobile-text-input" onClick={() =>{ 
                        if(confirm("Are you sure you want to delete this card?")){
                        deleteBox(box.id)
                        }
                    }
                } title="Delete box">
                ✕
                </button>
            </div>
            <div className="mobile-label">Evaluations</div>
            <div className="mobile-card-list">
                {box.evaluations.map((evaluation) => (
                    <div className="evaluations-row mobile-bigger-text-input" key={evaluation.id}>
                        <input
                            className="text-input nodrag"
                            value={localVariables[evaluation.id] ?? evaluation.variable}
                            placeholder="variable..."
                            onChange={(e) => {
                                setLocalVariables((prev) => ({ ...prev, [evaluation.id]: e.target.value }));
                            }}
                            onBlur={() =>
                                updateEvaluation(box.id, evaluation.id, {
                                variable: localVariables[evaluation.id] ?? evaluation.variable,
                                })
                            }
                        />
                        <select
                            value={evaluation.evaluator}
                            className="dropdown-select eval-select mobile-select"
                            onChange={(e) => {
                            updateEvaluation(box.id, evaluation.id, {
                                evaluator: e.target.value as Evaluator,
                            });
                            }}
                        >
                            {EVALUATORS.map((obj) => (
                            <option key={obj} value={obj}>
                                {obj}
                            </option>
                            ))}
                        </select>
            
                        <input
                        className="text-input eval-value nodrag"
                        value={localValues[evaluation.id] ?? evaluation.value ?? ""}
                        placeholder="value..."
                        onChange={(e) => {
                            setLocalValues((prev) => ({ ...prev, [evaluation.id]: e.target.value }));
                        }}
                        onBlur={() => {
                            const rawVal = localValues[evaluation.id];
                            const finalVal = rawVal !== undefined ? parseInputValue(String(rawVal)) : evaluation.value;
                            updateEvaluation(box.id, evaluation.id, { value: finalVal });
                        }}
                        />

                        {evaluation.next?(
                            <button className="mobile-button" onClick={()=>changeActiveBox(evaluation.next!)}>
                                ↪
                            </button>
                        ) : (
                            <div className="mobile-flex">
                                 <button className="mobile-button" onClick={()=>{
                                    const currentEvalsCount = box.evaluations?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentEvalsCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("dialogue",newSafePos);
                                    updateEvaluation(box.id,evaluation.id,{next:newBoxId});
                                    changeActiveBox(newBoxId);
                                }}>
                                    &#x1F4AC;&#xFE0E;
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    const currentEvalsCount = box.evaluations?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentEvalsCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("condition",newSafePos);
                                    updateEvaluation(box.id,evaluation.id,{next:newBoxId});
                                    changeActiveBox(newBoxId);
                                }}>
                                    🗎
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    onInitiateConnect((id) => {
                                        updateEvaluation(box.id,evaluation.id,{next:id});
                                    })
                                }}>
                                    ⇔
                                </button>
                            </div>
                        )}
                        <button
                        className="mobile-button"
                        onClick={() => {
                            deleteEvaluation(box.id, evaluation.id);
                        }}
                        >
                        ✕
                        </button>
                    </div>
                ))}
                <button
                    className="add-item-btn mobile-text-input"
                    onClick={() => addEvaluation(box.id)}
                >
                    + evaluation
                </button>
            </div>
            <div>
                <div className="mobile-label">Fallback</div>
                {box.fallback?(
                    <button className="mobile-button mobile-default-next" onClick={()=>changeActiveBox(box.fallback!)}>
                        ↪
                    </button>
                ):(
                    <div className="mobile-default-next">
                        <button className="mobile-button" onClick={()=>{
                            const currentEvalsCount = box.evaluations?.length ?? 0;
                            const newPosition = getNewNodePosition(box, currentEvalsCount);
                            const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                            const newBoxId = addBox("dialogue",newSafePos);
                            updateBox("condition",box.id,{fallback:newBoxId})
                            changeActiveBox(newBoxId);
                        }}>
                            &#x1F4AC;&#xFE0E;
                        </button>
                        <button className="mobile-button" onClick={()=>{
                            const currentEvalsCount = box.evaluations?.length ?? 0;
                            const newPosition = getNewNodePosition(box, currentEvalsCount);
                            const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                            const newBoxId = addBox("condition",newSafePos);
                            updateBox("condition",box.id,{fallback:newBoxId})
                            changeActiveBox(newBoxId);
                        }}>
                            🗎
                        </button>
                        <button className="mobile-button" onClick={()=>{
                            onInitiateConnect((id) => {
                                updateBox("condition",box.id,{fallback:id})
                            })
                        }}>
                            ⇔
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}