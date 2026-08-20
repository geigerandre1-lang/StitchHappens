import type { PatternDTO, SectionDTO } from "./types";

export function uniqueSizes(pattern: Pick<PatternDTO, "meta" | "sections">): string[] {
  const fromMeta = pattern.meta.sizes ?? [];
  const fromSections = pattern.sections
    .map((s) => s.sizeLabel)
    .filter((value): value is string => Boolean(value));
  return [...new Set([...fromMeta, ...fromSections])];
}

export function visibleSectionsForSize(
  sections: SectionDTO[],
  size: string | null,
): SectionDTO[] {
  return [
    ...sections.filter((s) => s.kind === "work"),
    ...sections.filter((s) => s.kind === "size" && (!size || s.sizeLabel === size)),
    ...sections.filter((s) => s.kind === "montage"),
  ];
}

export function resolveLastOpened(pattern: PatternDTO): {
  size: string | null;
  sectionId: string;
  stepId: string;
} {
  const sizes = uniqueSizes(pattern);
  const lastSection = pattern.sections.find((s) => s.id === pattern.lastSectionId) ?? null;

  let size: string | null =
    pattern.lastSize && sizes.includes(pattern.lastSize) ? pattern.lastSize : (sizes[0] ?? null);

  if (lastSection?.kind === "size" && lastSection.sizeLabel && sizes.includes(lastSection.sizeLabel)) {
    size = lastSection.sizeLabel;
  }

  const visible = visibleSectionsForSize(pattern.sections, size);
  const section =
    (lastSection && visible.some((s) => s.id === lastSection.id) ? lastSection : null) ??
    visible[0] ??
    null;

  const sectionId = section?.id ?? "";
  const steps = section?.steps ?? [];
  const stepId =
    (pattern.lastStepId && steps.some((s) => s.id === pattern.lastStepId)
      ? pattern.lastStepId
      : steps[0]?.id) ?? "";

  return { size, sectionId, stepId };
}
