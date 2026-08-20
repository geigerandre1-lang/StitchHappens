import type { RowKind } from "./types";

export type HintableStep = {
  id?: string;
  rowKind: string;
  instruction: string;
  hints?: string[];
};

export function clipHints(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function hintTexts(step: HintableStep): string[] {
  const own = clipHints(step.hints);
  const instruction = step.instruction.trim();
  if (step.rowKind === "hinweis" && instruction && !own.includes(instruction)) {
    return [...own, instruction];
  }
  return own;
}

/** Attach standalone Hinweis steps onto the previous (or next) crochet/montage step. */
export function attachHintsToSteps<T extends HintableStep>(steps: T[]): {
  steps: T[];
  hintRedirects: Record<string, string>;
} {
  const hintRedirects: Record<string, string> = {};
  if (steps.length === 0) return { steps, hintRedirects };

  const hasHost = steps.some((step) => step.rowKind !== "hinweis");
  if (!hasHost) {
    return {
      steps: steps.map((step) => ({ ...step, hints: hintTexts(step) })),
      hintRedirects,
    };
  }

  const result: T[] = [];
  let pending: string[] = [];
  let pendingIds: string[] = [];

  const absorb = (host: T, extra: string[], ids: string[]): T => {
    const nextHints = [...new Set([...(host.hints ?? []), ...extra].filter(Boolean))];
    if (host.id) {
      for (const id of ids) hintRedirects[id] = host.id;
    }
    return { ...host, hints: nextHints };
  };

  for (const step of steps) {
    if (step.rowKind === "hinweis") {
      const texts = hintTexts(step);
      if (result.length > 0) {
        result[result.length - 1] = absorb(result[result.length - 1], texts, step.id ? [step.id] : []);
      } else {
        pending.push(...texts);
        if (step.id) pendingIds.push(step.id);
      }
      continue;
    }
    result.push(absorb({ ...step, hints: clipHints(step.hints) }, pending, pendingIds));
    pending = [];
    pendingIds = [];
  }

  return { steps: result, hintRedirects };
}

export function isWorkRowKind(kind: string): kind is RowKind {
  return kind === "anschlag" || kind === "reihe" || kind === "runde";
}
