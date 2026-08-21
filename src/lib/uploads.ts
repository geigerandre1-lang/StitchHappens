import { mkdirSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function getUploadRoot(): string {
  const explicit = process.env.UPLOAD_DIR?.trim();
  if (explicit) return resolve(explicit);

  const cwd = process.cwd();
  if (cwd.includes("hbuilds/versions") || cwd.includes("hbuilds\\versions")) {
    return resolve(cwd, "../../../..", "uploads");
  }
  return resolve(cwd, "uploads");
}

export function mediaUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/api/media/${normalized}`;
}

export async function saveUserImage(userId: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Bild ist zu groß (max. 5 MB).");
  }

  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new Error("Nur JPG, PNG, WebP oder GIF erlaubt.");
  }

  const dir = join(getUploadRoot(), userId);
  mkdirSync(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const relative = `${userId}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(dir, filename), buffer);
  return relative;
}
