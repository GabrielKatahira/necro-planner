import { useEffect, useState } from "react";
import { useCharacterStore } from "../../store/characterStore";
import type { CharacterSheet } from "../../types/characterSheet";
import styles from "./CharacterModal.module.css";

type Update = (patch: Partial<Omit<CharacterSheet, "id">>) => void;

interface TabDef {
  id: string;
  label: string;
  render: (sheet: CharacterSheet, update: Update) => React.ReactNode;
}

function BasicInfo({ sheet, update }: { sheet: CharacterSheet; update: Update }) {
  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Age</label>
          <input className={styles.input} value={sheet.age} onChange={(e) => update({ age: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Birthday</label>
          <input className={styles.input} value={sheet.birthday} onChange={(e) => update({ birthday: e.target.value })} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Aliases</label>
        <input
          className={styles.input}
          value={sheet.aliases}
          placeholder="Comma separated"
          onChange={(e) => update({ aliases: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Personality</label>
        <textarea
          className={styles.textArea}
          rows={6}
          value={sheet.personality}
          onChange={(e) => update({ personality: e.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Backstory</label>
        <textarea
          className={styles.textArea}
          rows={10}
          value={sheet.backstory}
          onChange={(e) => update({ backstory: e.target.value })}
        />
      </div>
    </div>
  );
}

// Add new tabs here as the sheet grows.
const TABS: TabDef[] = [
  { id: "basic", label: "Basic Info", render: (sheet, update) => <BasicInfo sheet={sheet} update={update} /> },
  { id: "relationships", label: "Relationships", render: () => <p className={styles.placeholder}>Coming soon</p> },
  { id: "images", label: "Images", render: () => <p className={styles.placeholder}>Coming soon</p> },
];

export default function CharacterModal() {
  const openId = useCharacterStore((s) => s.openId);
  const sheet = useCharacterStore((s) => (s.openId ? s.board.sheets[s.openId] : undefined));
  const closeSheet = useCharacterStore((s) => s.closeSheet);
  const updateSheet = useCharacterStore((s) => s.updateSheet);
  const deleteSheet = useCharacterStore((s) => s.deleteSheet);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, closeSheet]);

  if (!openId || !sheet) return null;

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div className={styles.backdrop} onClick={closeSheet}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sidebar}>
          <input
            className={styles.nameInput}
            value={sheet.name}
            placeholder="Name"
            onChange={(e) => updateSheet(sheet.id, { name: e.target.value })}
          />

          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`${styles.tab} ${t.id === tab.id ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            className={styles.deleteBtn}
            onClick={() => {
              if (confirm(`Delete ${sheet.name || "this character"}?`)) {
                closeSheet();
                deleteSheet(sheet.id);
              }
            }}
          >
            Delete character
          </button>
        </div>

        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={closeSheet} aria-label="Close">✕</button>
          {tab.render(sheet, (patch) => updateSheet(sheet.id, patch))}
        </div>
      </div>
    </div>
  );
}
