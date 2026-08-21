"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { createPatternAction, updatePatternAction } from "@/lib/actions";
import { blankPattern, fillEmptyInstructions } from "@/lib/draft";
import { PatternDraftEditor } from "@/components/PatternDraftEditor";
import { ImageUpload } from "@/components/ImageUpload";
import type { CategoryDTO } from "@/lib/types";
import type { ParsedPattern } from "@/lib/parser/types";

type PatternEditorFormProps = {
  categories: CategoryDTO[];
  patternId?: string;
  initial?: {
    name: string;
    categoryId: string;
    coverImage: string | null;
    draft: ParsedPattern;
  };
};

export function PatternEditorForm({ categories, patternId, initial }: PatternEditorFormProps) {
  const isEdit = Boolean(patternId);
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [coverPath, setCoverPath] = useState<string | null>(initial?.coverImage ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<ParsedPattern>(() => initial?.draft ?? blankPattern());
  const [sectionIndex, setSectionIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draftForSave = useMemo(
    () => ({
      ...draft,
      coverImage: coverPath,
      categoryId: categoryId || null,
    }),
    [draft, coverPath, categoryId],
  );
  const draftForSaveRef = useRef(draftForSave);
  draftForSaveRef.current = draftForSave;

  const action = isEdit ? updatePatternAction : createPatternAction;

  function hasValidSteps(pattern: ParsedPattern) {
    return pattern.sections.some((section) => section.steps.length > 0);
  }

  function syncDraftJson(form: HTMLFormElement) {
    const field = form.elements.namedItem("draftJson") as HTMLTextAreaElement | null;
    if (field) {
      field.value = JSON.stringify(fillEmptyInstructions(draftForSaveRef.current));
    }
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!hasValidSteps(draftForSaveRef.current)) {
          event.preventDefault();
          setSubmitError("Lege mindestens einen Schritt an.");
          return;
        }
        setSubmitError(null);
        syncDraftJson(event.currentTarget);
      }}
      className="space-y-6 pb-24 sm:pb-0"
    >
      {isEdit ? <input type="hidden" name="patternId" value={patternId} /> : null}
      <input type="hidden" name="manualOnly" value="1" />
      <input type="hidden" name="originalText" value="" />
      <textarea name="draftJson" hidden readOnly defaultValue="" aria-hidden tabIndex={-1} />
      <input type="hidden" name="coverImage" value={coverPath ?? ""} />

      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {submitError}
        </p>
      ) : null}

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
            <SaveButton isEdit={isEdit} />
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-4">
          <h2 className="font-display text-xl">
            {isEdit ? "Schritte bearbeiten" : "Schritte manuell anlegen"}
          </h2>
          <p className="mt-2 text-sm text-[#7a6e62]">
            Teile und Schritte bearbeiten. Pro Schritt optional ein Bild.
          </p>
          <PatternDraftEditor
            draft={draft}
            onChange={(next) => {
              setSubmitError(null);
              setDraft(next);
            }}
            sectionIndex={sectionIndex}
            onSectionIndex={setSectionIndex}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadfce] bg-[#fffbf5]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <SaveButton isEdit={isEdit} full />
      </div>
    </form>
  );
}

function SaveButton({ isEdit, full = false }: { isEdit: boolean; full?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`min-h-12 rounded-full bg-[#c45c26] px-4 text-sm font-medium text-white hover:bg-[#a64c1e] disabled:opacity-70 ${
        full ? "w-full" : ""
      }`}
    >
      {pending ? "Speichert…" : isEdit ? "Änderungen speichern" : "Anleitung speichern"}
    </button>
  );
}
