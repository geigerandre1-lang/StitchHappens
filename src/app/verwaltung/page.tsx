import { adminLogin, adminLogout, createUserAction, deleteUserAction } from "@/lib/auth-actions";
import { isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  passwort: "Zugang nicht möglich.",
  name: "Name zu kurz (mindestens 2 Zeichen).",
  exists: "Diesen Namen gibt es schon.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const admin = await isAdminSession();
  const { fehler } = await searchParams;
  const message = fehler ? ERRORS[fehler] : null;

  if (!admin) {
    return (
      <div className="mx-auto max-w-sm pt-8">
        <h1 className="font-display text-3xl">Zugang</h1>
        <form action={adminLogin} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#2c241c]">Kennwort</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 min-h-12 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
            />
          </label>
          {message ? <p className="text-sm text-[#8a3d16]">{message}</p> : null}
          <button
            type="submit"
            className="min-h-12 w-full rounded-full bg-[#2c241c] px-4 text-sm font-medium text-white"
          >
            Öffnen
          </button>
        </form>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { patterns: true } } },
  });

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Benutzer</h1>
          <p className="mt-2 text-[#7a6e62]">
            Namen anlegen, die sich anmelden dürfen. Beim Löschen gehen auch deren
            Anleitungen mit.
          </p>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="min-h-11 rounded-full px-3 text-sm text-[#7a6e62]">
            Schließen
          </button>
        </form>
      </div>

      <form action={createUserAction} className="mt-6 flex gap-2">
        <input
          name="name"
          required
          placeholder="Neuer Name"
          className="min-h-12 flex-1 rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
        />
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-full bg-[#c45c26] px-4 text-sm font-medium text-white"
        >
          Anlegen
        </button>
      </form>
      {message ? <p className="mt-2 text-sm text-[#8a3d16]">{message}</p> : null}

      <ul className="mt-6 space-y-2">
        {users.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffbf5] p-6 text-sm text-[#7a6e62]">
            Noch keine Benutzer. Lege zuerst einen Namen an.
          </li>
        ) : (
          users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfce] bg-[#fffbf5] px-4 py-3"
            >
              <span>
                <span className="block font-medium text-[#2c241c]">{user.name}</span>
                <span className="text-xs text-[#7a6e62]">
                  {user._count.patterns} Anleitung{user._count.patterns === 1 ? "" : "en"}
                </span>
              </span>
              <form action={deleteUserAction}>
                <input type="hidden" name="id" value={user.id} />
                <button
                  type="submit"
                  className="min-h-11 rounded-full px-3 text-sm text-[#8a3d16] ring-1 ring-[#eadfce]"
                >
                  Löschen
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
