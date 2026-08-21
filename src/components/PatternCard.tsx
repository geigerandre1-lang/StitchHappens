"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePatternAction, duplicatePatternAction, resetPatternProgress } from "@/lib/actions";
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

  function duplicate() {
    startTransition(async () => {
      await duplicatePatternAction(pattern.id);
    });
  }

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffbf5] shadow-sm">
        {pattern.coverImage ? (
          <div className="aspect-[16/10] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pattern.coverImage}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col p-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left"
        >
          <h2 className="font-display text-2xl text-[#2c241c]">{pattern.name}</h2>
          {pattern.category ? (
            <span
              className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: pattern.category.color }}
            >
              {pattern.category.name}
            </span>
          ) : null}
          <p className="mt-2 text-sm text-[#7a6e62]">
            {pattern.sectionCount} Teile · {pattern.stepCount} Schritte
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
            onClick={duplicate}
            disabled={pending}
            className="rounded-full px-4 py-2 text-sm text-[#7a6e62] hover:bg-[#f3e6d4] disabled:opacity-70"
          >
            {pending ? "Kopiert…" : "Kopieren"}
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
              <Link
                href={`/anleitungen/${pattern.id}/bearbeiten`}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-white px-4 py-3 text-left ring-1 ring-[#eadfce] hover:bg-[#f3e6d4]"
              >
                <span className="block font-medium text-[#2c241c]">Bearbeiten</span>
                <span className="block text-sm text-[#7a6e62]">
                  Name, Schritte und Bilder ändern
                </span>
              </Link>
              <button
                type="button"
                onClick={duplicate}
                disabled={pending}
                className="rounded-xl bg-white px-4 py-3 text-left ring-1 ring-[#eadfce] hover:bg-[#f3e6d4] disabled:opacity-70"
              >
                <span className="block font-medium text-[#2c241c]">
                  {pending ? "Wird kopiert…" : "Kopieren"}
                </span>
                <span className="block text-sm text-[#7a6e62]">
                  Duplikat ohne Fortschritt und Kommentare
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
