import MobileTreeOverlay from "./MobileTreeOverlay"
import { useState } from "react"
import { useGraphStore } from "../../store/graphStore";
import DialogueCard from "./DialogueCard";


export default function MobileDialogueEditor() {
    const [showingMap,setShowingMap] = useState(true);
    const [activeBoxId,setActiveBoxId] = useState("");
    const activeBox = useGraphStore((s) => s.graph.boxes[activeBoxId]);
    const [onConnectTargetPicked, setOnConnectTargetPicked] = useState<((targetId: string) => void) | null>(null);

    const handleOpenMapForConnect = (onTargetPicked: (targetId: string) => void) => {
        setOnConnectTargetPicked(() => onTargetPicked);
        setShowingMap(true);
    };

    const handleBoxSelectionFromMap = (targetBoxId: string) => {
        if (onConnectTargetPicked) {
            onConnectTargetPicked(targetBoxId);
            setOnConnectTargetPicked(null);
            setShowingMap(false);
        } else {
            setActiveBoxId(targetBoxId);
            setShowingMap(false);
        }
    };
    const handleCloseMap = () => {
        setOnConnectTargetPicked(null); 
        setShowingMap(false);
    };

    return(
        <div className="mobile-editor-root">
            {showingMap?(
                <MobileTreeOverlay 
                    onClose={handleCloseMap} 
                    onSelectBox={handleBoxSelectionFromMap}/>
            ):(
                <div>
                    <button onClick={()=>{setShowingMap(true);console.log(activeBox)}} className="show-map-btn">◯ Show Map</button>
                    <div className="mobile-card-wrapper">
                        {activeBox ?(
                            activeBox.kind === "dialogue" ? (
                                <DialogueCard 
                                    box={activeBox} 
                                    changeActiveBox={(id) => setActiveBoxId(id)}
                                    onInitiateConnect={handleOpenMapForConnect}    
                                />
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
