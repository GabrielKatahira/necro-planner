import styles from './App.module.css'
import { useIsMobileDevice } from './hooks/useIsMobileDevice'
import GraphCanvas from './components/desktop/GraphCanvas'
import MobileDialogueEditor from './components/mobile/MobileDialogueEditor';
import CharacterCanvas from './components/characters/CharacterCanvas';
import { useState } from 'react';

type AppMode = "dialogue" | "characters";
const APP_MODE_KEY = "dialogue-planner:app-mode";

function loadAppMode(): AppMode {
  try {
    return localStorage.getItem(APP_MODE_KEY) === "characters" ? "characters" : "dialogue";
  } catch {
    return "dialogue";
  }
}

function App() {
  const isMobileDetected = useIsMobileDevice();
  const [overrideMode, setOverrideMode] = useState<"desktop" | "mobile" | null>(null);
  const [appMode, setAppModeState] = useState<AppMode>(loadAppMode);
  const activeMode = overrideMode ?? (isMobileDetected ? "mobile" : "desktop");

  const setAppMode = (mode: AppMode) => {
    setAppModeState(mode);
    try { localStorage.setItem(APP_MODE_KEY, mode); } catch { /* ignore */ }
  };

  return (
    <div className={styles.appRoot}>
      <div className={styles.appModeTabs}>
        <button
          className={`${styles.modeBtn} ${appMode === "dialogue" ? styles.modeBtnActive : ""}`}
          onClick={() => setAppMode("dialogue")}
        >
          Dialogue
        </button>
        <button
          className={`${styles.modeBtn} ${appMode === "characters" ? styles.modeBtnActive : ""}`}
          onClick={() => setAppMode("characters")}
        >
          Characters
        </button>
      </div>

      {appMode === "dialogue" && (
        <div className={styles.viewModeToggle}>
          <button
            onClick={() => setOverrideMode(activeMode === "mobile" ? "desktop" : "mobile")}
            className={styles.modeBtn}
          >
            Switch to {activeMode === "mobile" ? "Desktop Canvas" : "Mobile Editor"}
          </button>
        </div>
      )}

      {appMode === "characters"
        ? <CharacterCanvas />
        : activeMode === "desktop" ? <GraphCanvas /> : <MobileDialogueEditor />}
    </div>
  )
}

export default App
