"use client";

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/lib/settings-actions";
import type { CategoryDTO } from "@/lib/types";

export function CategoryManager({ initial }: { initial: CategoryDTO[] }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addCategory() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    const fd = new FormData();
    fd.set("name", trimmed);
    startTransition(async () => {
      const result = await createCategoryAction(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCategories((prev) => [...prev, { id: result.id, name: result.name, color: result.color }]);
      setName("");
    });
  }

  function remove(id: string) {
    if (!confirm("Kategorie löschen? Anleitungen behalten ihre Daten.")) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function rename(id: string, nextName: string) {
    startTransition(async () => {
      const result = await renameCategoryAction(id, nextName);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: nextName.trim() } : c)),
      );
    });
  }

  return (
    <section className="rounded-2xl border border-[#eadfce] bg-[#fffbf5] p-5">
      <h2 className="font-display text-2xl text-[#2c241c]">Kategorien</h2>
      <p className="mt-2 text-sm text-[#7a6e62]">
        Ordne deine Anleitungen z. B. nach Projekttyp (Amigurumi, Decken, …).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neue Kategorie"
          className="min-h-11 min-w-[12rem] flex-1 rounded-xl border border-[#eadfce] bg-white px-3 py-2 outline-none focus:border-[#c45c26]"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCategory();
            }
          }}
        />
        <button
          type="button"
          onClick={addCategory}
          disabled={pending || !name.trim()}
          className="min-h-11 rounded-full bg-[#c45c26] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          Anlegen
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-[#8a3d16]">{error}</p> : null}

      <ul className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <li className="text-sm text-[#7a6e62]">Noch keine Kategorien.</li>
        ) : (
          categories.map((cat) => (
            <li
              key={cat.id}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-[#eadfce]"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
                aria-hidden
              />
              <input
                defaultValue={cat.name}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== cat.name) rename(cat.id, next);
                }}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 outline-none focus:border-[#eadfce]"
              />
              <button
                type="button"
                onClick={() => remove(cat.id)}
                disabled={pending}
                className="min-h-10 rounded-full px-3 text-sm text-[#8a3d16] hover:bg-[#f8e6dc]"
              >
                Löschen
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
