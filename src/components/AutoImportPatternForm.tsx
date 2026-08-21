"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { createPatternAction } from "@/lib/actions";
import { extractPdfText } from "@/lib/pdf";
import { PatternDraftEditor } from "@/components/PatternDraftEditor";
import { GeneralInfo } from "@/components/GeneralInfo";
import { HintMarker } from "@/components/HintMarker";
import {
  AMIGURUMI_DE,
  COLORWORK_RD,
  KIND_META,
  PUMPKIN_DE,
  PUMPKIN_EN,
  SIZED_HAT,
  parsePattern,
} from "@/lib/parser";
import type { ParsedPattern, ParsedStep, RowKind } from "@/lib/parser/types";

export function AutoImportPatternForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ParsedPattern | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [sourceSnapshot, setSourceSnapshot] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    return parsePattern(text, name || undefined);
  }, [text, name]);

  useEffect(() => {
    if (!dirty) setDraft(parsed);
  }, [parsed, dirty]);

  const stale = dirty && text !== sourceSnapshot;
  const shown = draft ?? parsed;

  function markDirty(next: ParsedPattern) {
    if (!dirty) setSourceSnapshot(text);
    setDirty(true);
    setDraft(next);
  }

  async function onPdf(file: File | undefined) {
    if (!file) return;
    setPdfBusy(true);
    setPdfError(null);
    const fd = new FormData();
    fd.set("pdf", file);
    const result = await extractPdfText(fd);
    setPdfBusy(false);
    if ("error" in result) {
      setPdfError(result.error);
      return;
    }
    setText(result.text);
    if (!name.trim() && result.suggestedName) setName(result.suggestedName);
    setDirty(false);
    setMode("preview");
    setSectionIndex(0);
  }

  function applyExample(nextName: string, nextText: string) {
    setName(nextName);
    setText(nextText);
    setDirty(false);
    setMode("preview");
    setSectionIndex(0);
  }

  async function submit(formData: FormData) {
    const path = await createPatternAction(formData);
    router.push(path);
  }

  return (
    <form action={submit} className="space-y-6 pb-24 sm:pb-0">
      <textarea name="draftJson" hidden readOnly value={shown ? JSON.stringify(shown) : ""} />
      <div className={`grid gap-8 ${mode === "edit" ? "" : "lg:grid-cols-2"}`}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">Name</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Kleiner Kürbis"
              className="mt-1 min-h-12 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">
              Anleitung hineinkopieren (Deutsch oder Englisch)
            </span>
            <textarea
              name="originalText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={14}
              placeholder="Runde 1: 6 fM in den Fadenring (6)&#10;Runde 2: 6 Zunahmen (12)"
              className="mt-1 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 font-mono text-sm outline-none focus:border-[#c45c26]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">Oder PDF importieren</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={pdfBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                void onPdf(file);
                e.target.value = "";
              }}
              className="mt-1 block w-full min-h-12 rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#f3e6d4] file:px-3 file:py-1.5 file:text-sm"
            />
            {pdfBusy ? <p className="mt-1 text-sm text-[#7a6e62]">PDF wird gelesen…</p> : null}
            {pdfError ? <p className="mt-1 text-sm text-[#8a3d16]">{pdfError}</p> : null}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyExample("Kleiner Kürbis", PUMPKIN_DE)}
              className="min-h-11 rounded-full bg-[#f3e6d4] px-3 text-sm text-[#2c241c]"
            >
              Beispiel Kürbis
            </button>
            <button
              type="button"
              onClick={() => applyExample("Kleine Kugel", AMIGURUMI_DE)}
              className="min-h-11 rounded-full bg-[#f3e6d4] px-3 text-sm text-[#2c241c]"
            >
              Beispiel Amigurumi
            </button>
            <button
              type="button"
              onClick={() => applyExample("Farbmuster Rd", COLORWORK_RD)}
              className="min-h-11 rounded-full bg-[#f3e6d4] px-3 text-sm text-[#2c241c]"
            >
              Beispiel Rd / Farbe
            </button>
            <button
              type="button"
              onClick={() => applyExample("Mütze", SIZED_HAT)}
              className="min-h-11 rounded-full bg-[#f3e6d4] px-3 text-sm text-[#2c241c]"
            >
              Beispiel Größen
            </button>
            <button
              type="button"
              onClick={() => applyExample("Little Pumpkin", PUMPKIN_EN)}
              className="min-h-11 rounded-full bg-[#f3e6d4] px-3 text-sm text-[#2c241c]"
            >
              Beispiel EN
            </button>
            <div className="hidden sm:block">
              <SaveButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-display text-xl">
              {mode === "edit" ? "Korrigieren" : "So wird gehäkelt"}
            </h2>
            {shown ? (
              <div className="flex gap-1 rounded-full bg-[#f3e6d4] p-1">
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className={`min-h-10 rounded-full px-3 text-sm ${
                    mode === "preview" ? "bg-white text-[#2c241c] shadow-sm" : "text-[#7a6e62]"
                  }`}
                >
                  Vorschau
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`min-h-10 rounded-full px-3 text-sm ${
                    mode === "edit" ? "bg-white text-[#2c241c] shadow-sm" : "text-[#7a6e62]"
                  }`}
                >
                  Korrigieren
                </button>
              </div>
            ) : null}
          </div>

          {stale ? (
            <div className="mt-3 rounded-xl bg-[#f8e6dc] px-3 py-2 text-sm text-[#8a3d16]">
              Der Quelltext hat sich geändert. Korrekturen gelten weiter, bis du neu einliest.
              <button
                type="button"
                onClick={() => {
                  setDirty(false);
                  setDraft(parsed);
                  setMode("preview");
                }}
                className="ml-2 underline"
              >
                Neu einlesen
              </button>
            </div>
          ) : null}

          {!shown ? (
            <p className="mt-3 text-sm text-[#7a6e62]">
              Reihen und Runden werden getrennt, Hinweise hängen am jeweiligen Schritt.
              Danach kannst du im Reiter Korrigieren nachbessern, falls etwas falsch erkannt wurde.
            </p>
          ) : mode === "edit" ? (
            <PatternDraftEditor
              draft={shown}
              onChange={markDirty}
              sectionIndex={sectionIndex}
              onSectionIndex={setSectionIndex}
            />
          ) : (
            <Preview parsed={shown} sectionIndex={sectionIndex} onSectionIndex={setSectionIndex} />
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadfce] bg-[#fffbf5]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
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
      {pending ? "Speichert…" : "Speichern"}
    </button>
  );
}

