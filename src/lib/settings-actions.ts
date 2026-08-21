"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mediaUrl, saveUserImage } from "@/lib/uploads";

export async function uploadImageAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Keine Bilddatei ausgewählt." } as const;
  }

  try {
    const path = await saveUserImage(user.id, file);
    return { path, url: mediaUrl(path) } as const;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Upload fehlgeschlagen.",
    } as const;
  }
}

export async function listCategoriesAction() {
  const user = await requireUser();
  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, sortOrder: true },
  });
}

export async function createCategoryAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name fehlt." } as const;

  const count = await prisma.category.count({ where: { userId: user.id } });
  try {
    const category = await prisma.category.create({
      data: { userId: user.id, name, sortOrder: count },
    });
    revalidatePath("/einstellungen");
    revalidatePath("/");
    revalidatePath("/anleitungen/neu");
    return { id: category.id, name: category.name, color: category.color } as const;
  } catch {
    return { error: "Kategorie existiert bereits." } as const;
  }
}

export async function deleteCategoryAction(categoryId: string) {
  const user = await requireUser();
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: user.id },
  });
  if (!category) return { error: "Kategorie nicht gefunden." } as const;

  await prisma.$transaction([
    prisma.pattern.updateMany({
      where: { categoryId: category.id },
      data: { categoryId: null },
    }),
    prisma.category.delete({ where: { id: category.id } }),
  ]);

  revalidatePath("/einstellungen");
  revalidatePath("/");
  revalidatePath("/anleitungen/neu");
  return { ok: true } as const;
}

export async function renameCategoryAction(categoryId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name fehlt." } as const;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: user.id },
  });
  if (!category) return { error: "Kategorie nicht gefunden." } as const;

  try {
    await prisma.category.update({
      where: { id: category.id },
      data: { name: trimmed },
    });
    revalidatePath("/einstellungen");
    revalidatePath("/");
    return { ok: true } as const;
  } catch {
    return { error: "Name bereits vergeben." } as const;
  }
}
