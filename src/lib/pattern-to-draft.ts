import { emptyMeta, isMontageTitle, parseSizeHeader, type PatternMeta } from "@/lib/parser/meta";
import type { PatternLanguage, ParsedPattern, RowKind, SectionKind } from "@/lib/parser/types";

type EditPatternRow = {
  id: string;
  name: string;
  language: string;
  meta: unknown;
  coverImage: string | null;
  categoryId: string | null;
  sections: Array<{
    id: string;
    title: string;
    kind: string;
    sizeLabel: string | null;
    sortOrder: number;
    steps: Array<{
      id: string;
      label: string;
      summary: string;
      originalInstruction: string;
      rowFrom: number | null;
      rowTo: number | null;
      rowKind: string;
      instruction: string;
      expectedStitches: number | null;
      hints: unknown;
      imageUrl: string | null;
    }>;
  }>;
};

function asHints(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null") return [];
    try {
      return asHints(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }
  return [];
}

function asMeta(value: unknown): PatternMeta {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Partial<PatternMeta>;
      return {
        ...emptyMeta(),
        ...parsed,
        sizes: parsed.sizes ?? [],
        extras: parsed.extras ?? [],
      };
    } catch {
      return emptyMeta();
    }
  }
  return emptyMeta();
}

function asKind(value: string | null | undefined, title: string): SectionKind {
  if (value === "size" || parseSizeHeader(title)) return "size";
  if (value === "montage" || isMontageTitle(title)) return "montage";
  return "work";
}

function asLanguage(value: string): PatternLanguage {
  return value === "en" ? "en" : "de";
}

function asRowKind(value: string): RowKind {
  const kinds: RowKind[] = ["anschlag", "reihe", "runde", "hinweis", "montage"];
  return kinds.includes(value as RowKind) ? (value as RowKind) : "reihe";
}

export function patternToDraft(pattern: EditPatternRow): ParsedPattern {
  return {
    suggestedName: pattern.name,
    language: asLanguage(pattern.language),
    meta: asMeta(pattern.meta),
    coverImage: pattern.coverImage,
    categoryId: pattern.categoryId,
    sections: pattern.sections.map((section) => ({
      id: section.id,
      title: section.title,
      kind: asKind(section.kind, section.title),
      sizeLabel: section.sizeLabel,
      steps: section.steps.map((step) => ({
        id: step.id,
        label: step.label,
        summary: step.summary,
        original: step.originalInstruction || step.instruction,
        rowFrom: step.rowFrom,
        rowTo: step.rowTo,
        rowKind: asRowKind(step.rowKind),
        instruction: step.instruction,
        abbreviations: [],
        expectedStitches: step.expectedStitches,
        rangeNote: null,
        hints: asHints(step.hints),
        imageUrl: step.imageUrl,
      })),
    })),
  };
}
