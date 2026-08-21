"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeParsedPattern } from "@/lib/draft";
import { detectLanguage, parsePattern } from "@/lib/parser";
import type { CommentDTO } from "@/lib/types";

function parsePatternDraft(
  draftJson: string,
  originalText: string,
  name: string,
  manualOnly = false,
) {
  if (!draftJson.trim()) {
    if (manualOnly) throw new Error("Lege mindestens einen Schritt an.");
    return parsePattern(originalText, name);
  }
  try {
    return sanitizeParsedPattern(
      JSON.parse(draftJson),
      name,
      detectLanguage(originalText || "de"),
    );
  } catch (error) {
    if (manualOnly) {
      if (
        error instanceof Error &&
        error.message.includes("keine Schritte")
      ) {
        throw new Error("Lege mindestens einen Schritt mit Anweisung an.");
      }
      throw error;
    }
    if (error instanceof Error && error.message.includes("keine Schritte")) throw error;
    return parsePattern(originalText, name);
  }
}

async function ownedPattern(patternId: string) {
  const user = await requireUser();
  const pattern = await prisma.pattern.findFirst({
    where: { id: patternId, userId: user.id },
  });
  if (!pattern) throw new Error("Anleitung nicht gefunden.");
  return { user, pattern };
}

export async function createPatternAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const manualOnly = formData.get("manualOnly") === "1";
  const originalText = manualOnly
    ? "(manuell angelegt)"
    : String(formData.get("originalText") || "").trim();
  if (!name) throw new Error("Name ist erforderlich.");
  if (!manualOnly && !originalText) {
    throw new Error("Name und Anleitungstext sind erforderlich.");
  }

  const categoryId = String(formData.get("categoryId") || "").trim() || null;
  if (categoryId) {
    const owned = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!owned) throw new Error("Kategorie nicht gefunden.");
  }

  const parsed = parsePatternDraft(
    String(formData.get("draftJson") || ""),
    originalText,
    name,
    manualOnly,
  );

  const coverImage = String(formData.get("coverImage") || "").trim() || parsed.coverImage || null;

  const pattern = await prisma.pattern.create({
    data: {
      userId: user.id,
      categoryId,
      name,
      originalText,
      language: parsed.language,
      meta: JSON.stringify(parsed.meta),
      coverImage,
      sections: {
        create: parsed.sections.map((section, sectionIndex) => ({
          title: section.title,
          kind: section.kind,
          sizeLabel: section.sizeLabel,
          sortOrder: sectionIndex,
          steps: {
            create: section.steps.map((step, stepIndex) => ({
              sortOrder: stepIndex,
              label: step.label,
              rowFrom: step.rowFrom,
              rowTo: step.rowTo,
              rowKind: step.rowKind,
              instruction: step.instruction,
              originalInstruction: step.original,
              summary: step.summary,
              expectedStitches: step.expectedStitches,
              abbreviations: JSON.parse(JSON.stringify(step.abbreviations)),
              hints: JSON.stringify(step.hints ?? []),
              imageUrl: step.imageUrl ?? null,
              stitchCount: 0,
              repeatCurrent: step.rowFrom ?? 0,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/");
  redirect(`/anleitungen/${pattern.id}`);
}

export async function updatePatternAction(formData: FormData) {
  const patternId = String(formData.get("patternId") || "").trim();
  if (!patternId) throw new Error("Anleitung nicht gefunden.");

  const { user, pattern } = await ownedPattern(patternId);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name ist erforderlich.");

  const categoryId = String(formData.get("categoryId") || "").trim() || null;
  if (categoryId) {
    const owned = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });
    if (!owned) throw new Error("Kategorie nicht gefunden.");
  }

  const parsed = parsePatternDraft(
    String(formData.get("draftJson") || ""),
    pattern.originalText,
    name,
    true,
  );

  const coverImage =
    String(formData.get("coverImage") || "").trim() || parsed.coverImage || null;

  const keptSectionIds = new Set<string>();
  const keptStepIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    const existingSections = await tx.section.findMany({
      where: { patternId },
      include: { steps: true },
    });
    const existingSectionIds = new Set(existingSections.map((section) => section.id));
    const existingSteps = existingSections.flatMap((section) => section.steps);
    const existingStepMap = new Map(existingSteps.map((step) => [step.id, step]));

    for (let sectionIndex = 0; sectionIndex < parsed.sections.length; sectionIndex++) {
      const section = parsed.sections[sectionIndex];
      let sectionId = section.id;

      if (sectionId && existingSectionIds.has(sectionId)) {
        await tx.section.update({
          where: { id: sectionId },
          data: {
            title: section.title,
            kind: section.kind,
            sizeLabel: section.sizeLabel,
            sortOrder: sectionIndex,
          },
        });
      } else {
        const created = await tx.section.create({
          data: {
            patternId,
            title: section.title,
            kind: section.kind,
            sizeLabel: section.sizeLabel,
            sortOrder: sectionIndex,
          },
        });
        sectionId = created.id;
      }
      keptSectionIds.add(sectionId);

      for (let stepIndex = 0; stepIndex < section.steps.length; stepIndex++) {
        const step = section.steps[stepIndex];
        const stepData = {
          sortOrder: stepIndex,
          label: step.label,
          rowFrom: step.rowFrom,
          rowTo: step.rowTo,
          rowKind: step.rowKind,
          instruction: step.instruction,
          originalInstruction: step.original,
          summary: step.summary,
          expectedStitches: step.expectedStitches,
          abbreviations: JSON.parse(JSON.stringify(step.abbreviations)),
          hints: JSON.stringify(step.hints ?? []),
          imageUrl: step.imageUrl ?? null,
        };

        if (step.id && existingStepMap.has(step.id)) {
          await tx.step.update({
            where: { id: step.id },
            data: { ...stepData, sectionId },
          });
          keptStepIds.add(step.id);
        } else {
          const created = await tx.step.create({
            data: {
              ...stepData,
              sectionId,
              stitchCount: 0,
              repeatCurrent: step.rowFrom ?? 0,
            },
          });
          keptStepIds.add(created.id);
        }
      }
    }

    for (const section of existingSections) {
      if (!keptSectionIds.has(section.id)) {
        await tx.section.delete({ where: { id: section.id } });
      } else {
        for (const step of section.steps) {
          if (!keptStepIds.has(step.id)) {
            await tx.step.delete({ where: { id: step.id } });
          }
        }
      }
    }

    const lastInvalid =
      (pattern.lastSectionId && !keptSectionIds.has(pattern.lastSectionId)) ||
      (pattern.lastStepId && !keptStepIds.has(pattern.lastStepId));

    await tx.pattern.update({
      where: { id: patternId },
      data: {
        name,
        categoryId,
        coverImage,
        meta: JSON.stringify(parsed.meta),
        language: parsed.language,
        ...(lastInvalid
          ? { lastSectionId: null, lastStepId: null, lastSize: null }
          : {}),
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/anleitungen/${patternId}`);
  redirect(`/anleitungen/${patternId}`);
}

export async function duplicatePatternAction(patternId: string) {
  const { user } = await ownedPattern(patternId);
  const source = await prisma.pattern.findFirst({
    where: { id: patternId, userId: user.id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          steps: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!source) throw new Error("Anleitung nicht gefunden.");

  const copy = await prisma.pattern.create({
    data: {
      userId: user.id,
      categoryId: source.categoryId,
      name: `${source.name} (Kopie)`,
      originalText: source.originalText,
      language: source.language,
      meta: source.meta,
      coverImage: source.coverImage,
      sections: {
        create: source.sections.map((section, sectionIndex) => ({
          title: section.title,
          kind: section.kind,
          sizeLabel: section.sizeLabel,
          sortOrder: sectionIndex,
          steps: {
            create: section.steps.map((step, stepIndex) => ({
              sortOrder: stepIndex,
              label: step.label,
              rowFrom: step.rowFrom,
              rowTo: step.rowTo,
              rowKind: step.rowKind,
              instruction: step.instruction,
              originalInstruction: step.originalInstruction,
              summary: step.summary,
              expectedStitches: step.expectedStitches,
              abbreviations: JSON.parse(JSON.stringify(step.abbreviations)),
              hints: step.hints,
              imageUrl: step.imageUrl,
              stitchCount: 0,
              repeatCurrent: step.rowFrom ?? 0,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/");
  redirect(`/anleitungen/${copy.id}`);
}

export async function deletePatternAction(patternId: string) {
  const { pattern } = await ownedPattern(patternId);
  await prisma.pattern.delete({ where: { id: pattern.id } });
  revalidatePath("/");
}

export async function resetPatternProgress(patternId: string) {
  const { pattern: owned } = await ownedPattern(patternId);
  const pattern = await prisma.pattern.findUnique({
    where: { id: owned.id },
    include: { sections: { include: { steps: true } } },
  });
  if (!pattern) throw new Error("Anleitung nicht gefunden.");

  await prisma.$transaction([
    ...pattern.sections.flatMap((section) =>
      section.steps.map((step) =>
        prisma.step.update({
          where: { id: step.id },
          data: {
            stitchCount: 0,
            repeatCurrent: step.rowFrom ?? 0,
          },
        }),
      ),
    ),
    prisma.pattern.update({
      where: { id: patternId },
      data: {
        lastSectionId: null,
        lastStepId: null,
        lastSize: null,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/anleitungen/${patternId}`);
}

export async function saveLastOpened(
  patternId: string,
  sectionId: string,
  stepId: string,
  size: string | null,
) {
  const { pattern } = await ownedPattern(patternId);
  await prisma.pattern.update({
    where: { id: pattern.id },
    data: {
      lastSectionId: sectionId || null,
      lastStepId: stepId || null,
      lastSize: size,
    },
  });
}

export async function saveStepProgress(
  patternId: string,
  stepId: string,
  stitchCount: number,
  repeatCurrent: number,
) {
  const { pattern } = await ownedPattern(patternId);
  await prisma.step.update({
    where: { id: stepId },
    data: {
      stitchCount: Math.max(0, stitchCount),
      repeatCurrent,
    },
  });
  await prisma.pattern.update({
    where: { id: pattern.id },
    data: { updatedAt: new Date() },
  });
  revalidatePath(`/anleitungen/${patternId}`);
  revalidatePath("/");
}

export async function addStepComment(
  patternId: string,
  stepId: string,
  body: string,
): Promise<CommentDTO> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Kommentar darf nicht leer sein.");
  await ownedPattern(patternId);
  const comment = await prisma.comment.create({
    data: { stepId, body: trimmed },
  });
  revalidatePath(`/anleitungen/${patternId}`);
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export async function updateStepComment(
  patternId: string,
  commentId: string,
  body: string,
): Promise<CommentDTO> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Kommentar darf nicht leer sein.");
  await ownedPattern(patternId);
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { body: trimmed },
  });
  revalidatePath(`/anleitungen/${patternId}`);
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export async function deleteStepComment(patternId: string, commentId: string) {
  await ownedPattern(patternId);
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/anleitungen/${patternId}`);
}
