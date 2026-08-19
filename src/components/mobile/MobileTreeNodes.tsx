import { Handle, Position } from "reactflow";
import type { DialogueBox, ConditionBox } from "../../types/dialogue";

interface DialogueProps {
  data: { box: DialogueBox };
  id: string;
}

interface ConditionProps {
  data: { box: ConditionBox };
  id: string;
}

export function DialogueTreeNode({ data }: DialogueProps) {
    const {box} = data;

    return (
        <div className="tree-node">
            <Handle type="target" position={Position.Left} id={`${box.id}-default`}/>
                <div className="tree-node-title">{box.speaker?.id=="CUSTOM" ? box.customSpeakerName : box.speaker?.displayName}</div>
                <div className={`tree-node-text ${box.speaker?.id=="NARRATOR" ? "italics" : ""}`}>
                    {box.text ? `${box.text.slice(0,30)}${box.text.length > 30 ? "..." : ""}` : "no text specified..."}
                </div>
                <div className="tree-node-list">
                    {box.choices.map((choice) => (
                        <div key={choice.id} className="tree-node-list-item">
                            {choice.prompt? choice.prompt : "no text specified..."}
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`${box.id}-${choice.id}`}
                            />
                        </div>
                        
                    ))}
                </div> 
                {box.defaultNext && (
                    <Handle type="source" 
                    position={Position.Right} 
                    id={`${box.id}-default`} />
                )}
                
        </div>
    )
}

export function ConditionTreeNode({data} : ConditionProps) {
    const {box} = data;

    return (
        <div className="tree-node">
            <Handle
                type="target"
                position={Position.Left}
                id={`${box.id}-default`}
            />
            <div className="tree-node-list">
                {box.evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="tree-node-list-item">
                        {evaluation.variable} {evaluation.evaluator} {evaluation.value}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${box.id}-${evaluation.id}`}
                        />
                    </div>
                ))}
            </div>
            {box.fallback &&(
                <div className="tree-node-fallback">
                    <p>fallback:</p>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={`${box.id}-fallback`}
                        style={{position:"relative",right:"-105%"}}
                    />
                </div>
            )}
        </div>
    )
}