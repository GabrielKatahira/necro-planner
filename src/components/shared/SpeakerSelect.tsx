import { useMemo } from "react";
import { useCharacterStore } from "../../store/characterStore";
import { SPEAKER_CUSTOM, SPEAKER_NARRATOR } from "../../utils/speakers";

interface Props {
  value: string | null;
  onChange: (speakerId: string | null) => void;
  className?: string;
}

// Speaker dropdown fed by the Characters tab, plus Narrator and Custom.
export default function SpeakerSelect({ value, onChange, className }: Props) {
  const sheets = useCharacterStore((s) => s.board.sheets);
  const sorted = useMemo(
    () => Object.values(sheets).sort((a, b) => a.name.localeCompare(b.name)),
    [sheets]
  );

  const isOrphan =
    value !== null && value !== SPEAKER_NARRATOR && value !== SPEAKER_CUSTOM && !sheets[value];

  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={className}>
      {value === null && <option value="" disabled>Select speaker...</option>}
      {isOrphan && <option value={value}>(deleted character)</option>}
      <option value={SPEAKER_NARRATOR}>Narrator</option>
      <option value={SPEAKER_CUSTOM}>Custom</option>
      {sorted.map((s) => (
        <option key={s.id} value={s.id}>{s.name || "Unnamed"}</option>
      ))}
    </select>
  );
}
