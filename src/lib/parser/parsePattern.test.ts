import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AMIGURUMI_DE, COLORWORK_RD, ERDBEERE_DE, PUMPKIN_DE, PUMPKIN_EN, SIZED_HAT } from "./examples";
import { detectLanguage, parsePattern } from "./parsePattern";

describe("parsePattern German pumpkin", () => {
  const parsed = parsePattern(PUMPKIN_DE);

  it("detects German and three sections", () => {
    assert.equal(detectLanguage(PUMPKIN_DE), "de");
    assert.equal(parsed.suggestedName, "Kleiner Kürbis");
    assert.deepEqual(
      parsed.sections.map((s) => s.title),
      ["Kleiner Kürbis", "Stiel", "Montage"],
    );
  });

  it("uses crochet-friendly labels and keeps turning with the repeating rows", () => {
    const main = parsed.sections[0];
    assert.equal(main.steps[0].label, "Anschlag");
    assert.match(main.steps[0].instruction, /21 LM = Luftmaschen/);
    assert.match(main.steps[0].instruction, /wenden/i);

    const row1 = main.steps.find((s) => s.label === "1. Reihe");
    assert.ok(row1);
    assert.match(row1!.instruction, /20 fM = Festmaschen/);

    const range = main.steps.find((s) => s.label === "2–40. Reihe");
    assert.ok(range);
    assert.equal(range!.rowFrom, 2);
    assert.equal(range!.rowTo, 40);
    assert.equal(range!.rangeNote, "39 gleiche Reihen");
    assert.match(range!.instruction, /Festmaschen/);
    assert.match(range!.instruction, /hintere/);
    assert.match(range!.instruction, /wenden/i);
  });

  it("attaches yarn-cut notes to the previous row instead of a separate step", () => {
    const range = parsed.sections[0].steps.find((s) => s.label === "2–40. Reihe");
    assert.ok(range);
    assert.equal(
      parsed.sections[0].steps.some((s) => s.rowKind === "hinweis"),
      false,
    );
    assert.ok(range!.hints.some((h) => /Faden abschneiden/i.test(h)));
    assert.ok(range!.hints.some((h) => /Fadenende/i.test(h)));
  });

  it("fixes hyphenated line breaks", () => {
    const all = parsed.sections
      .flatMap((s) => s.steps.flatMap((st) => [st.instruction, ...st.hints]))
      .join(" ");
    assert.match(all, /krümmt/);
    assert.match(all, /Kürbisform/);
  });
});

describe("parsePattern English pumpkin", () => {
  const parsed = parsePattern(PUMPKIN_EN);

  it("detects English and maps section tabs to German UI names", () => {
    assert.equal(detectLanguage(PUMPKIN_EN), "en");
    assert.equal(parsed.suggestedName, "Little Pumpkin");
    assert.deepEqual(
      parsed.sections.map((s) => s.title),
      ["Little Pumpkin", "Stiel", "Montage"],
    );
  });

  it("expands US abbreviations with German stitch names", () => {
    const main = parsed.sections[0];
    assert.match(main.steps[0].instruction, /21 ch = chain/i);
    assert.match(main.steps[0].instruction, /Luftmaschen/i);

    const range = main.steps.find((s) => s.label === "2–40. Reihe");
    assert.ok(range);
    assert.match(range!.instruction, /sc = single crochet/i);
    assert.match(range!.instruction, /feste Masche/i);
    assert.match(range!.instruction, /back loop only|blo/i);
  });
});

describe("parsePattern amigurumi rounds", () => {
  const parsed = parsePattern(AMIGURUMI_DE);
  const steps = parsed.sections[0].steps;

  it("reads round numbers, stitch counts and in-round repeats", () => {
    assert.equal(steps[0].label, "1. Runde");
    assert.equal(steps[0].expectedStitches, 6);
    assert.equal(steps[1].expectedStitches, 12);
    assert.match(steps[2].instruction, /6-mal wiederholen/i);
    assert.equal(steps[2].expectedStitches, 18);
    assert.equal(steps[3].label, "4–6. Runde");
    assert.equal(steps[3].expectedStitches, 18);
    assert.equal(steps[3].rangeNote, "3 gleiche Runden");
  });
});

describe("round abbreviations", () => {
  const cases: Array<{ line: string; from: number; to: number; kind: "runde" | "reihe" }> = [
    { line: "1. Rd: 6 fM (6)", from: 1, to: 1, kind: "runde" },
    { line: "1. Rd.: 6 fM (6)", from: 1, to: 1, kind: "runde" },
    { line: "1. rd. 6 fM in den Fadenring (6)", from: 1, to: 1, kind: "runde" },
    { line: "Rd. 2: 6 Zunahmen (12)", from: 2, to: 2, kind: "runde" },
    { line: "rd 3: (1 fM, 1 Zunahme) x 6 (18)", from: 3, to: 3, kind: "runde" },
    { line: "Runden 4–6: 18 fM (18)", from: 4, to: 6, kind: "runde" },
    { line: "2.–5. Rd. 18 fM (18)", from: 2, to: 5, kind: "runde" },
    { line: "3 rd: 12 fM (12)", from: 3, to: 3, kind: "runde" },
    { line: "1. R: 20 fM", from: 1, to: 1, kind: "reihe" },
  ];

  for (const item of cases) {
    it(`parses "${item.line}" as ${item.kind} ${item.from}–${item.to}`, () => {
      const parsed = parsePattern(`Teil:\n${item.line}`);
      const step = parsed.sections[0]?.steps[0];
      assert.ok(step, `no step for ${item.line}`);
      assert.equal(step.rowKind, item.kind);
      assert.equal(step.rowFrom, item.from);
      assert.equal(step.rowTo, item.to);
      if (item.kind === "runde") {
        assert.match(step.label, /Runde/);
      } else {
        assert.match(step.label, /Reihe/);
      }
    });
  }
});

