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

    return (
        <div className={`dialogue-node ${selected ? "selected" : ""}`}>
            <Handle type="target" position={Position.Top} />

             <div className="dialogue-node-header">
                <select value={box.speaker?.id}>
                    {Object.values(Character).map((c) => (
                        <option key={c.id} value={c.id}>
                        {getName(c)}
                        </option>
                    ))}
                </select>
                {box.speaker === Character.CUSTOM && (
                <input
                    className="custom-speaker-input"
                    value={box.customSpeakerName ?? ""}
                    placeholder="Enter name..."
                    onChange={(e) => updateBox(box.id, {customSpeakerName : e.target.value })}
                />
                )}
                <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
                ✕
                </button>
            </div>

        </div>
    )
}