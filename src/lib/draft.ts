import { expandInstruction } from "@/lib/parser/abbreviations";
import { buildSummary, extractRepeatPrevious, friendlyLabel, rangeNote } from "@/lib/parser/enrich";
import { emptyMeta, type PatternMeta } from "@/lib/parser/meta";
import type {
  FoundAbbreviation,
  ParsedPattern,
  ParsedSection,
  ParsedStep,
  PatternLanguage,
  RowKind,
  SectionKind,
} from "@/lib/parser/types";

const ROW_KINDS: RowKind[] = ["anschlag", "reihe", "runde", "hinweis", "montage"];
const SECTION_KINDS: SectionKind[] = ["work", "montage", "size"];

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function asRowKind(value: unknown): RowKind {
  return ROW_KINDS.includes(value as RowKind) ? (value as RowKind) : "hinweis";
}

function asSectionKind(value: unknown): SectionKind {
  return SECTION_KINDS.includes(value as SectionKind) ? (value as SectionKind) : "work";
}

function asLanguage(value: unknown, fallback: PatternLanguage): PatternLanguage {
  return value === "en" || value === "de" ? value : fallback;
}

function autoLabel(step: Pick<ParsedStep, "rowKind" | "rowFrom" | "rowTo">): string {
  return friendlyLabel({
    kind: step.rowKind,
    rowFrom: step.rowFrom,
    rowTo: step.rowTo,
    untitledIndex: 1,
  });
}

export function blankStep(from?: Partial<ParsedStep>): ParsedStep {
  const rowKind = from?.rowKind ?? "hinweis";
  const rowFrom = from?.rowFrom ?? null;
  const rowTo = from?.rowTo ?? rowFrom;
  const step: ParsedStep = {
    label: from?.label ?? autoLabel({ rowKind, rowFrom, rowTo }),
    summary: "",
    original: from?.original ?? "",
    rowFrom,
    rowTo,
    rowKind,
    instruction: from?.instruction ?? "",
    abbreviations: [],
    expectedStitches: from?.expectedStitches ?? null,
    rangeNote: null,
    hints: from?.hints ?? [],
  };
  return refreshStep(step, "de");
}

export function blankSection(): ParsedSection {
  return {
    title: "Neues Teil",
    kind: "work",
    sizeLabel: null,
    steps: [blankStep()],
  };
}

export function refreshStep(step: ParsedStep, lang: PatternLanguage): ParsedStep {
  const source = step.instruction.trim() || step.original;
  const { abbreviations } = expandInstruction(source, lang);
  const note = rangeNote(
    step.rowFrom,
    step.rowTo,
    step.rowKind,
    extractRepeatPrevious(step.instruction) ?? extractRepeatPrevious(step.original),
  );
  return {
    ...step,
    abbreviations,
    rangeNote: note,
    summary: buildSummary(step.instruction || step.original, lang, {
      expectedStitches: step.expectedStitches,
      rangeNote: note,
    }),
  };
}

export function patchStep(
  step: ParsedStep,
  patch: Partial<ParsedStep>,
  lang: PatternLanguage,
): ParsedStep {
  const next: ParsedStep = { ...step, ...patch };
  if (patch.rowFrom !== undefined && next.rowFrom != null && next.rowTo == null) {
    next.rowTo = next.rowFrom;
  }
  if (next.rowFrom != null && next.rowTo != null && next.rowTo < next.rowFrom) {
    next.rowTo = next.rowFrom;
  }
  const structureChanged =
    patch.rowKind !== undefined || patch.rowFrom !== undefined || patch.rowTo !== undefined;
  if (structureChanged && (patch.label === undefined) && step.label === autoLabel(step)) {
    next.label = autoLabel(next);
  }
  return refreshStep(next, lang);
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

function sanitizeAbbr(raw: unknown): FoundAbbreviation {
  const item = (raw ?? {}) as Record<string, unknown>;
  const count = intOrNull(item.count);
  return {
    abbr: clip(item.abbr, 40),
    meaning: clip(item.meaning, 120),
    count: count != null && count > 0 ? count : null,
  };
}

function sanitizeMeta(raw: unknown): PatternMeta {
  const meta = emptyMeta();
  if (!raw || typeof raw !== "object") return meta;
  const src = raw as Record<string, unknown>;
  const keys = ["hook", "yarn", "yarnAmount", "height", "width", "length", "gauge", "difficulty"] as const;
  for (const key of keys) {
    const value = clip(src[key], 160);
    meta[key] = value || null;
  }
  if (Array.isArray(src.sizes)) {
    meta.sizes = src.sizes.map((s) => clip(s, 24)).filter(Boolean).slice(0, 20);
  }
  if (Array.isArray(src.extras)) {
    meta.extras = src.extras
      .map((item) => {
        const rec = (item ?? {}) as Record<string, unknown>;
        return { label: clip(rec.label, 40), value: clip(rec.value, 160) };
      })
      .filter((item) => item.label && item.value)
      .slice(0, 20);
  }
  return meta;
}

function sanitizeStep(raw: unknown, lang: PatternLanguage): ParsedStep | null {
  const src = (raw ?? {}) as Record<string, unknown>;
  const instruction = clip(src.instruction, 8000);
  const original = clip(src.original, 8000);
  if (!instruction && !original) return null;
  return refreshStep(
    {
      label: clip(src.label, 80) || "Schritt",
      summary: clip(src.summary, 400),
      original: original || instruction,
      rowFrom: intOrNull(src.rowFrom),
      rowTo: intOrNull(src.rowTo),
      rowKind: asRowKind(src.rowKind),
      instruction: instruction || original,
      abbreviations: Array.isArray(src.abbreviations)
        ? src.abbreviations.map(sanitizeAbbr).filter((a) => a.abbr).slice(0, 40)
        : [],
      expectedStitches: intOrNull(src.expectedStitches),
      rangeNote: clip(src.rangeNote, 200) || null,
      hints: Array.isArray(src.hints)
        ? src.hints.map((item) => clip(item, 8000)).filter(Boolean).slice(0, 20)
        : [],
    },
    lang,
  );
}

function sanitizeSection(raw: unknown, lang: PatternLanguage): ParsedSection | null {
  const src = (raw ?? {}) as Record<string, unknown>;
  const steps = Array.isArray(src.steps)
    ? src.steps.map((step) => sanitizeStep(step, lang)).filter((step): step is ParsedStep => Boolean(step))
    : [];
  if (steps.length === 0) return null;
  const kind = asSectionKind(src.kind);
  const sizeLabel = kind === "size" ? clip(src.sizeLabel, 24) || null : clip(src.sizeLabel, 24) || null;
  return {
    title: clip(src.title, 80) || "Teil",
    kind,
    sizeLabel: kind === "size" ? sizeLabel || "—" : sizeLabel,
    steps,
  };
}

export function sanitizeParsedPattern(
  raw: unknown,
  fallbackName: string,
  fallbackLang: PatternLanguage,
): ParsedPattern {
  const src = (raw ?? {}) as Record<string, unknown>;
  const language = asLanguage(src.language, fallbackLang);
  const sections = Array.isArray(src.sections)
    ? src.sections
        .map((section) => sanitizeSection(section, language))
        .filter((section): section is ParsedSection => Boolean(section))
        .slice(0, 80)
    : [];
  if (sections.length === 0) {
    throw new Error("Die korrigierte Anleitung hat keine Schritte.");
  }
  return {
    suggestedName: clip(src.suggestedName, 120) || fallbackName,
    language,
    meta: sanitizeMeta(src.meta),
    sections,
  };
}
