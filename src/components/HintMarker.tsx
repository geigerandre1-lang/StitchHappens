"use client";

import { useState } from "react";

export function HintMarker({ hints }: { hints: string[] }) {
  const [open, setOpen] = useState(false);
  const items = hints.map((h) => h.trim()).filter(Boolean);
  if (items.length === 0) return null;

  const label = items.length > 1 ? `${items.length} Hinweise` : "Hinweis";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#c45c26] text-lg font-bold leading-none text-white"
      >
        !
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#2c241c]/40 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-[#fffbf5] p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl text-[#2c241c]">
              {items.length > 1 ? "Hinweise" : "Hinweis"}
            </h3>
            <ul className="mt-4 space-y-3">
              {items.map((hint, index) => (
                <li
                  key={`${index}-${hint.slice(0, 24)}`}
                  className="rounded-xl bg-white p-3 text-base leading-relaxed text-[#2c241c] ring-1 ring-[#eadfce]"
                >
                  {hint}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 min-h-12 w-full rounded-xl bg-[#2c241c] px-4 text-sm font-medium text-white"
            >
              Schließen
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
