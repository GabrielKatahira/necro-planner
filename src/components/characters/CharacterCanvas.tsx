import { useCallback, useEffect, useRef } from "react";
import ReactFlow, { useNodesState, useReactFlow } from "reactflow";
import type { Node } from "reactflow";
import "reactflow/dist/style.css";
import { exportBoardAsFile, importBoardFromFile, useCharacterStore } from "../../store/characterStore";
import CharacterCard from "./CharacterCard";
import CharacterModal from "./CharacterModal";
import StarfieldBackground from "../desktop/StarfieldBackground";
import styles from "./CharacterCanvas.module.css";

const nodeTypes = { characterCard: CharacterCard };

function Toolbar() {
  const { screenToFlowPosition } = useReactFlow();
  const board = useCharacterStore((s) => s.board);
  const addSheet = useCharacterStore((s) => s.addSheet);
  const replaceBoard = useCharacterStore((s) => s.replaceBoard);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className={styles.toolbar}>
        <button
          className={styles.toolBtn}
          onClick={() => addSheet(screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }))}
        >
          + Add Character
        </button>
      </div>
      <div className={styles.jsonbar}>
        <button className={styles.toolBtn} onClick={() => exportBoardAsFile(board)}>Export JSON</button>
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!confirm("Replace all characters with the imported file? Export first if you want to keep the current ones.")) return;
            try {
              replaceBoard(await importBoardFromFile(file));
            } catch {
              alert("That file isn't a valid character export.");
            }
          }}
        />
        <button className={styles.toolBtn} onClick={() => fileInputRef.current?.click()}>Import JSON</button>
      </div>
    </>
  );
}

export default function CharacterCanvas() {
  const sheets = useCharacterStore((s) => s.board.sheets);
  const moveSheet = useCharacterStore((s) => s.moveSheet);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  useEffect(() => {
    setNodes((prev) =>
      Object.values(sheets).map((sheet) => ({
        id: sheet.id,
        type: "characterCard",
        position: sheet.position,
        selected: prev.find((n) => n.id === sheet.id)?.selected,
        data: { sheet },
      }))
    );
  }, [sheets, setNodes]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => moveSheet(node.id, node.position),
    [moveSheet]
  );

  return (
    <div className={styles.canvasWrapper}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        deleteKeyCode={null}
        fitView
      >
        <StarfieldBackground />
        <Toolbar />
      </ReactFlow>
      <CharacterModal />
    </div>
  );
}
