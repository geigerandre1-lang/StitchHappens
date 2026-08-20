import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { patchStep, sanitizeParsedPattern } from "./draft";
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
});

describe("patchStep", () => {
  it("updates auto labels when the row range changes", () => {
    const parsed = parsePattern(PUMPKIN_DE);
    const row = parsed.sections[0].steps.find((s) => s.label === "1. Reihe");
    assert.ok(row);
    const next = patchStep(row!, { rowFrom: 3, rowTo: 3 }, "de");
    assert.equal(next.label, "3. Reihe");
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
