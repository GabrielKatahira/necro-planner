import { memo } from "react";
import type { CharacterSheet } from "../../types/characterSheet";
import { useCharacterStore } from "../../store/characterStore";
import styles from "./CharacterCard.module.css";

interface Props {
  data: { sheet: CharacterSheet };
  selected: boolean;
}

function CharacterCard({ data, selected }: Props) {
  const { sheet } = data;
  const openSheet = useCharacterStore((s) => s.openSheet);

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={() => openSheet(sheet.id)}
    >
      <span className={styles.name}>{sheet.name || "Unnamed"}</span>
      <p className={styles.preview}>{sheet.backstory || sheet.personality || "Click to open"}</p>
    </div>
  );
}

export default memo(CharacterCard);
