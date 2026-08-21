import Link from "next/link";
import { notFound } from "next/navigation";
import { PatternEditorForm } from "@/components/PatternEditorForm";
import { getPatternForEdit, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditPatternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pattern, categories] = await Promise.all([
    getPatternForEdit(id),
    listCategories(),
  ]);
  if (!pattern) notFound();

  return (
    <div>
      <Link
        href={`/anleitungen/${id}`}
        className="text-sm text-[#7a6e62] hover:text-[#2c241c]"
      >
        ← Zur Anleitung
      </Link>
      <h1 className="mt-4 font-display text-4xl">Anleitung bearbeiten</h1>
      <p className="mt-2 max-w-2xl text-[#7a6e62]">
        Name, Kategorie, Bilder und Schritte anpassen. Fortschritt und Kommentare
        bleiben erhalten, solange die Schritte nicht gelöscht werden.
      </p>
      <div className="mt-8">
        <PatternEditorForm
          categories={categories}
          patternId={pattern.id}
          initial={{
            name: pattern.name,
            categoryId: pattern.categoryId ?? "",
            coverImage: pattern.coverImage,
            draft: pattern.draft,
          }}
        />
      </div>
    </div>
  );
}
