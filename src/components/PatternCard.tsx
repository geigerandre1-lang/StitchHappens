"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePatternAction, resetPatternProgress } from "@/lib/actions";
import type { PatternSummary } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PatternCard({ pattern }: { pattern: PatternSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function continuePattern() {
    router.push(`/anleitungen/${pattern.id}`);
  }

  function startOver() {
    startTransition(async () => {
      await resetPatternProgress(pattern.id);
      router.push(`/anleitungen/${pattern.id}`);
    });
  }

  function remove() {
    if (!confirm(`„${pattern.name}“ wirklich löschen?`)) return;
    startTransition(async () => {
      await deletePatternAction(pattern.id);
      router.refresh();
    });
  }

  return (
    <>
      <article className="flex flex-col rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left"
        >
          <h2 className="font-display text-2xl text-[#2c241c]">{pattern.name}</h2>
          <p className="mt-2 text-sm text-[#7a6e62]">
            {pattern.sectionCount} Teile · {pattern.stepCount} Schritte ·{" "}
            {pattern.language === "en" ? "EN-Quelle" : "DE-Quelle"}
          </p>
          <p className="mt-1 text-xs text-[#9a8d7e]">
            Aktualisiert {formatDate(pattern.updatedAt)}
            {pattern.hasProgress ? " · Fortschritt gespeichert" : ""}
          </p>
        </button>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-12 rounded-full bg-[#c45c26] px-4 py-3 text-sm font-medium text-white hover:bg-[#a64c1e]"
          >
            Öffnen
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-full px-4 py-2 text-sm text-[#7a6e62] hover:bg-[#f3e6d4]"
          >
            Löschen
          </button>
        </div>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2c241c]/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-[#fffbf5] p-6 shadow-xl sm:rounded-2xl">
            <h3 className="font-display text-2xl text-[#2c241c]">{pattern.name}</h3>
            <p className="mt-2 text-sm text-[#7a6e62]">
              Möchtest du weitermachen oder alle Zähler zurücksetzen?
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={continuePattern}
                className="rounded-xl bg-[#5c7a5a] px-4 py-3 text-left text-white hover:bg-[#4c684b]"
              >
                <span className="block font-medium">Weitermachen</span>
                <span className="block text-sm text-white/80">
                  Zähler und letzte Stelle laden
                </span>
              </button>
              <button
                type="button"
                onClick={startOver}
                disabled={pending}
                className="rounded-xl bg-[#c45c26] px-4 py-3 text-left text-white hover:bg-[#a64c1e] disabled:opacity-70"
              >
                <span className="block font-medium">
                  {pending ? "Wird zurückgesetzt…" : "Neu anfangen"}
                </span>
                <span className="block text-sm text-white/80">
                  Zähler zurücksetzen und am Anfang starten
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm text-[#7a6e62] hover:bg-[#f3e6d4]"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
