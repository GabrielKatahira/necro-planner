import { Handle, Position } from "reactflow";
import type { DialogueBox, ConditionBox } from "../../types/dialogue";
import { useCharacterStore } from "../../store/characterStore";
import { SPEAKER_NARRATOR, speakerDisplayName } from "../../utils/speakers";
import styles from "./MobileTreeNodes.module.css";

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
    const sheets = useCharacterStore((s) => s.board.sheets);

    return (
        <div className={styles.treeNode}>
            <Handle type="target" position={Position.Left} id={`${box.id}-default`}/>
                <div className={styles.title}>{speakerDisplayName(box.speakerId, box.customSpeakerName, sheets)}</div>
                <div className={`${styles.text} ${box.speakerId === SPEAKER_NARRATOR ? styles.italics : ""}`}>
                    {box.text ? `${box.text.slice(0,30)}${box.text.length > 30 ? "..." : ""}` : "no text specified..."}
                </div>
                <div className={styles.list}>
                    {box.choices.map((choice) => (
                        <div key={choice.id} className={styles.listItem}>
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
        <div className={styles.treeNode}>
            <Handle
                type="target"
                position={Position.Left}
                id={`${box.id}-default`}
            />
            <div className={styles.list}>
                {box.evaluations.length == 0 &&(
                    <div className={styles.emptyText}>no choices created</div>
                )}
                {box.evaluations.map((evaluation) => (
                    <div key={evaluation.id} className={styles.listItem}>
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
                <div className={styles.fallback}>
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