"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { createPatternAction } from "@/lib/actions";
import { blankPattern } from "@/lib/draft";
import { PatternDraftEditor } from "@/components/PatternDraftEditor";
import { ImageUpload } from "@/components/ImageUpload";
import type { CategoryDTO } from "@/lib/types";
import type { ParsedPattern } from "@/lib/parser/types";

export function ManualPatternForm({ categories }: { categories: CategoryDTO[] }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<ParsedPattern>(() => blankPattern());
  const [sectionIndex, setSectionIndex] = useState(0);

  const draftForSave = useMemo(
    () => ({
      ...draft,
      coverImage: coverPath,
      categoryId: categoryId || null,
    }),
    [draft, coverPath, categoryId],
  );

  return (
    <form action={createPatternAction} className="space-y-6 pb-24 sm:pb-0">
      <input type="hidden" name="manualOnly" value="1" />
      <input type="hidden" name="originalText" value="" />
      <input type="hidden" name="draftJson" value={JSON.stringify(draftForSave)} />
      <input type="hidden" name="coverImage" value={coverPath ?? ""} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">Name</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Erdbeere Amigurumi"
              className="mt-1 min-h-12 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">Kategorie</span>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 min-h-12 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
            >
              <option value="">— keine —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 ? (
              <p className="mt-1 text-xs text-[#7a6e62]">
                <Link href="/einstellungen" className="underline">
                  Kategorien anlegen
                </Link>
              </p>
            ) : null}
          </label>

          <ImageUpload
            label="Gesamtbild (Vorschaubild)"
            value={coverPreview}
            storedPath={coverPath}
            onChange={(path, preview) => {
              setCoverPath(path);
              setCoverPreview(preview);
            }}
          />

          <div className="hidden lg:block">
            <SaveButton />
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-4">
          <h2 className="font-display text-xl">Schritte manuell anlegen</h2>
          <p className="mt-2 text-sm text-[#7a6e62]">
            Teile und Schritte einzeln hinzufügen. Pro Schritt optional ein Bild.
          </p>
          <PatternDraftEditor
            draft={draft}
            onChange={setDraft}
            sectionIndex={sectionIndex}
            onSectionIndex={setSectionIndex}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadfce] bg-[#fffbf5]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <SaveButton full />
      </div>
    </form>
  );
}

function SaveButton({ full = false }: { full?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-12 rounded-full bg-[#c45c26] px-4 text-sm font-medium text-white hover:bg-[#a64c1e] disabled:opacity-70 ${
        full ? "w-full" : ""
      }`}
    >
      {pending ? "Speichert…" : "Anleitung speichern"}
    </button>
  );
}
