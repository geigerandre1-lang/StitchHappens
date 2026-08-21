import { PatternForm } from "@/components/PatternForm";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewPatternPage() {
  const categories = await listCategories();

  return (
    <div>
      <h1 className="font-display text-4xl">Neue Anleitung</h1>
      <p className="mt-2 max-w-2xl text-[#7a6e62]">
        Name festlegen, Teile und Schritte manuell anlegen. Optional Gesamtbild,
        Schrittbilder und eine Kategorie zuweisen.
      </p>
      <div className="mt-8">
        <PatternForm categories={categories} />
      </div>
    </div>
  );
}
