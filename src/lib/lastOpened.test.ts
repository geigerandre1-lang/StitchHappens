import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyMeta } from "./parser/meta";
import { resolveLastOpened } from "./lastOpened";
import type { PatternDTO, SectionDTO, StepDTO } from "./types";

function step(id: string, label: string): StepDTO {
  return {
    id,
    sortOrder: 0,
    label,
    summary: "",
    originalInstruction: "",
    rowFrom: 1,
    rowTo: 1,
    rowKind: "reihe",
    instruction: label,
    abbreviations: [],
    expectedStitches: null,
    stitchCount: 0,
    repeatCurrent: 1,
    hints: [],
    imageUrl: null,
    comments: [],
  };
}

function section(
  id: string,
  kind: SectionDTO["kind"],
  title: string,
  steps: StepDTO[],
  sizeLabel: string | null = null,
): SectionDTO {
  return { id, title, kind, sizeLabel, sortOrder: 0, steps };
}

function pattern(partial: Partial<PatternDTO> & Pick<PatternDTO, "sections">): PatternDTO {
  return {
    id: "p1",
    name: "Mütze",
    originalText: "",
    language: "de",
    meta: { ...emptyMeta(), sizes: ["S", "M"] },
    coverImage: null,
    category: null,
    lastSectionId: null,
    lastStepId: null,
    lastSize: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("resolveLastOpened", () => {
  const work = section("work-1", "work", "Kuppe", [step("s1", "1. Reihe"), step("s2", "2. Reihe")]);
  const sizeM = section("size-m", "size", "Größe M", [step("m1", "1. Runde")], "M");
  const montage = section("mon-1", "montage", "Montage", [step("mo1", "Nähen")]);

  it("starts at the first tab when nothing was saved", () => {
    const result = resolveLastOpened(pattern({ sections: [work, sizeM, montage] }));
    assert.equal(result.sectionId, "work-1");
    assert.equal(result.stepId, "s1");
    assert.equal(result.size, "S");
  });

  it("restores the last work step", () => {
    const result = resolveLastOpened(
      pattern({
        sections: [work, sizeM, montage],
        lastSectionId: "work-1",
        lastStepId: "s2",
        lastSize: "S",
      }),
    );
    assert.equal(result.sectionId, "work-1");
    assert.equal(result.stepId, "s2");
  });

  it("restores a size section together with the matching size filter", () => {
    const result = resolveLastOpened(
      pattern({
        sections: [work, sizeM, montage],
        lastSectionId: "size-m",
        lastStepId: "m1",
        lastSize: "S",
      }),
    );
    assert.equal(result.size, "M");
    assert.equal(result.sectionId, "size-m");
    assert.equal(result.stepId, "m1");
  });

  it("falls back when saved ids are gone", () => {
    const result = resolveLastOpened(
      pattern({
        sections: [work, sizeM, montage],
        lastSectionId: "missing",
        lastStepId: "gone",
        lastSize: "XL",
      }),
    );
    assert.equal(result.sectionId, "work-1");
    assert.equal(result.stepId, "s1");
    assert.equal(result.size, "S");
  });
});
