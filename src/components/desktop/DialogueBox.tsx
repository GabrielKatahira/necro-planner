import { Handle, Position } from "reactflow";
import { memo, useState, useEffect } from "react";
import type { DialogueBox } from "../../types/dialogue";
import SpeakerSelect from "../shared/SpeakerSelect";
import { SPEAKER_CUSTOM } from "../../utils/speakers";
import { useGraphStore } from "../../store/graphStore";
import { useShallow } from "zustand/shallow";
import styles from "./DialogueBox.module.css";

interface Props {
  data: { box: DialogueBox };
  selected: boolean;
  id: string;
}

function DialogueBoxNode({ data, selected }: Props) {
  const { box } = data;

  const {
    updateBox,
    addChoice,
    updateChoice,
    deleteChoice,
    deleteBox,
    addChoiceCondition,
    deleteChoiceCondition,
  } = useGraphStore(
    useShallow((s) => ({
      updateBox: s.updateBox,
      addChoice: s.addChoice,
      updateChoice: s.updateChoice,
      deleteChoice: s.deleteChoice,
      deleteBox: s.deleteBox,
      addChoiceCondition: s.addChoiceCondition,
      deleteChoiceCondition: s.deleteChoiceCondition,
    }))
  );

  const [localText, setLocalText] = useState(box.text);
  const [localCustomName, setLocalCustomName] = useState(box.customSpeakerName ?? "");
  const [localPrompts, setLocalPrompts] = useState<Record<string, string>>({});

  useEffect(() => { setLocalText(box.text); }, [box.text]);
  useEffect(() => { setLocalCustomName(box.customSpeakerName ?? ""); }, [box.customSpeakerName]);

  useEffect(() => {
    const promptMap: Record<string, string> = {};
    box.choices.forEach((c) => {
      promptMap[c.id] = c.prompt;
    });
    setLocalPrompts(promptMap);
  }, [box.choices]);

  return (
    <div className={`${styles.boxNode} ${selected ? styles.selected : ""}`}>
      <Handle type="target" position={Position.Left} id={`${box.id}-default`} isConnectable={true} />

      <div className={styles.header}>
        <SpeakerSelect
          value={box.speakerId}
          onChange={(speakerId) => updateBox("dialogue", box.id, { speakerId })}
          className={styles.dropdownSelect}
        />

        <button className={styles.deleteBtn} onClick={() => deleteBox(box.id)} title="Delete box">
          ✕
        </button>
      </div>

      {box.speakerId === SPEAKER_CUSTOM && (
        <input
          className={`${styles.customSpeakerInput} nodrag`}
          value={localCustomName}
          placeholder="enter name..."
          onChange={(e) => setLocalCustomName(e.target.value)}
          onBlur={() => updateBox("dialogue", box.id, { customSpeakerName: localCustomName })}
        />
      )}

      <textarea
        className={`${styles.textInput} nodrag`}
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={() => updateBox("dialogue", box.id, { text: localText })}
        placeholder="dialogue text..."
        rows={3}
      />

      <div className={styles.choicesList}>
        {box.choices.map((choice, index) => (
          <div key={choice.id} className={styles.choiceRow}>
            <Handle
              type="target"
              position={Position.Left}
              id={`${box.id}-${choice.id}-condition-target`}
              isConnectable={false}
              style={{ top: "50%", transform: "translateY(-50%)", opacity: 0}}
            />
            <input
              className={`${styles.choicePrompt} nodrag`}
              value={localPrompts[choice.id] ?? choice.prompt}
              placeholder="prompt..."
              onChange={(e) => {
                setLocalPrompts((prev) => ({ ...prev, [choice.id]: e.target.value }));
              }}
              onBlur={() =>
                updateChoice(box.id, choice.id, { prompt: localPrompts[choice.id] ?? choice.prompt })
              }
            />
            <input
              className={`${styles.choiceNext} nodrag`}
              value={typeof choice.next === "string" ? choice.next : ""}
              placeholder="no connection..."
              disabled={true}
              readOnly
            />
            <button
              className={styles.smallBtn}
              onClick={() => {
                if (choice.choiceConditionId) {
                  deleteChoiceCondition(choice.choiceConditionId);
                } else {
                  addChoiceCondition(box.id, choice.id, { x: -220, y: 100 + index * 30 });
                }
              }}
            >
              ?
            </button>
            <button
              className={styles.smallBtn}
              onClick={() => {
                if (choice.choiceConditionId) deleteChoiceCondition(choice.choiceConditionId);
                deleteChoice(box.id, choice.id);
              }}
            >
              ✕
            </button>
            <Handle
              type="source"
              position={Position.Right}
              id={`${box.id}-${choice.id}`}
              isConnectable={true}
              style={{ top: "50%", right: -8, transform: "translateY(-50%)" }}
            />
          </div>
        ))}
        <button className={styles.addItemBtn} onClick={() => addChoice(box.id)}>
          + choice
        </button>
      </div>

      <div className={styles.defaultNextRow}>
        <label>default next:</label>
        <input
          value={box.defaultNext ?? ""}
          disabled={true}
          readOnly
          placeholder="no connection..."
          className={`${styles.textInput} ${styles.defaultText} nodrag`}
        />
        <Handle
          type="source"
          position={Position.Right}
          id={`${box.id}-default`}
          isConnectable={true}
          style={{ position: "relative", right: "-210%", top: "-180%" }}
        />
      </div>
    </div>
  );
}

export default memo(DialogueBoxNode, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.id === next.id &&
    prev.data.box === next.data.box
  );
});