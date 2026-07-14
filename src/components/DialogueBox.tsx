import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useEffect, useRef, useState } from "react";
import type { DialogueBox } from "../types/dialogue";
import { Character } from "../types/character";
import { useGraphStore } from "../store/graphStore";

interface Props {
  data: { box: DialogueBox };
  selected: boolean;
  id: string;
}

export default function dialogueBox({data, selected, id} : Props) {
    const { box } = data;
    const updateNodeInternals = useUpdateNodeInternals();
    const choiceRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [handlePositions, setHandlePositions] = useState<Record<string, number>>({});

    const updateBox = useGraphStore((s) => s.updateBox);
    const addChoice = useGraphStore((s) => s.addChoice);
    const updateChoice = useGraphStore((s) => s.updateChoice);
    const deleteChoice = useGraphStore((s) => s.deleteChoice);
    const deleteBox = useGraphStore((s) => s.deleteBox);

    type CharacterInstance = typeof Character[keyof typeof Character]

    function getName(c:CharacterInstance) {
        switch (c) {
            case Character.CUSTOM:
                return "Custom"
            case Character.NARRATOR:
                return "Narrator"
            default:
                return c.displayName
    }}

    function updateKey(key: string){
        updateBox(box.id, { key:key || undefined })
        console.log(useGraphStore.getState().graph.boxes[box.id]);
    }

    useEffect(() => {
    const nodeEl = choiceRefs.current[box.choices[0]?.id]?.closest(".dialogue-node") as HTMLElement | null;
    if (!nodeEl) return;
    const nodeTop = nodeEl.getBoundingClientRect().top;

    const positions: Record<string, number> = {};
    box.choices.forEach((choice) => {
        const rowEl = choiceRefs.current[choice.id];
        if (rowEl) {
        const rowRect = rowEl.getBoundingClientRect();
        positions[choice.id] = rowRect.top - nodeTop + rowRect.height / 2;
        }
    });
    setHandlePositions(positions);
    updateNodeInternals(id); 
    }, [box.choices, box.text, id, updateNodeInternals]);

    return (
        <div className={`dialogue-node ${selected ? "selected" : ""}`}>
            <Handle
                type="target"
                position={Position.Left}
                id={`${box.id}-default`}
                isConnectable={false}
            />
            <div className="dialogue-node-header">
               <select
                    value={box.speaker?.id ?? ""}
                    onChange={(e) => {
                        const found = Object.values(Character).find((c) => c.id === e.target.value);
                        updateBox(box.id, { speaker: found ?? null });
                    }}
                    className="speaker-choice"
                >
                    {Object.values(Character).map((c) => (
                        <option key={c.id} value={c.id}>
                            {getName(c)}
                        </option>
                    ))}
                </select>
                <input 
                type="text"
                value={box.key ?? ""}
                placeholder="current key..."   
                onChange={(e) => updateKey(e.target.value)}
                className="text-input nodrag key-choice"
                />
                <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
                    ✕
                </button>
                
            </div>
            {box.speaker?.id === Character.CUSTOM.id && (
                    <input
                        className="custom-speaker-input nodrag"
                        value={box.customSpeakerName ?? ""}
                        placeholder="enter name..."
                        onChange={(e) => updateBox(box.id, { customSpeakerName: e.target.value })}
                    />
                )}
            <textarea
                className="text-input nodrag"
                value={box.text}
                onChange={(e) => updateBox(box.id, { text: e.target.value })}
                placeholder="dialogue text..."
                rows={3}
            />

            <div className="choices-list">
                {box.choices.map((choice) => (   

                    <div 
                        key={choice.id}
                        className="choice-row"
                        ref={(el) => { choiceRefs.current[choice.id] = el; }}>
                        <input
                            className="choice-prompt nodrag"
                            value={choice.prompt}
                            placeholder="prompt..."
                            onChange={(e) => updateChoice(box.id, choice.id, { prompt: e.target.value })}
                        />
                        <input
                            className="choice-next nodrag"
                            value={typeof choice.next === "string" ? choice.next : "[condition]"}
                            placeholder="box key..."
                            onChange={(e) => updateChoice(box.id, choice.id, { next: e.target.value })}
                        />
                        <button className="delete-btn small" onClick={() => deleteChoice(box.id, choice.id)}>
                        ✕
                        </button>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${box.id}-${choice.id}`}
                            isConnectable={false}
                            style={{ top: handlePositions[choice.id] ?? 0 }}
                        />
                    </div>
                ))}
                <button className="add-choice-btn" onClick={() => addChoice(box.id)}>
                + choice
                </button>
            </div>

            <div className="default-next-row">
                <label>default next:</label>
                <input
                value={box.defaultNext ?? ""}
                placeholder="box key..."
                onChange={(e) => updateBox(box.id, { defaultNext: e.target.value || null })}
                className="text-input default-text nodrag"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id={`${box.id}-default`}
                    isConnectable={false}
                    style={{position:"relative",right:"-210%",top:"-180%"}}
                />
            </div>

        </div>
    )
}