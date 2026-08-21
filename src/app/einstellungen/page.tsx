import { CategoryManager } from "@/components/CategoryManager";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl">Einstellungen</h1>
      <p className="mt-2 text-[#7a6e62]">Deine persönlichen Kategorien für Anleitungen.</p>
      <div className="mt-8">
        <CategoryManager initial={categories} />
      </div>
    </div>
  );
}