describe("colorwork Rd pattern", () => {
  const parsed = parsePattern(COLORWORK_RD);
  const steps = parsed.sections[0].steps;

  it("reads Rd prefix, bracket stitch counts and color stitches", () => {
    const rd1 = steps.find((s) => s.label === "1. Runde");
    assert.ok(rd1);
    assert.equal(rd1!.expectedStitches, 111);
    assert.match(rd1!.instruction, /hStb/);
    assert.match(rd1!.instruction, /Anfangs-Luftmaschen/i);

    const rd43 = steps.find((s) => s.label === "43. Runde");
    assert.ok(rd43);
    assert.match(rd43!.instruction, /4-mal wiederholen/);
    assert.match(rd43!.instruction, /Farbe A/);
    assert.match(rd43!.instruction, /Farbe B/);
  });

  it("treats glued 5hStbA and achtmal as colorwork repeats", () => {
    const rd47 = steps.find((s) => s.label === "47. Runde");
    assert.ok(rd47);
    assert.match(rd47!.instruction, /5 hStbA|5hStbA|5 hStb A/i);
    assert.match(rd47!.instruction, /8-mal wiederholen/);
  });

  it("turns wh. into a repeat of previous rows", () => {
    const rd3 = steps.find((s) => s.label === "3–42. Runde");
    assert.ok(rd3);
    assert.match(rd3!.instruction, /wiederholen/i);
    assert.match(rd3!.rangeNote ?? "", /Reihe 2/);
    assert.equal(rd3!.rowFrom, 3);
    assert.equal(rd3!.rowTo, 42);
  });

  it("parses the last decrease row", () => {
    const last = steps.find((s) => /Letzte Reihe/i.test(s.label));
    assert.ok(last);
    assert.match(last!.instruction, /zusammenhäkeln/i);
  });

  it("attaches the VS/RS note to the repeating rounds", () => {
    const rd68 = steps.find((s) => s.label === "68–92. Runde");
    assert.ok(rd68);
    assert.ok(rd68!.hints.some((h) => /VS.*RS/i.test(h) && /vertauscht/i.test(h)));
  });
});

describe("sizes, montage and general info", () => {
  const parsed = parsePattern(SIZED_HAT);

  it("keeps materials out of the crochet tabs", () => {
    assert.equal(parsed.meta.hook, "4,0 mm");
    assert.match(parsed.meta.yarnAmount ?? "", /50/);
    assert.equal(parsed.meta.height, "18 (20, 22) cm");
    assert.deepEqual(parsed.meta.sizes, ["S", "M", "L"]);
    const allText = parsed.sections.flatMap((s) => s.steps.map((st) => st.instruction)).join(" ");
    assert.doesNotMatch(allText, /Häkelnadel/);
    assert.doesNotMatch(allText, /Wollmenge/);
  });

  it("separates size sections from montage", () => {
    const kinds = parsed.sections.map((s) => s.kind);
    assert.ok(kinds.includes("size"));
    assert.ok(kinds.includes("montage"));
    const montage = parsed.sections.find((s) => s.kind === "montage");
    assert.equal(montage?.title, "Montage");
    const sizeS = parsed.sections.find((s) => s.sizeLabel === "S");
    assert.ok(sizeS);
    assert.match(sizeS!.steps[0].instruction, /Fadenring/);
  });
});

describe("amigurumi parts like Erdbeere", () => {
  const parsed = parsePattern(ERDBEERE_DE, "Erdbeere");

  it("splits cheeks, berry, leaves and finishing", () => {
    const titles = parsed.sections.map((s) => s.title);
    assert.ok(titles.some((t) => /Bäckchen/i.test(t)));
    assert.ok(titles.some((t) => /Erdbeere/i.test(t) && /Rot/i.test(t)));
    assert.ok(titles.some((t) => /Großes Blatt/i.test(t)));
    assert.ok(titles.some((t) => /Kleines Blatt/i.test(t)));
    assert.ok(parsed.sections.some((s) => s.kind === "montage"));
  });

  it("keeps table of contents and abbreviations out of the crochet tabs", () => {
    const all = parsed.sections.flatMap((s) => s.steps.map((st) => st.instruction)).join(" ");
    assert.doesNotMatch(all, /Inhaltsverzeichnis/);
    assert.doesNotMatch(all, /fM = feste/);
    assert.doesNotMatch(all, /Das Material für die Erdbeeren/);
  });

  it("reads Runde 9+10 as a range and keeps leaf rounds on the leaf part", () => {
    const berry = parsed.sections.find((s) => /Erdbeere/i.test(s.title) && /Rot/i.test(s.title));
    assert.ok(berry);
    const range = berry!.steps.find((s) => s.rowFrom === 9 && s.rowTo === 10);
    assert.ok(range);
    const bigLeaf = parsed.sections.find((s) => /Großes Blatt/i.test(s.title));
    assert.ok(bigLeaf);
    assert.ok(bigLeaf!.steps.some((s) => s.rowFrom === 1));
    assert.ok(bigLeaf!.steps.some((s) => s.rowFrom === 2));
  });

  it("extracts hook and finished size into Allgemein", () => {
    assert.equal(parsed.meta.hook, "2,5 mm");
    assert.match(parsed.meta.height ?? "", /12 cm/);
  });
});
