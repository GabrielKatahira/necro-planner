import { useReactFlow } from "reactflow";
import { useGraphStore } from "../../store/graphStore";
import { useRef } from "react";
import { exportGraphAsFile, importGraphFromFile } from "../../store/persist";
import styles from "./Toolbar.module.css";

export default function Toolbar() {
  const { screenToFlowPosition } = useReactFlow();
  const addBox = useGraphStore((s) => s.addBox);
  const graph = useGraphStore((s) => s.graph);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetGraph = useGraphStore((s) => s.resetGraph);

  const centerOfScreen = () =>
    screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  return (
    <>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={() => addBox("dialogue", centerOfScreen())}>+ Add Dialogue Box</button>
        <button className={styles.toolBtn} onClick={() => addBox("condition", centerOfScreen())}>+ Add Condition Box</button>
      </div>
      <div className={styles.jsonbar}>
        <button className={styles.toolBtn} onClick={() => exportGraphAsFile(graph)}>Export JSON</button>
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const imported = await importGraphFromFile(file);
            useGraphStore.setState({ graph: imported });
          }}
        />
        <button className={styles.toolBtn} onClick={() => fileInputRef.current?.click()}>Import JSON</button>
        <button className={styles.toolBtn} onClick={() => {
          if (confirm("Clear the current graph? Export first if you want to keep it.")) {
            resetGraph(centerOfScreen());
          }
        }}>Reset Graph</button>
      </div>
    </>
  );
}