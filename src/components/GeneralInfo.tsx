"use client";

import { useState } from "react";
import { META_LABELS, metaHasContent, metaSummaryChips, type PatternMeta } from "@/lib/parser/meta";

export function GeneralInfo({ meta, compact = false }: { meta: PatternMeta; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  if (!metaHasContent(meta)) return null;

  const chips = metaSummaryChips(meta);
  const fields: Array<[keyof typeof META_LABELS, string | null]> = [
    ["hook", meta.hook],
    ["yarn", meta.yarn],
    ["yarnAmount", meta.yarnAmount],
    ["height", meta.height],
    ["width", meta.width],
    ["length", meta.length],
    ["gauge", meta.gauge],
    ["difficulty", meta.difficulty],
  ];

  return (
    <section className="rounded-2xl border border-[#eadfce] bg-[#fffbf5]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="block text-xs font-medium uppercase tracking-wide text-[#7a6e62]">
            Allgemein
          </span>
          {!open && chips.length > 0 ? (
            <span className="mt-1 block text-sm text-[#2c241c]">{chips.join(" · ")}</span>
          ) : (
            <span className="mt-0.5 block text-sm text-[#7a6e62]">
              Nadel, Wolle, Maße — nicht in den Häkel-Reitern
            </span>
          )}
        </span>
        <span className="text-lg text-[#7a6e62]">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div className="grid grid-cols-2 gap-2 border-t border-[#eadfce] p-4 sm:grid-cols-3">
          {fields.map(([key, value]) =>
            value ? (
              <div key={key} className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfce]">
                <p className="text-[11px] uppercase tracking-wide text-[#7a6e62]">{META_LABELS[key]}</p>
                <p className="mt-0.5 text-sm font-medium text-[#2c241c]">{value}</p>
              </div>
            ) : null,
          )}
          {meta.sizes.length > 0 ? (
            <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfce]">
              <p className="text-[11px] uppercase tracking-wide text-[#7a6e62]">Größen</p>
              <p className="mt-0.5 text-sm font-medium text-[#2c241c]">{meta.sizes.join(" · ")}</p>
            </div>
          ) : null}
          {meta.extras.map((item) => (
            <div key={`${item.label}-${item.value}`} className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfce]">
              <p className="text-[11px] uppercase tracking-wide text-[#7a6e62]">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-[#2c241c]">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
