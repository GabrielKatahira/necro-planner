import { Handle, Position } from "reactflow";
import type { DialogueBox } from "../types/dialogue";
import { Character } from "../types/character";
import { useGraphStore } from "../store/graphStore";

interface Props {
  data: { box: DialogueBox };
  selected: boolean;
}

export default function dialogueBox({data, selected} : Props) {
    const { box } = data;

    let conflictingKey = false;

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
        console.log(data);
    }

    return (
        <div className={`dialogue-node ${selected ? "selected" : ""}`}>
            <input 
            type="text"
            value={box.key ?? ""}
            placeholder="Current Key..."   
            onChange={(e) => updateKey(e.target.value)}
            className="text-input nodrag"
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
                <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
                    ✕
                </button>
                
            </div>
            {box.speaker?.id === Character.CUSTOM.id && (
                    <input
                        className="custom-speaker-input nodrag"
                        value={box.customSpeakerName ?? ""}
                        placeholder="Enter name..."
                        onChange={(e) => updateBox(box.id, { customSpeakerName: e.target.value })}
                    />
                )}
            <textarea
                className="text-input nodrag"
                value={box.text}
                onChange={(e) => updateBox(box.id, { text: e.target.value })}
                placeholder="Dialogue text..."
                rows={3}
            />

            <div className="choices-list">
                {box.choices.map((choice) => (
                <div key={choice.id} className="choice-row">
                    <input
                    className="choice-prompt nodrag"
                    value={choice.prompt}
                    placeholder="(silent / auto)"
                    onChange={(e) => updateChoice(box.id, choice.id, { prompt: e.target.value })}
                    />
                    <input
                    className="choice-next nodrag"
                    value={typeof choice.next === "string" ? choice.next : "[condition]"}
                    placeholder="Box Key..."
                    onChange={(e) => updateChoice(box.id, choice.id, { next: e.target.value })}
                    />
                    <button className="delete-btn small" onClick={() => deleteChoice(box.id, choice.id)}>
                    ✕
                    </button>
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
                placeholder="Box Key..."
                onChange={(e) => updateBox(box.id, { defaultNext: e.target.value || null })}
                className="text-input default-text nodrag"
                />
            </div>

        </div>
    )
}