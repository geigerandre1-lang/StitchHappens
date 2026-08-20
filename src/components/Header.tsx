"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export function Header({
  userName,
  isAdmin,
}: {
  userName: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[#fffbf5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link href={userName ? "/" : "/anmelden"} className="flex min-h-11 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c45c26] text-lg text-white">
            ⊗
          </span>
          <span>
            <span className="font-display block text-base leading-tight text-[#2c241c] sm:text-lg">
              Häkel-Anleitungen
            </span>
            <span className="hidden text-xs text-[#7a6e62] sm:block">
              {userName ? `Hallo, ${userName}` : "Nachhäkeln unterwegs"}
            </span>
          </span>
        </Link>
        {userName ? (
          <>
            <nav className="hidden items-center gap-2 text-sm sm:flex">
              <Link href="/" className="rounded-full px-3 py-1.5 text-[#2c241c] hover:bg-[#f3e6d4]">
                Übersicht
              </Link>
              <Link href="/glossar" className="rounded-full px-3 py-1.5 text-[#2c241c] hover:bg-[#f3e6d4]">
                Glossar
              </Link>
              {isAdmin ? (
                <Link href="/verwaltung" className="rounded-full px-3 py-1.5 text-[#2c241c] hover:bg-[#f3e6d4]">
                  Benutzer
                </Link>
              ) : null}
              <Link
                href="/anleitungen/neu"
                className="rounded-full bg-[#c45c26] px-3 py-1.5 font-medium text-white hover:bg-[#a64c1e]"
              >
                Neue Anleitung
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-[#7a6e62] hover:bg-[#f3e6d4]">
                  Abmelden
                </button>
              </form>
            </nav>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#f3e6d4] text-lg sm:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menü"
            >
              {open ? "×" : "☰"}
            </button>
          </>
        ) : null}
      </div>
      {open && userName ? (
        <nav className="grid gap-1 border-t border-[#eadfce] px-3 py-3 sm:hidden">
          <p className="px-3 pb-1 text-sm text-[#7a6e62]">{userName}</p>
          <Link href="/" onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 py-3 text-[#2c241c]">
            Übersicht
          </Link>
          <Link href="/glossar" onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-3 py-3 text-[#2c241c]">
            Glossar
          </Link>
          {isAdmin ? (
            <Link
              href="/verwaltung"
              onClick={() => setOpen(false)}
              className="min-h-12 rounded-xl px-3 py-3 text-[#2c241c]"
            >
              Benutzer
            </Link>
          ) : null}
          <Link
            href="/anleitungen/neu"
            onClick={() => setOpen(false)}
            className="min-h-12 rounded-xl bg-[#c45c26] px-3 py-3 text-center font-medium text-white"
          >
            Neue Anleitung
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="min-h-12 w-full rounded-xl px-3 py-3 text-left text-[#7a6e62]">
              Abmelden
            </button>
          </form>
        </nav>
      ) : null}
    </header>
  );
}
