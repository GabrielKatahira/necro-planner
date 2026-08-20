import MobileTreeOverlay from "./MobileTreeOverlay"
import { useState } from "react"
import { useGraphStore } from "../../store/graphStore";
import DialogueCard from "./DialogueCard";
import ConditionCard from "./ConditionCard";
import styles from "./MobileDialogueEditor.module.css";

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
        <div className={styles.editorRoot}>
            {showingMap ? (
                <MobileTreeOverlay 
                    onClose={handleCloseMap} 
                    onSelectBox={handleBoxSelectionFromMap}/>
            ) : (
                <div>
                    <button onClick={() => setShowingMap(true)} className={styles.showMapBtn}>◯ Show Map</button>
                    <div className={styles.cardWrapper}>
                        {activeBox ? (
                            activeBox.kind === "dialogue" ? (
                                <DialogueCard 
                                    box={activeBox} 
                                    changeActiveBox={(id) => setActiveBoxId(id)}
                                    onInitiateConnect={handleOpenMapForConnect}    
                                />
                            ) : activeBox.kind === "condition" ? (
                                <ConditionCard
                                    box={activeBox}
                                    changeActiveBox={(id) => setActiveBoxId(id)}
                                    onInitiateConnect={handleOpenMapForConnect}
                                />
                            ) : null 
                        ) : (
                            <div className={styles.emptyMessage}>No box selected.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
