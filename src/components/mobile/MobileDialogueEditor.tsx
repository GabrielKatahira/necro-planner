import MobileTreeOverlay from "./MobileTreeOverlay"
import { useState } from "react"
import { useGraphStore } from "../../store/graphStore";
import type { DialogueBox, GraphNode } from "../../types/dialogue";
import DialogueCard from "./DialogueCard";


export default function MobileDialogueEditor() {
    const [showingMap,setShowingMap] = useState(true);
    const [activeBoxId,setActiveBoxId] = useState("");
    const activeBox = useGraphStore((s) => s.graph.boxes[activeBoxId]);


    return(
        <div className="mobile-editor-root">
            {showingMap?(
                <MobileTreeOverlay onClose={()=>setShowingMap(false)} onSelectBox={(id)=>setActiveBoxId(id)}/>
            ):(
                <div>
                    <button onClick={()=>{setShowingMap(true);console.log(activeBox)}} className="show-map-btn">◯ Show Map</button>
                    <div className="mobile-card-wrapper">
                        {activeBox ?(
                            activeBox.kind === "dialogue" ? (
                                <DialogueCard box={activeBox} changeActiveBox={(id) => setActiveBoxId(id)}/>
                            ) : activeBox.kind === "condition" ? (
                                <div>Condition box</div>
                            ) : null 
                            )
                            : (<div>No box selected.</div>)
                            }
                    </div>
                </div>
            )}

            
        </div>
    )
}
