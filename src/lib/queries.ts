import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FoundAbbreviation } from "@/lib/parser";
import { attachHintsToSteps } from "@/lib/parser/hints";
import { emptyMeta, isMontageTitle, parseSizeHeader, type PatternMeta } from "@/lib/parser/meta";
import type { PatternDTO, PatternSummary, SectionDTO, StepDTO } from "@/lib/types";

function asAbbrs(value: unknown): FoundAbbreviation[] {
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    try {
      return asAbbrs(JSON.parse(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value as FoundAbbreviation[];
}

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

function asKind(value: string | null | undefined, title: string): SectionDTO["kind"] {
  if (value === "size" || parseSizeHeader(title)) return "size";
  if (value === "montage" || isMontageTitle(title)) return "montage";
  if (value === "work") return "work";
  return "work";
}

export async function listPatterns(): Promise<PatternSummary[]> {
  const user = await requireUser();
  const patterns = await prisma.pattern.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      sections: {
        include: { steps: true },
      },
    },
  });

  return patterns.map((pattern) => {
    const steps = pattern.sections.flatMap((s) => s.steps);
    const hasProgress = steps.some(
      (step) =>
        step.stitchCount > 0 ||
        (step.rowFrom != null && step.repeatCurrent > (step.rowFrom ?? 0)),
    );
    return {
      id: pattern.id,
      name: pattern.name,
      language: pattern.language,
      createdAt: pattern.createdAt.toISOString(),
      updatedAt: pattern.updatedAt.toISOString(),
      sectionCount: pattern.sections.length,
      stepCount: steps.length,
      hasProgress: hasProgress || Boolean(pattern.lastStepId),
    };
  });
}

export async function getPattern(id: string): Promise<PatternDTO | null> {
  const user = await requireUser();
  const pattern = await prisma.pattern.findFirst({
    where: { id, userId: user.id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          steps: {
            orderBy: { sortOrder: "asc" },
            include: {
              comments: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!pattern) return null;

  const hintRedirects: Record<string, string> = {};
  const sections = pattern.sections.map((section) => {
    const mapped = section.steps.map(
      (step): StepDTO => ({
        id: step.id,
        sortOrder: step.sortOrder,
        label: step.label,
        summary: step.summary,
        originalInstruction: step.originalInstruction,
        rowFrom: step.rowFrom,
        rowTo: step.rowTo,
        rowKind: step.rowKind,
        instruction: step.instruction,
        abbreviations: asAbbrs(step.abbreviations),
        expectedStitches: step.expectedStitches,
        stitchCount: step.stitchCount,
        repeatCurrent: step.repeatCurrent,
        hints: asHints(step.hints),
        comments: step.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        })),
      }),
    );
    const attached = attachHintsToSteps(mapped);
    Object.assign(hintRedirects, attached.hintRedirects);
    return {
      id: section.id,
      title: section.title,
      kind: asKind(section.kind, section.title),
      sizeLabel: section.sizeLabel,
      sortOrder: section.sortOrder,
      steps: attached.steps,
    };
  });

  const lastStepId = pattern.lastStepId
    ? (hintRedirects[pattern.lastStepId] ?? pattern.lastStepId)
    : null;

  return {
    id: pattern.id,
    name: pattern.name,
    originalText: pattern.originalText,
    language: pattern.language,
    meta: asMeta(pattern.meta),
    lastSectionId: pattern.lastSectionId,
    lastStepId,
    lastSize: pattern.lastSize,
    createdAt: pattern.createdAt.toISOString(),
    updatedAt: pattern.updatedAt.toISOString(),
    sections,
  };
}
