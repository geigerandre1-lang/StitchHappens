import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { FoundAbbreviation } from "@/lib/parser";
import { attachHintsToSteps } from "@/lib/parser/hints";
import { emptyMeta, isMontageTitle, parseSizeHeader, type PatternMeta } from "@/lib/parser/meta";
import type { CategoryDTO, PatternDTO, PatternSummary, SectionDTO, StepDTO } from "@/lib/types";
import { mediaUrl } from "@/lib/uploads";

function mapCategory(
  category: { id: string; name: string; color: string } | null,
): CategoryDTO | null {
  if (!category) return null;
  return { id: category.id, name: category.name, color: category.color };
}

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

export async function listCategories(): Promise<CategoryDTO[]> {
  const user = await requireUser();
  const rows = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true },
  });
  return rows;
}

export async function listPatterns(categoryId?: string | null): Promise<PatternSummary[]> {
  const user = await requireUser();
  const patterns = await prisma.pattern.findMany({
    where: {
      userId: user.id,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { id: true, name: true, color: true } },
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
      coverImage: pattern.coverImage ? mediaUrl(pattern.coverImage) : null,
      category: mapCategory(pattern.category),
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
      category: { select: { id: true, name: true, color: true } },
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
        imageUrl: step.imageUrl ? mediaUrl(step.imageUrl) : null,
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
    coverImage: pattern.coverImage ? mediaUrl(pattern.coverImage) : null,
    category: mapCategory(pattern.category),
    lastSectionId: pattern.lastSectionId,
    lastStepId,
    lastSize: pattern.lastSize,
    createdAt: pattern.createdAt.toISOString(),
    updatedAt: pattern.updatedAt.toISOString(),
    sections,
  };
}
