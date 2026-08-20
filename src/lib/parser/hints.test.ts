import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachHintsToSteps } from "./hints";

function step(rowKind: string, instruction: string, hints: string[] = []) {
  return { rowKind, instruction, hints };
}

describe("attachHintsToSteps", () => {
  it("folds trailing hinweis steps into the previous row", () => {
    const result = attachHintsToSteps([
      step("reihe", "20 fM"),
      step("hinweis", "Den Faden abschneiden."),
      step("hinweis", "Fadenende lang lassen."),
    ]);
    assert.equal(result.steps.length, 1);
    assert.equal(result.steps[0].rowKind, "reihe");
    assert.deepEqual(result.steps[0].hints, [
      "Den Faden abschneiden.",
      "Fadenende lang lassen.",
    ]);
  });

  it("attaches a leading hint to the next work step", () => {
    const result = attachHintsToSteps([
      step("hinweis", "Wenden."),
      step("runde", "6 fM"),
    ]);
    assert.equal(result.steps.length, 1);
    assert.deepEqual(result.steps[0].hints, ["Wenden."]);
  });

  it("keeps montage-only notes as their own steps", () => {
    const result = attachHintsToSteps([
      step("hinweis", "Fäden vernähen."),
      step("hinweis", "Mütze wenden."),
    ]);
    assert.equal(result.steps.length, 2);
    assert.match(result.steps[0].instruction, /vernähen/);
    assert.match(result.steps[1].instruction, /wenden/);
  });

  it("redirects folded hint step ids to the host step", () => {
    const result = attachHintsToSteps([
      { id: "host", rowKind: "reihe", instruction: "20 fM", hints: [] },
      { id: "hint", rowKind: "hinweis", instruction: "Faden abschneiden.", hints: [] },
    ]);
    assert.equal(result.hintRedirects.hint, "host");
  });
});
