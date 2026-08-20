import styles from './App.module.css'
import { useIsMobileDevice } from './hooks/useIsMobileDevice'
import GraphCanvas from './components/desktop/GraphCanvas'
import MobileDialogueEditor from './components/mobile/MobileDialogueEditor';
import { useState } from 'react';

function App() {
  const isMobileDetected = useIsMobileDevice();
  const [overrideMode, setOverrideMode] = useState<"desktop" | "mobile" | null>(null);
  const activeMode = overrideMode ?? (isMobileDetected ? "mobile" : "desktop");

  return (
    <div className={styles.appRoot}>
      <div className={styles.viewModeToggle}>
        <button
          onClick={() => setOverrideMode(activeMode === "mobile" ? "desktop" : "mobile")}
          className={styles.modeBtn}
        >
          Switch to {activeMode === "mobile" ? "Desktop Canvas" : "Mobile Editor"}
        </button>
      </div>

      {activeMode === "desktop" ? <GraphCanvas /> : <MobileDialogueEditor />}
    </div>
  )
}

export default App
