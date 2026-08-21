import type { FoundAbbreviation } from "@/lib/parser";
import type { PatternMeta } from "@/lib/parser/meta";

export type CategoryDTO = {
  id: string;
  name: string;
  color: string;
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type StepDTO = {
  id: string;
  sortOrder: number;
  label: string;
  summary: string;
  originalInstruction: string;
  rowFrom: number | null;
  rowTo: number | null;
  rowKind: string;
  instruction: string;
  abbreviations: FoundAbbreviation[];
  expectedStitches: number | null;
  stitchCount: number;
  repeatCurrent: number;
  hints: string[];
  imageUrl: string | null;
  comments: CommentDTO[];
};

export type SectionDTO = {
  id: string;
  title: string;
  kind: "work" | "montage" | "size";
  sizeLabel: string | null;
  sortOrder: number;
  steps: StepDTO[];
};

export type PatternDTO = {
  id: string;
  name: string;
  originalText: string;
  language: string;
  meta: PatternMeta;
  coverImage: string | null;
  category: CategoryDTO | null;
  lastSectionId: string | null;
  lastStepId: string | null;
  lastSize: string | null;
  createdAt: string;
  updatedAt: string;
  sections: SectionDTO[];
};

export type PatternSummary = {
  id: string;
  name: string;
  language: string;
  coverImage: string | null;
  category: CategoryDTO | null;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
  stepCount: number;
  hasProgress: boolean;
};
