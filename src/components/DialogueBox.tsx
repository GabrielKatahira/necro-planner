import { Handle, Position } from "reactflow";
import { memo, useState, useEffect } from "react";
import type { DialogueBox } from "../types/dialogue";
import { Character } from "../types/character";
import { useGraphStore } from "../store/graphStore";
import { useShallow } from "zustand/shallow";
interface Props {
  data: { box: DialogueBox };
  selected: boolean;
  id: string;
}

function dialogueBox({ data, selected }: Props) {
  const { box } = data;


  const { updateBox,
          addChoice, 
          updateChoice, 
          deleteChoice, 
          deleteBox, 
          addChoiceCondition ,
          deleteChoiceCondition
        } = useGraphStore(
    useShallow((s) => ({
        updateBox: s.updateBox,
        addChoice: s.addChoice,
        updateChoice: s.updateChoice,
        deleteChoice: s.deleteChoice,
        deleteBox: s.deleteBox,
        addChoiceCondition: s.addChoiceCondition,
        deleteChoiceCondition: s.deleteChoiceCondition
    }))
    );

  const [localText, setLocalText] = useState(box.text);
  const [localKey, setLocalKey] = useState(box.key ?? "");
  const [localCustomName, setLocalCustomName] = useState(box.customSpeakerName ?? "");
  const [localDefaultNext, setLocalDefaultNext] = useState(box.defaultNext ?? "");
  const [localChoices, setLocalChoices] = useState(
    box.choices.map((c) => ({ id: c.id, prompt: c.prompt, next: typeof c.next === "string" ? c.next : "" }))
  );

  useEffect(() => { setLocalText(box.text); }, [box.text]);
  useEffect(() => { setLocalKey(box.key ?? ""); }, [box.key]);
  useEffect(() => { setLocalCustomName(box.customSpeakerName ?? ""); }, [box.customSpeakerName]);
  useEffect(() => { setLocalDefaultNext(box.defaultNext ?? ""); }, [box.defaultNext]);
  useEffect(() => {
    setLocalChoices(box.choices.map((c) => ({ id: c.id, prompt: c.prompt, next: typeof c.next === "string" ? c.next : "" })));
  }, [box.choices]);

  type CharacterInstance = typeof Character[keyof typeof Character];

  function getName(c: CharacterInstance) {
    switch (c) {
      case Character.CUSTOM:
        return "Custom";
      case Character.NARRATOR:
        return "Narrator";
      default:
        return c.displayName;
    }
  }

  return (
    <div className={`box-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} id={`${box.id}-default`} isConnectable={false} />

      {box.speaker?.portrait && (
        <img src={box.speaker.portrait} className="dialogue-box-portrait" key={box.speaker.portrait} />
      )}

      <div className="dialogue-node-header">
        <select
          value={box.speaker?.id ?? ""}
          onChange={(e) => {
            const found = Object.values(Character).find((c) => c.id === e.target.value);
            updateBox("dialogue",box.id, { speaker: found ?? null });
          }}
          className="dropdown-select"
        >
          {Object.values(Character).map((c) => (
            <option key={c.id} value={c.id}>
              {getName(c)}
            </option>
          ))}
        </select>

        <input
          type="text"
          defaultValue={localKey}
          key={`key-${box.id}`}
          placeholder="current key..."
          onChange={(e) => setLocalKey(e.target.value)}
          onBlur={() => updateBox("dialogue",box.id, { key: localKey || undefined })}
          className="text-input nodrag key-choice key-text"
        />

        <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
          ✕
        </button>
      </div>

      {box.speaker?.id === Character.CUSTOM.id && (
        <input
          className="custom-speaker-input nodrag"
          defaultValue={localCustomName}
          key={`custom-${box.id}`}
          placeholder="enter name..."
          onChange={(e) => setLocalCustomName(e.target.value)}
          onBlur={() => updateBox("dialogue",box.id, { customSpeakerName: localCustomName })}
        />
      )}

      <textarea
        className="text-input nodrag"
        defaultValue={localText}
        key={`text-${box.id}`}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={() => updateBox("dialogue",box.id, { text: localText })}
        placeholder="dialogue text..."
        rows={3}
      />

      <div className="choices-list">
        {box.choices.map((choice, index) => (
          <div key={choice.id} className="choice-row">
            <Handle
              type="target"
              position={Position.Left}
              id={`${box.id}-${choice.id}-condition-target`}
              isConnectable={false}
              style={{ top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              className="choice-prompt nodrag"
              defaultValue={localChoices[index]?.prompt ?? ""}
              key={`prompt-${choice.id}`}
              placeholder="prompt..."
              onChange={(e) => {
                const next = [...localChoices];
                next[index] = { ...next[index], prompt: e.target.value };
                setLocalChoices(next);
              }}
              onBlur={() => updateChoice(box.id, choice.id, { prompt: localChoices[index]?.prompt ?? "" })}
            />
            <input
              className="choice-next nodrag"
              defaultValue={localChoices[index]?.next ?? ""}
              key={`next-${choice.id}`}
              placeholder="box key..."
              onChange={(e) => {
                const next = [...localChoices];
                next[index] = { ...next[index], next: e.target.value };
                setLocalChoices(next);
              }}
              onBlur={() => updateChoice(box.id, choice.id, { next: localChoices[index]?.next ?? "" })}
            />
            <button className="delete-btn small" onClick={() => {
                choice.choiceConditionId ?
                  deleteChoiceCondition(choice.choiceConditionId)
                : addChoiceCondition(box.id,choice.id,{x:-300,y:100})
            }}>
              ?
            </button>
            <button className="delete-btn small" onClick={() => deleteChoice(box.id, choice.id)}>
              ✕
            </button>
            <Handle
              type="source"
              position={Position.Right}
              id={`${box.id}-${choice.id}`}
              isConnectable={false}
              style={{ top: "50%", right: -8, transform: "translateY(-50%)" }}
            />
          </div>
        ))}
        <button className="add-item-btn" onClick={() => addChoice(box.id)}>
          + choice
        </button>
      </div>

      <div className="default-next-row">
        <label>default next:</label>
        <input
          defaultValue={localDefaultNext}
          key={`default-${box.id}`}
          placeholder="box key..."
          onChange={(e) => setLocalDefaultNext(e.target.value)}
          onBlur={() => updateBox("dialogue",box.id, { defaultNext: localDefaultNext || null })}
          className="text-input default-text nodrag"
        />
        <Handle
          type="source"
          position={Position.Right}
          id={`${box.id}-default`}
          isConnectable={false}
          style={{ position: "relative", right: "-210%", top: "-180%" }}
        />
      </div>
    </div>
  );
}

export default memo(dialogueBox, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.id === next.id &&
    prev.data.box === next.data.box
  );
});