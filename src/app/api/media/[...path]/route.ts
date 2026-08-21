import { createReadStream, existsSync } from "node:fs";
import { join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import { getCurrentUser } from "@/lib/auth";
import { getUploadRoot } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const { path } = await context.params;
  const relative = path.join("/");
  if (!relative.startsWith(`${user.id}/`)) {
    return new Response("Zugriff verweigert.", { status: 403 });
  }

  const root = getUploadRoot();
  const absolute = normalize(resolve(root, relative));
  if (!absolute.startsWith(normalize(root))) {
    return new Response("Ungültiger Pfad.", { status: 400 });
  }
  if (!existsSync(absolute)) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const ext = absolute.slice(absolute.lastIndexOf(".")).toLowerCase();
  const stream = createReadStream(absolute);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
