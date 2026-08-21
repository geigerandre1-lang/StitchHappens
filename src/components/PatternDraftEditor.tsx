"use client";

import type { ReactNode } from "react";
import { KIND_META } from "@/lib/parser";
import { META_LABELS, type PatternMeta } from "@/lib/parser/meta";
import type { ParsedPattern, ParsedSection, ParsedStep, RowKind, SectionKind } from "@/lib/parser/types";
import { blankSection, blankStep, moveItem, patchStep } from "@/lib/draft";
import { HintMarker } from "@/components/HintMarker";
import { ImageUpload } from "@/components/ImageUpload";

const ROW_KIND_OPTIONS: RowKind[] = ["reihe", "runde", "anschlag", "hinweis", "montage"];
const SECTION_KIND_OPTIONS: Array<{ value: SectionKind; label: string }> = [
  { value: "work", label: "Teil" },
  { value: "size", label: "Größe" },
  { value: "montage", label: "Montage" },
];

const META_FIELDS = Object.keys(META_LABELS) as Array<keyof typeof META_LABELS>;

const fieldClass =
  "mt-1 w-full min-h-12 rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]";

export function PatternDraftEditor({
  draft,
  onChange,
  sectionIndex,
  onSectionIndex,
}: {
  draft: ParsedPattern;
  onChange: (next: ParsedPattern) => void;
  sectionIndex: number;
  onSectionIndex: (index: number) => void;
}) {
  const lang = draft.language;
  const section = draft.sections[sectionIndex] ?? draft.sections[0];

  function setMeta(meta: PatternMeta) {
    onChange({ ...draft, meta });
  }

  function setSections(sections: ParsedSection[]) {
    onChange({ ...draft, sections });
  }

  function updateSection(index: number, patch: Partial<ParsedSection>) {
    setSections(
      draft.sections.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.kind === "size" && !next.sizeLabel) next.sizeLabel = draft.meta.sizes[0] ?? "S";
        if (next.kind === "size" && (patch.sizeLabel || patch.kind) && next.sizeLabel) {
          next.title = `Größe ${next.sizeLabel}`;
        }
        return next;
      }),
    );
  }

  function updateStep(stepIndex: number, patch: Partial<ParsedStep>) {
    if (!section) return;
    setSections(
      draft.sections.map((item, i) =>
        i === sectionIndex
          ? {
              ...item,
              steps: item.steps.map((step, j) =>
                j === stepIndex ? patchStep(step, patch, lang) : step,
              ),
            }
          : item,
      ),
    );
  }

  function removeStep(stepIndex: number) {
    if (!section || section.steps.length <= 1) {
      if (draft.sections.length <= 1) return;
      const next = draft.sections.filter((_, i) => i !== sectionIndex);
      setSections(next);
      onSectionIndex(Math.max(0, sectionIndex - 1));
      return;
    }
    setSections(
      draft.sections.map((item, i) =>
        i === sectionIndex
          ? { ...item, steps: item.steps.filter((_, j) => j !== stepIndex) }
          : item,
      ),
    );
  }

  function addStep(after: number) {
    const prev = section?.steps[after];
    const rowFrom = prev?.rowTo != null ? prev.rowTo + 1 : prev?.rowFrom ?? null;
    const nextStep = blankStep({
      rowKind: "reihe",
      rowFrom,
      rowTo: rowFrom,
    });
    setSections(
      draft.sections.map((item, i) =>
        i === sectionIndex
          ? {
              ...item,
              steps: [...item.steps.slice(0, after + 1), nextStep, ...item.steps.slice(after + 1)],
            }
          : item,
      ),
    );
  }

  function mergeStep(stepIndex: number) {
    if (!section) return;
    const a = section.steps[stepIndex];
    const b = section.steps[stepIndex + 1];
    if (!a || !b) return;
    const merged = patchStep(
      a,
      {
        instruction: [a.instruction, b.instruction].filter(Boolean).join(" "),
        original: [a.original, b.original].filter(Boolean).join(" "),
        rowFrom: a.rowFrom ?? b.rowFrom,
        rowTo: b.rowTo ?? a.rowTo,
        expectedStitches: b.expectedStitches ?? a.expectedStitches,
        hints: [...(a.hints ?? []), ...(b.hints ?? [])],
      },
      lang,
    );
    setSections(
      draft.sections.map((item, i) =>
        i === sectionIndex
          ? {
              ...item,
              steps: [...item.steps.slice(0, stepIndex), merged, ...item.steps.slice(stepIndex + 2)],
            }
          : item,
      ),
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-[#7a6e62]">
        Hier kannst du korrigieren, was der Parser falsch gelesen hat. Der
        Originaltext bleibt gespeichert.
      </p>

      <MetaEditor meta={draft.meta} onChange={setMeta} />

      <div className="flex items-start gap-2 sm:gap-3">
        <nav aria-label="Teile" className="sticky top-16 w-[8.5rem] shrink-0 sm:w-48">
          <div className="flex max-h-[calc(100dvh-8rem)] flex-col gap-1 overflow-y-auto sm:gap-1.5">
            {draft.sections.map((item, index) => (
              <button
                key={`sec-${index}`}
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
            <button
              type="button"
              onClick={() => {
                setSections([...draft.sections, blankSection()]);
                onSectionIndex(draft.sections.length);
              }}
              className="min-h-11 w-full rounded-lg px-2.5 text-xs ring-1 ring-[#eadfce] sm:rounded-xl sm:px-3 sm:text-sm"
            >
              + Teil
            </button>
          </div>
        </nav>

        <div className="min-w-0 flex-1 space-y-3">
          {section ? (
            <div className="space-y-3 rounded-2xl bg-white p-3 ring-1 ring-[#eadfce] sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
                    Titel
                  </span>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
                    Art
                  </span>
                  <select
                    value={section.kind}
                    onChange={(e) =>
                      updateSection(sectionIndex, { kind: e.target.value as SectionKind })
                    }
                    className={fieldClass}
                  >
                    {SECTION_KIND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                {section.kind === "size" ? (
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
                      Größe
                    </span>
                    <input
                      value={section.sizeLabel ?? ""}
                      onChange={(e) =>
                        updateSection(sectionIndex, { sizeLabel: e.target.value || null })
                      }
                      placeholder="S, M, 3–6 Monate"
                      className={fieldClass}
                    />
                  </label>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSections(moveItem(draft.sections, sectionIndex, -1));
                    onSectionIndex(Math.max(0, sectionIndex - 1));
                  }}
                  disabled={sectionIndex === 0}
                  className="min-h-11 rounded-full px-3 text-sm ring-1 ring-[#eadfce] disabled:opacity-40"
                >
                  Teil nach oben
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSections(moveItem(draft.sections, sectionIndex, 1));
                    onSectionIndex(Math.min(draft.sections.length - 1, sectionIndex + 1));
                  }}
                  disabled={sectionIndex === draft.sections.length - 1}
                  className="min-h-11 rounded-full px-3 text-sm ring-1 ring-[#eadfce] disabled:opacity-40"
                >
                  Teil nach unten
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (draft.sections.length <= 1) return;
                    if (!confirm(`„${section.title}“ inklusive aller Schritte löschen?`)) return;
                    const next = draft.sections.filter((_, i) => i !== sectionIndex);
                    setSections(next);
                    onSectionIndex(Math.max(0, sectionIndex - 1));
                  }}
                  disabled={draft.sections.length <= 1}
                  className="min-h-11 rounded-full px-3 text-sm text-[#8a3d16] ring-1 ring-[#eadfce] disabled:opacity-40"
                >
                  Teil löschen
                </button>
              </div>
            </div>
          ) : null}

          <ol className="space-y-3">
            {section?.steps.map((step, index) => (
              <li key={`step-${sectionIndex}-${index}`}>
                <StepEditor
                  step={step}
                  index={index}
                  total={section.steps.length}
                  onChange={(patch) => updateStep(index, patch)}
                  onMove={(dir) =>
                    setSections(
                      draft.sections.map((item, i) =>
                        i === sectionIndex
                          ? { ...item, steps: moveItem(item.steps, index, dir) }
                          : item,
                      ),
                    )
                  }
                  onMerge={() => mergeStep(index)}
                  onAddAfter={() => addStep(index)}
                  onRemove={() => removeStep(index)}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function MetaEditor({
  meta,
  onChange,
}: {
  meta: PatternMeta;
  onChange: (meta: PatternMeta) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfce] sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">Allgemein</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {META_FIELDS.map((key) => (
          <label key={key} className="block">
            <span className="text-[11px] text-[#7a6e62]">{META_LABELS[key]}</span>
            <input
              value={meta[key] ?? ""}
              onChange={(e) => onChange({ ...meta, [key]: e.target.value || null })}
              className={fieldClass}
            />
          </label>
        ))}
        <label className="col-span-2 block">
          <span className="text-[11px] text-[#7a6e62]">Größen (Komma getrennt)</span>
          <input
            value={meta.sizes.join(", ")}
            onChange={(e) =>
              onChange({
                ...meta,
                sizes: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="S, M, L"
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  index,
  total,
  onChange,
  onMove,
  onMerge,
  onAddAfter,
  onRemove,
}: {
  step: ParsedStep;
  index: number;
  total: number;
  onChange: (patch: Partial<ParsedStep>) => void;
  onMove: (direction: -1 | 1) => void;
  onMerge: () => void;
  onAddAfter: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfce] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
          Schritt {index + 1} von {total}
        </p>
        <div className="flex items-center gap-2">
          <HintMarker hints={step.hints ?? []} />
          <span className="rounded-full bg-[#f3e6d4] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[#6a4a2a]">
            {KIND_META[step.rowKind].de}
          </span>
        </div>
      </div>

      <label className="mt-2 block">
        <span className="text-[11px] text-[#7a6e62]">Bezeichnung</span>
        <input
          value={step.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className={fieldClass}
        />
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2 block sm:col-span-1">
          <span className="text-[11px] text-[#7a6e62]">Art</span>
          <select
            value={step.rowKind}
            onChange={(e) => onChange({ rowKind: e.target.value as RowKind })}
            className={fieldClass}
          >
            {ROW_KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_META[kind].de}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-[#7a6e62]">Von</span>
          <input
            type="number"
            inputMode="numeric"
            value={step.rowFrom ?? ""}
            onChange={(e) =>
              onChange({ rowFrom: e.target.value === "" ? null : Number(e.target.value) })
            }
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-[#7a6e62]">Bis</span>
          <input
            type="number"
            inputMode="numeric"
            value={step.rowTo ?? ""}
            onChange={(e) =>
              onChange({ rowTo: e.target.value === "" ? null : Number(e.target.value) })
            }
            className={fieldClass}
          />
        </label>
        <label className="col-span-2 block sm:col-span-1">
          <span className="text-[11px] text-[#7a6e62]">Maschen</span>
          <input
            type="number"
            inputMode="numeric"
            value={step.expectedStitches ?? ""}
            onChange={(e) =>
              onChange({
                expectedStitches: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className="mt-2 block">
        <span className="text-[11px] text-[#7a6e62]">Anweisung</span>
        <textarea
          value={step.instruction}
          onChange={(e) => onChange({ instruction: e.target.value })}
          rows={4}
          className={`${fieldClass} font-sans text-base leading-relaxed`}
        />
      </label>

      <div className="mt-2">
        <ImageUpload
          label="Schrittbild"
          value={null}
          storedPath={step.imageUrl ?? null}
          onChange={(path) => onChange({ imageUrl: path })}
        />
      </div>

      {step.original && step.original !== step.instruction ? (
        <p className="mt-1 text-xs text-[#7a6e62]">Original: {step.original}</p>
      ) : null}

      <label className="mt-2 block">
        <span className="text-[11px] text-[#7a6e62]">Hinweise (eine Zeile je Hinweis)</span>
        <textarea
          value={(step.hints ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              hints: e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
          rows={2}
          className={`${fieldClass} font-sans text-sm leading-relaxed`}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <TinyButton onClick={() => onMove(-1)} disabled={index === 0}>
          Hoch
        </TinyButton>
        <TinyButton onClick={() => onMove(1)} disabled={index === total - 1}>
          Runter
        </TinyButton>
        <TinyButton onClick={onMerge} disabled={index >= total - 1}>
          Verbinden
        </TinyButton>
        <TinyButton onClick={onAddAfter}>+ Schritt</TinyButton>
        <TinyButton onClick={onRemove} danger>
          Löschen
        </TinyButton>
      </div>
    </div>
  );
}

function TinyButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-11 shrink-0 rounded-full px-3 text-sm disabled:opacity-40 ${
        danger ? "text-[#8a3d16] ring-1 ring-[#eadfce]" : "bg-[#f3e6d4] text-[#2c241c]"
      }`}
    >
      {children}
    </button>
  );
}
