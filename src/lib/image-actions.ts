"use server";

import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media-url";

export async function uploadImageAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Keine Bilddatei ausgewählt." } as const;
  }

  try {
    const { saveUserImage } = await import("@/lib/uploads");
    const path = await saveUserImage(user.id, file);
    return { path, url: mediaUrl(path) } as const;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Upload fehlgeschlagen.",
    } as const;
  }
}
