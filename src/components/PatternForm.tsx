import { ENABLE_AUTO_IMPORT } from "@/lib/features";
import type { CategoryDTO } from "@/lib/types";
import { AutoImportPatternForm } from "@/components/AutoImportPatternForm";
import { ManualPatternForm } from "@/components/ManualPatternForm";

export function PatternForm({ categories }: { categories: CategoryDTO[] }) {
  if (ENABLE_AUTO_IMPORT) {
    return <AutoImportPatternForm />;
  }
  return <ManualPatternForm categories={categories} />;
}
