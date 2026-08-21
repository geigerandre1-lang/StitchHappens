import Link from "next/link";
import { PatternCard } from "@/components/PatternCard";
import { listCategories, listPatterns } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ kategorie?: string }>;
}) {
  const { kategorie } = await searchParams;
  const [patterns, categories] = await Promise.all([
    listPatterns(kategorie || null),
    listCategories(),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Deine Anleitungen</h1>
          <p className="mt-2 max-w-xl text-[#7a6e62]">
            Wähle eine gespeicherte Anleitung. Beim Öffnen entscheidest du, ob du
            weitermachst oder neu anfängst.
          </p>
        </div>
        <Link
          href="/anleitungen/neu"
          className="min-h-12 rounded-full bg-[#c45c26] px-5 py-3 text-sm font-medium text-white"
        >
          Neue Anleitung
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className={`min-h-10 rounded-full px-3 py-2 text-sm ${
              !kategorie ? "bg-[#2c241c] text-white" : "bg-[#f3e6d4] text-[#2c241c]"
            }`}
          >
            Alle
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?kategorie=${cat.id}`}
              className={`min-h-10 rounded-full px-3 py-2 text-sm ${
                kategorie === cat.id ? "bg-[#2c241c] text-white" : "bg-[#f3e6d4] text-[#2c241c]"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      ) : null}

      {patterns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fffbf5] p-10 text-center">
          <p className="text-[#7a6e62]">
            {kategorie ? "In dieser Kategorie noch keine Anleitungen." : "Noch keine Anleitungen gespeichert."}
          </p>
          <Link
            href="/anleitungen/neu"
            className="mt-4 inline-block rounded-full bg-[#c45c26] px-4 py-2 text-sm text-white"
          >
            Erste Anleitung anlegen
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </div>
  );
}
