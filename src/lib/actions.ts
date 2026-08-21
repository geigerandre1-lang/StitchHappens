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
    if (manualOnly) throw error;
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
