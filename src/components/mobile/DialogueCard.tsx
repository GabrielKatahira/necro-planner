import type { DialogueBox } from "../../types/dialogue";
import { Character } from "../../types/character";
import { useGraphStore } from "../../store/graphStore";
import { useState, useEffect } from "react";

interface Props {
    box: DialogueBox,
    changeActiveBox: (id:string)=>void
    onInitiateConnect: (onTargetPicked: (targetId: string) => void) => void;
}

export default function DialogueCard ({box, changeActiveBox, onInitiateConnect} : Props) {

    const addBox = useGraphStore((s) => s.addBox);
    const updateBox = useGraphStore((s) => s.updateBox);
    const deleteBox = useGraphStore((s) => s.deleteBox);
    const addChoice = useGraphStore((s) => s.addChoice);
    const updateChoice = useGraphStore((s) => s.updateChoice);
    const deleteChoice = useGraphStore((s) => s.deleteChoice);
    const boxes = useGraphStore((s) => s.graph.boxes);

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
                <div className="mobile-label">Speaker</div>
                <button className="delete-btn mobile-text-input" onClick={() =>{ 
                        if(confirm("Are you sure you want to delete this card?")){
                        deleteBox(box.id)
                        }
                    }
                } title="Delete box">
                ✕
                </button>
            </div>
            <div className="mobile-speaker-wrapper">
                <select
                value={box.speaker?.id ?? ""}
                onChange={(e) => {
                    const found = Object.values(Character).find((c) => c.id === e.target.value);
                    updateBox("dialogue", box.id, { speaker: found ?? null });
                }}
                className="dropdown-select mobile-dropdown-select"
                >
                {Object.values(Character).map((c) => (
                    <option key={c.id} value={c.id}>
                    {getName(c)}
                    </option>
                ))}
                </select>
                {box.speaker?.portrait && (
                    <img src={box.speaker.portrait}/>
                )}
            </div>
            {box.speaker?.id === Character.CUSTOM.id && (
                <div>
                    <div className="mobile-label">Custom Speaker Name</div>
                    <input
                    className="custom-speaker-input mobile-text-input"
                    value={localCustomName}
                    placeholder="enter name..."
                    onChange={(e) => setLocalCustomName(e.target.value)}
                    onBlur={() => updateBox("dialogue", box.id, { customSpeakerName: localCustomName })}
                    />
                </div>
            )}
            <div className="mobile-label">Dialogue Text</div>
            <textarea
                className="text-input mobile-text-input"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={() => updateBox("dialogue", box.id, { text: localText })}
                placeholder="dialogue text..."
                rows={3}
            />
            <div className="mobile-label">Choices</div>
            <div className="mobile-card-list">
                {box.choices.map((choice) => (
                    <div key={choice.id} className="choice-row">
                        <input
                        className="choice-prompt mobile-text-input"
                        value={localPrompts[choice.id] ?? choice.prompt}
                        placeholder="prompt..."
                        onChange={(e) => {
                            setLocalPrompts((prev) => ({ ...prev, [choice.id]: e.target.value }));
                        }}
                        onBlur={() =>
                            updateChoice(box.id, choice.id, { prompt: localPrompts[choice.id] ?? choice.prompt })
                        }
                        />
                        {choice.next?(
                            <button className="mobile-button" onClick={()=>changeActiveBox(choice.next!)}>
                                ↪
                            </button>
                            ):(
                            <div>
                                <button className="mobile-button" onClick={()=>{
                                    const currentChoicesCount = box.choices?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentChoicesCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("dialogue",newSafePos);
                                    updateChoice(box.id,choice.id,{next:newBoxId});
                                    changeActiveBox(newBoxId);
                                }}>
                                    &#x1F4AC;&#xFE0E;
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    const currentChoicesCount = box.choices?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentChoicesCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("condition",newSafePos);
                                    updateChoice(box.id,choice.id,{next:newBoxId});
                                    changeActiveBox(newBoxId);
                                }}>
                                    🗎
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    onInitiateConnect((id) => {
                                        updateChoice(box.id,choice.id,{next:id});
                                    })
                                }}>
                                    ⇔
                                </button>
                            </div>)
                        }
                        
                        <button
                        className="mobile-button"
                        onClick={() => {
                            //if (choice.choiceConditionId) deleteChoiceCondition(choice.choiceConditionId);
                            deleteChoice(box.id, choice.id);
                        }}
                        >
                        ✕
                        </button>
                    </div>
                ))}
                <button 
                    className="add-item-btn mobile-text-input" 
                    onClick={() => addChoice(box.id)}
                    disabled={!(box.defaultNext == null || box.defaultNext.trim() == "")}
                    >
                    + choice
                </button>
                {box.choices.length == 0 && (
                    <div>
                        <div className="mobile-label">Default Next</div>
                        {box.defaultNext?(
                            <button className="mobile-button mobile-default-next" onClick={()=>changeActiveBox(box.defaultNext!)}>
                                ↪
                            </button>
                        ):(
                            
                            <div className="mobile-default-next">
                                <button className="mobile-button" onClick={()=>{
                                    const currentChoicesCount = box.choices?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentChoicesCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("dialogue",newSafePos);
                                    updateBox("dialogue",box.id,{defaultNext:newBoxId})
                                    changeActiveBox(newBoxId);
                                }}>
                                    &#x1F4AC;&#xFE0E;
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    const currentChoicesCount = box.choices?.length ?? 0;
                                    const newPosition = getNewNodePosition(box, currentChoicesCount);
                                    const newSafePos = getNonOverlappingPosition(newPosition,boxes);
                                    const newBoxId = addBox("condition",newSafePos);
                                    updateBox("dialogue",box.id,{defaultNext:newBoxId})
                                    changeActiveBox(newBoxId);
                                }}>
                                    🗎
                                </button>
                                <button className="mobile-button" onClick={()=>{
                                    onInitiateConnect((id) => {
                                        updateBox("dialogue",box.id,{defaultNext:id})
                                    })
                                }}>
                                    ⇔
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    )

}