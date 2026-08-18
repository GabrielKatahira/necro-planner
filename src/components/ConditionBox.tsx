import { Handle, Position } from "reactflow";
import { memo, useState, useEffect } from "react";
import { useGraphStore } from "../store/graphStore";
import { EVALUATORS, type ConditionBox, type Evaluator } from "../types/dialogue";

interface Props {
  data: { box: ConditionBox };
  selected: boolean;
  id: string;
}

function ConditionBoxNode({ data, selected }: Props) {
  const { box } = data;

  const addEvaluation = useGraphStore((s) => s.addEvaluation);
  const updateEvaluation = useGraphStore((s) => s.updateEvaluation);
  const deleteEvaluation = useGraphStore((s) => s.deleteEvaluation);
  const deleteBox = useGraphStore((s) => s.deleteBox);

  const parseInputValue = (val: string): string | number => {
    if (val.trim() === "") return "";
    const num = Number(val);
    return isNaN(num) ? val : num;
  };

  const [localVariables, setLocalVariables] = useState<Record<string, string>>({});
  const [localValues, setLocalValues] = useState<Record<string, string | number>>({});

  useEffect(() => {
    const vars: Record<string, string> = {};
    const vals: Record<string, string | number> = {};

    box.evaluations.forEach((evalItem) => {
      vars[evalItem.id] = evalItem.variable;
      vals[evalItem.id] = evalItem.value;
    });

    setLocalVariables(vars);
    setLocalValues(vals);
  }, [box.evaluations]);

  return (
    <div className={`box-node ${selected ? "selected" : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        id={`${box.id}-default`}
        isConnectable={true}
      />

      <div className="condition-header">
        <div>Condition</div>
        <button className="delete-btn" onClick={() => deleteBox(box.id)} title="Delete box">
          ✕
        </button>
      </div>

      <div className="evaluations-list">
        {box.evaluations.map((evaluation) => (
          <div key={evaluation.id} className="evaluations-row">
            <input
              className="text-input nodrag"
              value={localVariables[evaluation.id] ?? evaluation.variable}
              placeholder="variable..."
              onChange={(e) => {
                setLocalVariables((prev) => ({ ...prev, [evaluation.id]: e.target.value }));
              }}
              onBlur={() =>
                updateEvaluation(box.id, evaluation.id, {
                  variable: localVariables[evaluation.id] ?? evaluation.variable,
                })
              }
            />

            <select
              value={evaluation.evaluator}
              className="dropdown-select eval-select"
              onChange={(e) => {
                updateEvaluation(box.id, evaluation.id, {
                  evaluator: e.target.value as Evaluator,
                });
              }}
            >
              {EVALUATORS.map((obj) => (
                <option key={obj} value={obj}>
                  {obj}
                </option>
              ))}
            </select>

            <input
            className="text-input eval-value nodrag"
            value={localValues[evaluation.id] ?? evaluation.value ?? ""}
            placeholder="value..."
            onChange={(e) => {
                setLocalValues((prev) => ({ ...prev, [evaluation.id]: e.target.value }));
            }}
            onBlur={() => {
                const rawVal = localValues[evaluation.id];
                const finalVal = rawVal !== undefined ? parseInputValue(String(rawVal)) : evaluation.value;
                updateEvaluation(box.id, evaluation.id, { value: finalVal });
            }}
            />

            <input
              className="text-input eval-fallback nodrag"
              value={typeof evaluation.next === "string" ? evaluation.next : ""}
              placeholder="no connection..."
              disabled={true}
              readOnly
            />

            <button
              className="delete-btn"
              onClick={() => deleteEvaluation(box.id, evaluation.id)}
              title="Delete evaluation"
            >
              ✕
            </button>

            <Handle
              type="source"
              position={Position.Right}
              id={`${box.id}-${evaluation.id}`}
              isConnectable={true}
              style={{ top: "50%", right: -8, transform: "translateY(-50%)" }}
            />
          </div>
        ))}

        <button className="add-item-btn" onClick={() => addEvaluation(box.id)}>
          + evaluation
        </button>
      </div>

      <div className="default-next-row">
        <label>fallback:</label>
        <input
          value={box.fallback ?? ""}
          placeholder="no connection..."
          disabled={true}
          readOnly
          className="text-input default-text nodrag"
        />
        <Handle
          type="source"
          position={Position.Right}
          id={`${box.id}-fallback`}
          isConnectable={true}
          style={{ position: "relative", right: "-210%", top: "-180%" }}
        />
      </div>
    </div>
  );
}

export default memo(ConditionBoxNode, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.id === next.id &&
    prev.data.box === next.data.box
  );
});