"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addStepComment,
  deleteStepComment,
  duplicatePatternAction,
  resetPatternProgress,
  saveLastOpened,
  saveStepProgress,
  updateStepComment,
} from "@/lib/actions";
import { HintMarker } from "@/components/HintMarker";
import { GeneralInfo } from "@/components/GeneralInfo";
import { resolveLastOpened, uniqueSizes } from "@/lib/lastOpened";
import { KIND_META } from "@/lib/parser";
import type { CommentDTO, PatternDTO, SectionDTO, StepDTO } from "@/lib/types";

function isRangeStep(step: StepDTO) {
  return step.rowFrom != null && step.rowTo != null && step.rowFrom !== step.rowTo;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FollowAlong({ pattern }: { pattern: PatternDTO }) {
  const router = useRouter();
  const workSections = pattern.sections.filter((s) => s.kind === "work");
  const montageSections = pattern.sections.filter((s) => s.kind === "montage");
  const sizeSections = pattern.sections.filter((s) => s.kind === "size");
  const sizes = uniqueSizes(pattern);
  const initial = resolveLastOpened(pattern);

  const [size, setSize] = useState<string | null>(initial.size);
  const visibleSections = useMemo(() => {
    return [
      ...pattern.sections.filter((s) => s.kind === "work"),
      ...pattern.sections.filter((s) => s.kind === "size" && (!size || s.sizeLabel === size)),
      ...pattern.sections.filter((s) => s.kind === "montage"),
    ];
  }, [pattern.sections, size]);

  const [sectionId, setSectionId] = useState(initial.sectionId || visibleSections[0]?.id || "");
  const [stepId, setStepId] = useState(initial.stepId || visibleSections[0]?.steps[0]?.id || "");
  const [steps, setSteps] = useState<Record<string, StepDTO>>(() => {
    const map: Record<string, StepDTO> = {};
    for (const section of pattern.sections) {
      for (const step of section.steps) map[step.id] = step;
    }
    return map;
  });
  const [, startTransition] = useTransition();
  const [duplicating, startDuplicate] = useTransition();
  const skipLastOpenedSave = useRef(true);
  const activeStepBtnRef = useRef<HTMLButtonElement>(null);

  const section =
    visibleSections.find((s) => s.id === sectionId) ?? visibleSections[0] ?? pattern.sections[0];
  const sectionSteps = section?.steps ?? [];
  const activeStep = steps[stepId] ?? sectionSteps[0];

  useEffect(() => {
    if (!visibleSections.some((s) => s.id === sectionId) && visibleSections[0]) {
      setSectionId(visibleSections[0].id);
      setStepId(visibleSections[0].steps[0]?.id ?? "");
    }
  }, [size, sectionId, visibleSections]);

  useEffect(() => {
    if (!sectionId || !stepId) return;
    if (skipLastOpenedSave.current) {
      skipLastOpenedSave.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(() => {
        void saveLastOpened(pattern.id, sectionId, stepId, size);
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [pattern.id, sectionId, stepId, size]);

  useEffect(() => {
    activeStepBtnRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [stepId]);

  const stepIndex = sectionSteps.findIndex((s) => s.id === activeStep?.id);
  function goStep(delta: number) {
    const next = sectionSteps[stepIndex + delta];
    if (next) setStepId(next.id);
  }

  function persistCounters(next: StepDTO) {
    startTransition(async () => {
      await saveStepProgress(pattern.id, next.id, next.stitchCount, next.repeatCurrent);
    });
  }

  function patchStep(id: string, partial: Partial<StepDTO>, persist = false) {
    const prev = steps[id];
    if (!prev) return;
    const next = { ...prev, ...partial };
    setSteps((current) => ({ ...current, [id]: next }));
    if (persist) persistCounters(next);
  }

  async function handleReset() {
    if (!confirm("Alle Zähler dieser Anleitung zurücksetzen?")) return;
    await resetPatternProgress(pattern.id);
    window.location.reload();
  }

  function handleDuplicate() {
    startDuplicate(async () => {
      const path = await duplicatePatternAction(pattern.id);
      router.push(path);
    });
  }

  if (!section || !activeStep) {
    return <p>Diese Anleitung hat noch keine Schritte.</p>;
  }

  const liveHints = (steps[activeStep.id] ?? activeStep).hints ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[#7a6e62]">
            {pattern.language === "en" ? "Englisch" : "Deutsch"}
            {size ? ` · Größe ${size}` : ""}
          </p>
          <h1 className="font-display text-3xl leading-tight text-[#2c241c] sm:text-4xl">
            {pattern.name}
          </h1>
          {pattern.category ? (
            <span
              className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: pattern.category.color }}
            >
              {pattern.category.name}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href={`/anleitungen/${pattern.id}/bearbeiten`}
            className="min-h-11 rounded-full border border-[#eadfce] px-3 py-2 text-center text-sm text-[#2c241c] hover:bg-[#f3e6d4]"
          >
            Bearbeiten
          </Link>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="min-h-11 rounded-full border border-[#eadfce] px-3 py-2 text-sm text-[#2c241c] disabled:opacity-70"
          >
            {duplicating ? "Kopiert…" : "Kopieren"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-11 rounded-full border border-[#eadfce] px-3 py-2 text-sm text-[#2c241c]"
          >
            Neu
          </button>
        </div>
      </div>

      {pattern.coverImage ? (
        <div className="overflow-hidden rounded-2xl ring-1 ring-[#eadfce]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pattern.coverImage}
            alt=""
            className="max-h-64 w-full object-contain bg-white"
          />
        </div>
      ) : null}

      <GeneralInfo meta={pattern.meta} compact />

      <div className="flex items-start gap-2 sm:gap-4">
        <aside className="w-[8.5rem] shrink-0 sm:w-52 md:w-[17.5rem]">
          <nav
            aria-label="Teile und Schritte"
            className="sticky top-16 max-h-[calc(100dvh-9.5rem)] overflow-y-auto overscroll-contain pb-28 sm:max-h-[calc(100dvh-5.5rem)] sm:pb-2"
          >
            <div className="space-y-3">
              {sizes.length > 0 ? (
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#7a6e62] sm:text-xs">
                    Größe
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sizes.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSize(item)}
                        className={`min-h-11 min-w-11 rounded-full px-2.5 text-xs font-medium sm:px-3 sm:text-sm ${
                          item === size
                            ? "bg-[#5c7a5a] text-white"
                            : "bg-white text-[#2c241c] ring-1 ring-[#eadfce]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <SectionList
                label="Teile"
                items={workSections}
                activeId={section.id}
                variant="work"
                onSelect={(item) => {
                  setSectionId(item.id);
                  setStepId(item.steps[0]?.id ?? "");
                }}
              />
              <SectionList
                label={size ? `Größe ${size}` : "Größen"}
                items={sizeSections.filter((s) => !size || s.sizeLabel === size)}
                activeId={section.id}
                variant="size"
                onSelect={(item) => {
                  setSectionId(item.id);
                  setStepId(item.steps[0]?.id ?? "");
                }}
              />
              <SectionList
                label="Montage"
                items={montageSections}
                activeId={section.id}
                variant="montage"
                onSelect={(item) => {
                  setSectionId(item.id);
                  setStepId(item.steps[0]?.id ?? "");
                }}
              />

              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#7a6e62] sm:text-xs">
                  Schritte
                </p>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  {sectionSteps.map((item) => {
                    const live = steps[item.id] ?? item;
                    const selected = item.id === activeStep.id;
                    const hasHints = (live.hints ?? []).some((h) => h.trim());
                    return (
                      <button
                        key={item.id}
                        ref={selected ? activeStepBtnRef : undefined}
                        type="button"
                        onClick={() => setStepId(item.id)}
                        title={live.label}
                        className={`min-h-11 w-full rounded-lg px-2 py-2 text-left text-xs sm:rounded-xl sm:px-3 sm:text-sm ${
                          selected
                            ? "bg-[#c45c26] text-white"
                            : "bg-white text-[#2c241c] ring-1 ring-[#eadfce]"
                        }`}
                      >
                        <span className="flex items-start gap-1">
                          <span className="min-w-0 flex-1 font-medium leading-snug">{live.label}</span>
                          {hasHints ? (
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                selected ? "bg-white/25" : "bg-[#c45c26] text-white"
                              }`}
                            >
                              !
                            </span>
                          ) : null}
                        </span>
                        {isRangeStep(live) ? (
                          <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
                            {live.repeatCurrent}/{live.rowTo}
                          </span>
                        ) : live.expectedStitches != null ? (
                          <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
                            {live.expectedStitches} M
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 pb-28 sm:pb-0">
          <article className="rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-3 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f3e6d4] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#6a4a2a]">
                {KIND_META[activeStep.rowKind as keyof typeof KIND_META]?.de ?? activeStep.rowKind}
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-[#c45c26]">
                {activeStep.label}
              </p>
              <HintMarker hints={liveHints} />
            </div>
            {activeStep.summary ? (
              <p className="mt-2 text-sm text-[#7a6e62]">{activeStep.summary}</p>
            ) : null}
            {activeStep.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-[#eadfce]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeStep.imageUrl}
                  alt=""
                  className="max-h-80 w-full object-contain bg-white"
                />
              </div>
            ) : null}
            <p className="mt-2 text-base leading-relaxed text-[#2c241c] sm:text-lg">
              {activeStep.instruction}
            </p>
            {activeStep.originalInstruction &&
            activeStep.originalInstruction !== activeStep.instruction ? (
              <details className="mt-2 text-sm text-[#7a6e62]">
                <summary className="cursor-pointer select-none">Originaltext</summary>
                <p className="mt-1 font-mono text-xs leading-relaxed">{activeStep.originalInstruction}</p>
              </details>
            ) : null}
            {activeStep.abbreviations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeStep.abbreviations.map((abbr) => (
                  <span
                    key={`${abbr.abbr}-${abbr.count}`}
                    className="rounded-full bg-[#f3e6d4] px-2.5 py-1 text-xs text-[#2c241c]"
                  >
                    {abbr.count ? `${abbr.count} ` : ""}
                    {abbr.abbr} = {abbr.meaning}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 hidden gap-4 sm:grid md:grid-cols-2">
              {isRangeStep(activeStep) ? (
                <RepeatCounter
                  step={activeStep}
                  onChange={(repeatCurrent) => patchStep(activeStep.id, { repeatCurrent }, true)}
                />
              ) : null}
              <StitchCounter
                value={activeStep.stitchCount}
                expected={activeStep.expectedStitches}
                onChange={(stitchCount) => patchStep(activeStep.id, { stitchCount }, true)}
              />
            </div>

            <StepComments
              patternId={pattern.id}
              step={activeStep}
              onChange={(comments) => patchStep(activeStep.id, { comments })}
            />
          </article>
        </div>
      </div>

      <StickyCounters
        step={activeStep}
        hasPrev={stepIndex > 0}
        hasNext={stepIndex >= 0 && stepIndex < sectionSteps.length - 1}
        onPrev={() => goStep(-1)}
        onNext={() => goStep(1)}
        onStitch={(stitchCount) => patchStep(activeStep.id, { stitchCount }, true)}
        onRepeat={(repeatCurrent) => patchStep(activeStep.id, { repeatCurrent }, true)}
      />
    </div>
  );
}

function SectionList({
  label,
  items,
  activeId,
  onSelect,
  variant = "work",
}: {
  label: string;
  items: SectionDTO[];
  activeId: string;
  onSelect: (item: SectionDTO) => void;
  variant?: "work" | "size" | "montage";
}) {
  if (items.length === 0) return null;
  const selected =
    variant === "montage"
      ? "bg-[#3a4d66] text-white"
      : variant === "size"
        ? "bg-[#5c7a5a] text-white"
        : "bg-[#2c241c] text-white";
  const idle =
    variant === "montage"
      ? "bg-[#e7eef5] text-[#3a4d66]"
      : variant === "size"
        ? "bg-[#e8f0e6] text-[#3d5a3c]"
        : "bg-[#f3e6d4] text-[#2c241c]";

  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#7a6e62] sm:text-xs">{label}</p>
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            title={item.title}
            className={`min-h-11 w-full truncate rounded-lg px-2.5 text-left text-xs font-medium sm:rounded-xl sm:px-3 sm:text-sm ${
              item.id === activeId ? selected : idle
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function StickyCounters({
  step,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onStitch,
  onRepeat,
}: {
  step: StepDTO;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onStitch: (value: number) => void;
  onRepeat: (value: number) => void;
}) {
  const range = isRangeStep(step);
  const min = step.rowFrom ?? 1;
  const max = step.rowTo ?? min;
  const repeat = clamp(step.repeatCurrent || min, min, max);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eadfce] bg-[#fffbf5]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={onPrev}
          className="min-h-12 min-w-12 rounded-full bg-[#f3e6d4] text-lg disabled:opacity-40"
        >
          ←
        </button>
        {range ? (
          <CounterPill
            label="Runde/Reihe"
            value={repeat}
            extra={`/ ${max}`}
            onMinus={() => onRepeat(clamp(repeat - 1, min, max))}
            onPlus={() => onRepeat(clamp(repeat + 1, min, max))}
          />
        ) : null}
        <CounterPill
          label="Maschen"
          value={step.stitchCount}
          extra={step.expectedStitches != null ? `/ ${step.expectedStitches}` : ""}
          onMinus={() => onStitch(Math.max(0, step.stitchCount - 1))}
          onPlus={() => onStitch(step.stitchCount + 1)}
        />
        <button
          type="button"
          disabled={!hasNext}
          onClick={onNext}
          className="min-h-12 min-w-12 rounded-full bg-[#c45c26] text-lg text-white disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}

function CounterPill({
  label,
  value,
  extra,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  extra: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between rounded-full bg-white px-1 py-1 ring-1 ring-[#eadfce]">
      <button type="button" onClick={onMinus} className="min-h-11 min-w-11 rounded-full text-xl">
        −
      </button>
      <span className="min-w-0 text-center">
        <span className="block text-[10px] uppercase tracking-wide text-[#7a6e62]">{label}</span>
        <span className="block text-base font-semibold leading-none">
          {value}
          {extra}
        </span>
      </span>
      <button type="button" onClick={onPlus} className="min-h-11 min-w-11 rounded-full text-xl">
        +
      </button>
    </div>
  );
}

function RepeatCounter({
  step,
  onChange,
}: {
  step: StepDTO;
  onChange: (value: number) => void;
}) {
  const min = step.rowFrom ?? 1;
  const max = step.rowTo ?? min;
  const kind = step.rowKind === "runde" ? "Runde" : "Reihe";
  const value = clamp(step.repeatCurrent || min, min, max);
  const progress = max === min ? 100 : ((value - min) / (max - min)) * 100;

  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-[#eadfce]">
      <h3 className="font-medium text-[#2c241c]">Wiederholungszähler</h3>
      <p className="mt-1 text-sm text-[#7a6e62]">
        {kind} {value} von {max}
        {max - min + 1 > 1 ? ` · ${max - min + 1} gleiche ${kind === "Runde" ? "Runden" : "Reihen"}` : ""}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f3e6d4]">
        <div className="h-full bg-[#5c7a5a]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-[#f3e6d4] text-xl"
          onClick={() => onChange(clamp(value - 1, min, max))}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min, min, max))}
          className="h-11 w-24 rounded-xl border border-[#eadfce] text-center"
        />
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-[#5c7a5a] text-xl text-white"
          onClick={() => onChange(clamp(value + 1, min, max))}
        >
          +
        </button>
      </div>
    </section>
  );
}

function StitchCounter({
  value,
  expected,
  onChange,
}: {
  value: number;
  expected: number | null;
  onChange: (value: number) => void;
}) {
  const matches = expected != null && value === expected;
  return (
    <section className="rounded-xl bg-white p-4 ring-1 ring-[#eadfce]">
      <h3 className="font-medium text-[#2c241c]">Maschenzähler</h3>
      <p className="mt-1 text-sm text-[#7a6e62]">
        {expected != null
          ? matches
            ? `Ziel erreicht: ${expected} Maschen`
            : `Gezählt ${value} von ${expected} Maschen`
          : "Für den aktuellen Schritt"}
      </p>
      {expected != null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f3e6d4]">
          <div
            className={`h-full ${matches ? "bg-[#5c7a5a]" : "bg-[#c45c26]"}`}
            style={{ width: `${Math.min(100, (value / expected) * 100)}%` }}
          />
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-[#f3e6d4] text-xl"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="h-11 w-24 rounded-xl border border-[#eadfce] text-center"
        />
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-[#c45c26] text-xl text-white"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </section>
  );
}

function StepComments({
  patternId,
  step,
  onChange,
}: {
  patternId: string;
  step: StepDTO;
  onChange: (comments: CommentDTO[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const comments = useMemo(() => step.comments ?? [], [step.comments]);

  function add() {
    const body = draft.trim();
    if (!body) return;
    startTransition(async () => {
      const created = await addStepComment(patternId, step.id, body);
      onChange([...comments, created]);
      setDraft("");
      setOpen(true);
    });
  }

  function saveEdit(commentId: string, body: string) {
    startTransition(async () => {
      const updated = await updateStepComment(patternId, commentId, body);
      onChange(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    });
  }

  function remove(commentId: string) {
    startTransition(async () => {
      await deleteStepComment(patternId, commentId);
      onChange(comments.filter((c) => c.id !== commentId));
    });
  }

  return (
    <section className="mt-6 border-t border-[#eadfce] pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-[#2c241c]">
          Kommentare {comments.length ? `(${comments.length})` : ""}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[#f3e6d4] px-3 py-1.5 text-sm text-[#2c241c]"
        >
          Kommentar hinzufügen
        </button>
      </div>

      {open ? (
        <div className="mt-3 flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Eigene Notiz zu diesem Schritt…"
            className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !draft.trim()}
            className="self-start rounded-full bg-[#2c241c] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      ) : null}

      <ul className="mt-3 space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-xl bg-white p-3 ring-1 ring-[#eadfce]">
            {editingId === comment.id ? (
              <EditComment
                initial={comment.body}
                pending={pending}
                onCancel={() => setEditingId(null)}
                onSave={(body) => saveEdit(comment.id, body)}
              />
            ) : (
              <>
                <p className="text-sm text-[#2c241c]">{comment.body}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <button type="button" onClick={() => setEditingId(comment.id)}>
                    Bearbeiten
                  </button>
                  <button type="button" onClick={() => remove(comment.id)}>
                    Löschen
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EditComment({
  initial,
  pending,
  onCancel,
  onSave,
}: {
  initial: string;
  pending: boolean;
  onCancel: () => void;
  onSave: (body: string) => void;
}) {
  const [body, setBody] = useState(initial);
  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-[#eadfce] px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !body.trim()}
          onClick={() => onSave(body)}
          className="rounded-full bg-[#2c241c] px-3 py-1 text-xs text-white"
        >
          Speichern
        </button>
        <button type="button" onClick={onCancel} className="text-xs">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
