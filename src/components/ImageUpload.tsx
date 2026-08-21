"use client";

import { useState, useTransition } from "react";
import { uploadImageAction } from "@/lib/image-actions";
import { mediaUrl } from "@/lib/media-url";

export function ImageUpload({
  label,
  value,
  storedPath,
  onChange,
}: {
  label: string;
  value: string | null;
  storedPath?: string | null;
  onChange: (path: string | null, previewUrl: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const preview = value ?? (storedPath ? mediaUrl(storedPath) : null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("image", file);
    startTransition(async () => {
      const result = await uploadImageAction(fd);
      setBusy(false);
      if ("error" in result) {
        setError(result.error ?? "Upload fehlgeschlagen.");
        return;
      }
      onChange(result.path, result.url);
    });
  }

  return (
    <div className="block">
      <span className="text-sm font-medium text-[#2c241c]">{label}</span>
      {preview ? (
        <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-[#eadfce]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-48 w-full object-contain bg-white" />
          <div className="flex gap-2 border-t border-[#eadfce] bg-[#fffbf5] p-2">
            <label className="min-h-10 cursor-pointer rounded-full bg-[#f3e6d4] px-3 py-2 text-sm">
              Ersetzen
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="min-h-10 rounded-full px-3 text-sm text-[#8a3d16] ring-1 ring-[#eadfce]"
            >
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        <label className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#eadfce] bg-white px-3 py-4 text-sm text-[#7a6e62] hover:border-[#c45c26]">
          {busy ? "Wird hochgeladen…" : "Bild wählen (max. 5 MB)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error ? <p className="mt-1 text-sm text-[#8a3d16]">{error}</p> : null}
    </div>
  );
}
