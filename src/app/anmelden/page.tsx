import { loginWithName } from "@/lib/auth-actions";
import { RedirectForm } from "@/components/RedirectForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  name: "Bitte einen Namen eingeben.",
  unbekannt: "Dieser Name ist nicht angelegt. Bitte die Verwaltung fragen.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { fehler } = await searchParams;
  const message = fehler ? ERRORS[fehler] : null;

  return (
    <div className="mx-auto max-w-md pt-8">
      <h1 className="font-display text-4xl">Wer häkelt?</h1>
      <p className="mt-2 text-[#7a6e62]">
        Gib deinen Namen ein. Jede Person sieht nur die eigenen Anleitungen.
      </p>
      <RedirectForm action={loginWithName} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-[#2c241c]">Name</span>
          <input
            name="name"
            required
            autoFocus
            autoComplete="username"
            placeholder="z. B. Andre"
            className="mt-1 min-h-12 w-full rounded-xl border border-[#eadfce] bg-white px-3 py-2 text-base outline-none focus:border-[#c45c26]"
          />
        </label>
        {message ? <p className="text-sm text-[#8a3d16]">{message}</p> : null}
        <button
          type="submit"
          className="min-h-12 w-full rounded-full bg-[#c45c26] px-4 text-sm font-medium text-white"
        >
          Weiter
        </button>
      </RedirectForm>
      <p className="mt-16 text-center text-[11px] text-[#eadfce]">
        <Link href="/verwaltung" className="hover:text-[#7a6e62]">
          ·
        </Link>
      </p>
    </div>
  );
}
