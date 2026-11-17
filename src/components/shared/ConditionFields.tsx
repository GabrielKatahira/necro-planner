import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EVALUATORS, type Evaluator } from "../../types/dialogue";
import {
    PRESET_VARIABLES,
    SLIDER_MAX,
    SLIDER_MIN,
    clampSlider,
    evaluatorForSlider,
    isPresetVariable,
} from "../../types/variables";
import styles from "./ConditionFields.module.css";

interface Patch {
    variable?: string;
    evaluator?: Evaluator;
    value?: string | number;
}

interface Props {
    variable: string;
    evaluator: Evaluator;
    value: string | number;
    stringValues?: boolean;
    compact?: boolean;
    onChange: (patch: Patch) => void;
}

export default function ConditionFields({ variable, evaluator, value, stringValues = false, compact = false, onChange }: Props) {
    const [localVariable, setLocalVariable] = useState(variable);
    const [localValue, setLocalValue] = useState(String(value ?? ""));
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setLocalVariable(variable); }, [variable]);
    useEffect(() => { setLocalValue(String(value ?? "")); }, [value]);

    const preset = isPresetVariable(variable);
    const sliderValue = clampSlider(value);
    const query = localVariable.trim().toLowerCase();
    const exactMatch = (PRESET_VARIABLES as readonly string[]).includes(query);
    const filtered = PRESET_VARIABLES.filter((name) => exactMatch || name.includes(query));
    const showCustomOption = query !== "" && !exactMatch;

    const encode = (num: number) => (stringValues ? String(num) : num);

    const commitVariable = (raw: string) => {
        const next = raw.trim();
        const lower = next.toLowerCase();
        if (isPresetVariable(lower)) {
            if (lower !== variable) {
                onChange({ variable: lower, evaluator: "==", value: encode(0) });
            }
        } else if (next !== variable) {
            onChange({ variable: next });
        }
        setLocalVariable(isPresetVariable(lower) ? lower : next);
        setOpen(false);
    };

    const openList = () => {
        if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
        setOpen(true);
    };

    const commitValue = () => {
        if (stringValues) {
            onChange({ value: localValue });
            return;
        }
        if (localValue.trim() === "") {
            onChange({ value: "" });
            return;
        }
        const num = Number(localValue);
        onChange({ value: isNaN(num) ? localValue : num });
    };

    return (
        <div className={`${styles.fields} ${compact ? styles.compact : ""}`}>
            <input
                ref={inputRef}
                className={`${styles.variableInput} nodrag`}
                value={localVariable}
                placeholder="variable..."
                onFocus={openList}
                onChange={(e) => {
                    setLocalVariable(e.target.value);
                    openList();
                }}
                onBlur={() => commitVariable(localVariable)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        commitVariable(localVariable);
                        inputRef.current?.blur();
                    }
                }}
            />
            {open && rect && (filtered.length > 0 || showCustomOption) && createPortal(
                <ul
                    className={styles.list}
                    style={{ top: rect.bottom + 2, left: rect.left, minWidth: Math.max(rect.width, 140) }}
                >
                    {filtered.map((name) => (
                        <li
                            key={name}
                            className={styles.option}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                commitVariable(name);
                            }}
                        >
                            {name}
                        </li>
                    ))}
                    {showCustomOption && (
                        <li
                            className={`${styles.option} ${styles.customOption}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                commitVariable(localVariable);
                            }}
                        >
                            custom: {localVariable.trim()}
                        </li>
                    )}
                </ul>,
                document.body
            )}
            {preset ? (
                <div className={styles.sliderRow}>
                    <input
                        type="range"
                        className={`${styles.slider} nodrag`}
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step={1}
                        value={sliderValue}
                        onChange={(e) => {
                            const num = Number(e.target.value);
                            onChange({ evaluator: evaluatorForSlider(num), value: encode(num) });
                        }}
                    />
                    <span className={styles.readout}>{evaluator} {sliderValue}</span>
                </div>
            ) : (
                <div className={styles.customRow}>
                    <select
                        className={`${styles.evalSelect} nodrag`}
                        value={evaluator}
                        onChange={(e) => onChange({ evaluator: e.target.value as Evaluator })}
                    >
                        {EVALUATORS.map((obj) => (
                            <option key={obj} value={obj}>{obj}</option>
                        ))}
                    </select>
                    <input
                        className={`${styles.valueInput} nodrag`}
                        value={localValue}
                        placeholder="value..."
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={commitValue}
                    />
                </div>
            )}
        </div>
    );
}
