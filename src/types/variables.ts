import type { Evaluator } from "./dialogue";

export const PRESET_VARIABLES = ["morality", "lightheartedness", "rationality", "confidence"] as const;

export const SLIDER_MIN = -3;
export const SLIDER_MAX = 3;

export function isPresetVariable(variable: string) {
  return (PRESET_VARIABLES as readonly string[]).includes(variable);
}

export function evaluatorForSlider(value: number): Evaluator {
  if (value < 0) return "<=";
  if (value > 0) return ">=";
  return "==";
}

export function clampSlider(value: unknown) {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.round(num)));
}
