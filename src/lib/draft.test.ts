import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankStep, patchStep, sanitizeParsedPattern } from "./draft";
import { parsePattern } from "./parser/parsePattern";
import { PUMPKIN_DE } from "./parser/examples";

describe("sanitizeParsedPattern", () => {
  it("keeps corrected labels and stitch counts", () => {
    const parsed = parsePattern(PUMPKIN_DE);
    parsed.sections[0].steps[0].label = "Startkette";
    parsed.sections[0].steps[0].expectedStitches = 21;
    const clean = sanitizeParsedPattern(parsed, "Kürbis", "de");
    assert.equal(clean.sections[0].steps[0].label, "Startkette");
    assert.equal(clean.sections[0].steps[0].expectedStitches, 21);
    const range = clean.sections[0].steps.find((s) => s.label === "2–40. Reihe");
    assert.ok(range);
    assert.ok(range!.hints.some((h) => /Faden abschneiden/i.test(h)));
  });

  it("rejects an empty draft", () => {
    assert.throws(
      () => sanitizeParsedPattern({ sections: [] }, "X", "de"),
      /keine Schritte/,
    );
  });

  it("defaults empty instructions to Mache on save", () => {
    const clean = sanitizeParsedPattern(
      {
        sections: [
          {
            title: "Teil",
            kind: "work",
            steps: [{ rowKind: "reihe", rowFrom: 1, rowTo: 1, label: "1. Reihe", instruction: "", original: "" }],
          },
        ],
      },
      "Test",
      "de",
    );
    assert.equal(clean.sections[0].steps[0].instruction, "Mache");
  });

  it("starts blank steps as 1. Reihe", () => {
    const step = blankStep();
    assert.equal(step.label, "1. Reihe");
    assert.equal(step.rowFrom, 1);
    assert.equal(step.rowTo, 1);
  });
});

describe("patchStep", () => {
  it("updates auto labels when the row range changes", () => {
    const parsed = parsePattern(PUMPKIN_DE);
    const row = parsed.sections[0].steps.find((s) => s.label === "1. Reihe");
    assert.ok(row);
    const next = patchStep(row!, { rowFrom: 3, rowTo: 3 }, "de");
    assert.equal(next.label, "3. Reihe");
  });

  it("updates auto label to a row range", () => {
    const step = blankStep({ rowKind: "reihe", rowFrom: 1, rowTo: 1 });
    const next = patchStep(step, { rowTo: 21 }, "de");
    assert.equal(next.label, "1–21. Reihe");
  });

  it("fixes legacy Hinweis label on reihe steps when the range changes", () => {
    const step = blankStep({ rowKind: "reihe", rowFrom: 1, rowTo: 1, label: "Hinweis" });
    const next = patchStep(step, { rowTo: 21 }, "de");
    assert.equal(next.label, "1–21. Reihe");
  });

  it("keeps a custom label", () => {
    const parsed = parsePattern(PUMPKIN_DE);
    const row = parsed.sections[0].steps.find((s) => s.label === "1. Reihe");
    assert.ok(row);
    const custom = patchStep(row!, { label: "Rand" }, "de");
    const next = patchStep(custom, { rowFrom: 8, rowTo: 8 }, "de");
    assert.equal(next.label, "Rand");
  });
});