function Preview({
  parsed,
  sectionIndex,
  onSectionIndex,
}: {
  parsed: ParsedPattern;
  sectionIndex: number;
  onSectionIndex: (index: number) => void;
}) {
  const section = parsed.sections[sectionIndex] ?? parsed.sections[0];
  if (!section) return null;

  const abbrs = uniqueAbbrs(parsed.sections.flatMap((s) => s.steps));

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-[#7a6e62]">
        {parsed.language === "en" ? "Englisch erkannt" : "Deutsch erkannt"} ·{" "}
        {parsed.sections.length} Teile
        {parsed.sections.some((s) => s.kind === "size") ? " · mit Größen" : ""}
        {parsed.sections.some((s) => s.kind === "montage") ? " · mit Montage" : ""}
      </p>
      <GeneralInfo meta={parsed.meta} />
      <div className="flex items-start gap-2 sm:gap-3">
        <nav
          aria-label="Teile"
          className="sticky top-16 w-[8.5rem] shrink-0 overflow-y-auto sm:w-48"
        >
          <div className="flex flex-col gap-1 sm:gap-1.5">
            {parsed.sections.map((item, index) => (
              <button
                key={`${item.title}-${index}`}
                type="button"
                onClick={() => onSectionIndex(index)}
                title={item.title}
                className={`min-h-11 w-full truncate rounded-lg px-2.5 text-left text-xs font-medium sm:rounded-xl sm:px-3 sm:text-sm ${
                  index === sectionIndex
                    ? item.kind === "montage"
                      ? "bg-[#3a4d66] text-white"
                      : item.kind === "size"
                        ? "bg-[#5c7a5a] text-white"
                        : "bg-[#2c241c] text-white"
                    : item.kind === "montage"
                      ? "bg-[#e7eef5] text-[#3a4d66]"
                      : item.kind === "size"
                        ? "bg-[#e8f0e6] text-[#3d5a3c]"
                        : "bg-[#f3e6d4] text-[#2c241c]"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </nav>
        <div className="min-w-0 flex-1 space-y-2">
          <ol className="space-y-2">
            {section.steps.map((step, index) => (
              <StepCard key={`${step.label}-${index}`} step={step} />
            ))}
          </ol>
          {abbrs.length > 0 ? (
            <div className="rounded-xl bg-white p-3 ring-1 ring-[#eadfce]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
                In dieser Anleitung
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {abbrs.map((item) => (
                  <span
                    key={item.abbr}
                    className="rounded-full bg-[#f3e6d4] px-2 py-0.5 text-xs text-[#2c241c]"
                  >
                    {item.abbr} = {item.meaning}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepCard({ step }: { step: ParsedStep }) {
  const kind = KIND_META[step.rowKind];
  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-[#eadfce]">
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={step.rowKind} />
        <p className="text-sm font-medium text-[#2c241c]">{step.label}</p>
        <HintMarker hints={step.hints ?? []} />
        {step.rangeNote ? (
          <span className="rounded-full bg-[#e8f0e6] px-2 py-0.5 text-xs text-[#3d5a3c]">
            {step.rangeNote}
          </span>
        ) : null}
        {step.expectedStitches != null ? (
          <span className="rounded-full bg-[#f8e6dc] px-2 py-0.5 text-xs text-[#8a3d16]">
            {step.expectedStitches} Maschen
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#2c241c]">{step.instruction}</p>
      {step.original && step.original !== step.instruction ? (
        <p className="mt-1 text-xs text-[#7a6e62]">Original: {step.original}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-[#a3988c]">{kind.hint}</p>
    </li>
  );
}

function KindBadge({ kind }: { kind: RowKind }) {
  const meta = KIND_META[kind];
  const colors: Record<RowKind, string> = {
    anschlag: "bg-[#f3e6d4] text-[#6a4a2a]",
    reihe: "bg-[#f8e6dc] text-[#8a3d16]",
    runde: "bg-[#e8f0e6] text-[#3d5a3c]",
    hinweis: "bg-[#eeeae4] text-[#5c5349]",
    montage: "bg-[#e7eef5] text-[#3a4d66]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${colors[kind]}`}>
      {meta.de}
    </span>
  );
}

function uniqueAbbrs(steps: ParsedStep[]) {
  const seen = new Set<string>();
  const result: { abbr: string; meaning: string }[] = [];
  for (const step of steps) {
    for (const item of step.abbreviations) {
      if (seen.has(item.abbr)) continue;
      seen.add(item.abbr);
      result.push({ abbr: item.abbr, meaning: item.meaning });
    }
  }
  return result;
}
