import { PrismaClient } from "@prisma/client";
import { PUMPKIN_DE, parsePattern } from "../src/lib/parser";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.pattern.findFirst({
    where: { name: "Kleiner Kürbis" },
  });
  if (existing) {
    console.log("Beispiel-Anleitung existiert bereits.");
    return;
  }

  const parsed = parsePattern(PUMPKIN_DE, "Kleiner Kürbis");
  const owner = await prisma.user.upsert({
    where: { name: "Lokal" },
    create: { name: "Lokal" },
    update: {},
  });
  await prisma.pattern.create({
    data: {
      userId: owner.id,
      name: "Kleiner Kürbis",
      originalText: PUMPKIN_DE,
      language: parsed.language,
      meta: JSON.stringify(parsed.meta),
      sections: {
        create: parsed.sections.map((section, sectionIndex) => ({
          title: section.title,
          kind: section.kind,
          sizeLabel: section.sizeLabel,
          sortOrder: sectionIndex,
          steps: {
            create: section.steps.map((step, stepIndex) => ({
              sortOrder: stepIndex,
              label: step.label,
              rowFrom: step.rowFrom,
              rowTo: step.rowTo,
              rowKind: step.rowKind,
              instruction: step.instruction,
              originalInstruction: step.original,
              summary: step.summary,
              expectedStitches: step.expectedStitches,
              abbreviations: JSON.parse(JSON.stringify(step.abbreviations)),
              hints: JSON.stringify(step.hints ?? []),
              stitchCount: 0,
              repeatCurrent: step.rowFrom ?? 0,
            })),
          },
        })),
      },
    },
  });
  console.log("Beispiel „Kleiner Kürbis“ angelegt.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
