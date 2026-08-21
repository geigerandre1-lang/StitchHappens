export function mediaUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/api/media/${normalized}`;
}
