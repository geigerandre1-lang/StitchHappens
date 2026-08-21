import type { PatternMeta } from "./meta";

export type PatternLanguage = "de" | "en";

export type RowKind = "anschlag" | "reihe" | "runde" | "hinweis" | "montage";

export type FoundAbbreviation = {
  abbr: string;
  meaning: string;
  count: number | null;
};

export type ParsedStep = {
  id?: string;
  label: string;
  summary: string;
  original: string;
  rowFrom: number | null;
  rowTo: number | null;
  rowKind: RowKind;
  instruction: string;
  abbreviations: FoundAbbreviation[];
  expectedStitches: number | null;
  rangeNote: string | null;
  hints: string[];
  imageUrl?: string | null;
};

export type SectionKind = "work" | "montage" | "size";

export type ParsedSection = {
  id?: string;
  title: string;
  kind: SectionKind;
  sizeLabel: string | null;
  steps: ParsedStep[];
};

export type ParsedPattern = {
  suggestedName: string | null;
  language: PatternLanguage;
  meta: PatternMeta;
  sections: ParsedSection[];
  coverImage?: string | null;
  categoryId?: string | null;
};

export type StitchDef = {
  keys: string[];
  canon: string;
  de: string;
  dePl: string;
  en: string;
  enPl: string;
};
