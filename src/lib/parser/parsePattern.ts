import { expandInstruction } from "./abbreviations";
import {
  buildSummary,
  extractExpectedStitches,
  extractRepeatPrevious,
  extractRepeatSequence,
  friendlyLabel,
  isFoundationLine,
  isMetaLine,
  rangeNote,
} from "./enrich";
import { normalizePatternText } from "./normalize";
import {
  applyMetaLine,
  classifySection,
  emptyMeta,
  extractLooseMeta,
  parseMetaLine,
  parseSizeHeader,
} from "./meta";
import { attachHintsToSteps } from "./hints";
import { looksLikeRowStart, parseRowLine } from "./rows";
import { displaySectionTitle, isIntroNoise, isSectionHeader } from "./sections";
import type {
  ParsedPattern,
  ParsedSection,
  ParsedStep,
  PatternLanguage,
  RowKind,
} from "./types";

export function detectLanguage(text: string): PatternLanguage {
  const deHits =
    (text.match(
      /\b(häkeln|häkle|Reihe|Runde|Luftmasche|Festmasche|Stäbchen|wenden|Masche|zusammennähen|Fadenende|Füllwatte)\b/gi,
    ) || []).length +
    (text.match(/\d+\s*(?:fM|Lm|hStb|Stb)\b/g) || []).length +
    (text.match(/\d+\.\s*(?:–\s*\d+\.\s*)?(?:R|Rd|Runde)/gi) || []).length;

  const enHits =
    (text.match(
      /\b(chain|single crochet|double crochet|fasten off|magic ring|magic circle|stuff|sew|turn)\b/gi,
    ) || []).length +
    (text.match(/\b(sc|hdc|dc|ch|sl\s*st|blo|flo)\b/gi) || []).length +
    (text.match(/\b(Rnd|Rnds|Row|Rows|Round|Rounds)\s+\d+/gi) || []).length;

  return enHits > deHits ? "en" : "de";
}

function splitTrailing(body: string): { main: string; trailing: string[] } {
  let rest = body.trim();
  const trailing: string[] = [];

  const cut = rest.match(
    /^(.*?[.!?])\s+(?=(?:Den Faden abschneiden|Faden abschneiden|Cut (?:the )?yarn|Fasten off))/i,
  );
  if (cut) {
    trailing.push(rest.slice(cut[1].length).trim());
    rest = cut[1].trim();
  } else {
    const cutComma = rest.match(
      /^(.*?),\s+(?=(?:den Faden abschneiden|Faden abschneiden|cut (?:the )?yarn|fasten off))/i,
    );
    if (cutComma) {
      trailing.push(rest.slice(cutComma[1].length).replace(/^,\s*/, "").trim());
      rest = cutComma[1].trim();
    }
  }

  const afterRepeat = rest.match(/^(.*?wh\.)\s+([A-ZÄÖÜ].+)$/i)
    || rest.match(/^(.*?wiederholen\.)\s+([A-ZÄÖÜ].+)$/i);
  if (afterRepeat) {
    trailing.unshift(afterRepeat[2].trim());
    rest = afterRepeat[1].trim();
  }

  return { main: rest, trailing: trailing.filter(Boolean) };
}

function splitProse(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"“])/)
    .map((p) => p.trim())
    .filter(Boolean);
  const merged: string[] = [];
  for (const part of parts) {
    const merge =
      merged.length > 0 &&
      /^(Dabei|Dazu|Dafür|Anschließend|Diesen Vorgang|Dadurch|Das Fadenende|Leave a long|Leave the tail|The yarn|This process|Repeat this)\b/i.test(
        part,
      );
    if (merge) {
      merged[merged.length - 1] += ` ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

function extractTitle(lines: string[]): { title: string | null; start: number } {
  const index = lines.findIndex((l) => {
    const t = l.trim();
    return t && !parseMetaLine(t) && !isIntroNoise(t);
  });
  if (index < 0) return { title: null, start: 0 };
  const first = lines[index].trim();
  if (isSectionHeader(first) && !/kürbis|pumpkin|anleitung|pattern/i.test(first)) {
    return { title: null, start: index };
  }
  if (parseSizeHeader(first)) return { title: null, start: index };
  if (
    first.length < 80 &&
    /:$/.test(first) &&
    !looksLikeRowStart(first) &&
    !parseRowLine(first) &&
    !parseMetaLine(first)
  ) {
    return { title: first.replace(/:$/, "").trim(), start: index + 1 };
  }
  return { title: null, start: index };
}

function splitSections(
  lines: string[],
  start: number,
  fallbackTitle: string,
  meta: ReturnType<typeof emptyMeta>,
): { title: string; bodyLines: string[] }[] {
  const sections: { title: string; bodyLines: string[] }[] = [];
  let currentTitle = fallbackTitle;
  let current: string[] = [];
  let started = false;

  const flush = () => {
    const body = current.join("\n").trim();
    if (!body && !started) return;
    sections.push({ title: currentTitle, bodyLines: [...current] });
    current = [];
  };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (applyMetaLine(meta, line) || extractLooseMeta(meta, line)) continue;
    if (isIntroNoise(line)) continue;
    if (isSectionHeader(line)) {
      if (started || current.some((l) => l.trim())) flush();
      currentTitle = displaySectionTitle(line, line.trim());
      started = true;
      continue;
    }
    if (!started && !looksLikeRowStart(line) && !isFoundationLine(line)) {
      continue;
    }
    current.push(line);
    if (line.trim()) started = true;
  }
  flush();
  return sections.filter((s) => s.bodyLines.some((l) => l.trim()));
}

function assemblyKind(text: string): RowKind {
  if (
    /\b(nähen|festnähen|zusammennähen|ausstopfen|formen|vernähen|sew|stuff|shape|weave in)\b/i.test(
      text,
    )
  ) {
    return "montage";
  }
  return "hinweis";
}

function kindFromLast(token: string): "reihe" | "runde" {
  return /rd|runde/i.test(token) ? "runde" : "reihe";
}

function untitledIndexFor(kind: RowKind, counts: Record<string, number>): number {
  counts[kind] = (counts[kind] ?? 0) + 1;
  return counts[kind];
}

function buildStep(opts: {
  original: string;
  lang: PatternLanguage;
  kind: RowKind;
  rowFrom: number | null;
  rowTo: number | null;
  untitledIndex: number;
}): ParsedStep {
  const { original, lang, kind, rowFrom, rowTo, untitledIndex } = opts;
  const counted = extractExpectedStitches(original);
  const repeated = extractRepeatSequence(counted.text);
  const { instruction, abbreviations } = expandInstruction(repeated.text, lang);
  const previous = extractRepeatPrevious(repeated.text) ?? extractRepeatPrevious(instruction);
  const note = rangeNote(rowFrom, rowTo, kind, previous);
  const label = friendlyLabel({ kind, rowFrom, rowTo, untitledIndex });

  return {
    label,
    summary: buildSummary(instruction, lang, {
      expectedStitches: counted.count,
      rangeNote: note,
    }),
    original: original.trim(),
    rowFrom,
    rowTo,
    rowKind: kind,
    instruction,
    abbreviations,
    expectedStitches: counted.count,
    rangeNote: note,
    hints: [],
  };
}

function parseSectionBody(body: string, lang: PatternLanguage): ParsedStep[] {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const steps: ParsedStep[] = [];
  const counts: Record<string, number> = {};
  const metaBuffer: string[] = [];

  const flushMeta = () => {
    if (!metaBuffer.length) return;
    steps.push(
      buildStep({
        original: metaBuffer.join("\n"),
        lang,
        kind: "hinweis",
        rowFrom: null,
        rowTo: null,
        untitledIndex: untitledIndexFor("hinweis", counts),
      }),
    );
    metaBuffer.length = 0;
  };

  for (const line of lines) {
    if (parseMetaLine(line) || (isMetaLine(line) && !parseRowLine(line) && !isFoundationLine(line))) {
      metaBuffer.push(line);
      continue;
    }
    flushMeta();

    const row = parseRowLine(line);
    if (row) {
      const { main, trailing } = splitTrailing(row.body || line);
      const mainText = main || row.body;
      steps.push(
        buildStep({
          original: mainText,
          lang,
          kind: row.kind,
          rowFrom: row.from,
          rowTo: row.to,
          untitledIndex: 1,
        }),
      );
      for (const extra of trailing) {
        steps.push(
          buildStep({
            original: extra,
            lang,
            kind: "hinweis",
            rowFrom: null,
            rowTo: null,
            untitledIndex: untitledIndexFor("hinweis", counts),
          }),
        );
      }
      continue;
    }

    const last = line.match(/^Letzte\s+(Reihe|Runde|Rd\.?)\s*:?\s*(.*)$/i);
    if (last) {
      const lastKind = kindFromLast(last[1]);
      const { main, trailing } = splitTrailing(last[2] || line);
      const step = buildStep({
        original: main || last[2] || line,
        lang,
        kind: lastKind,
        rowFrom: null,
        rowTo: null,
        untitledIndex: untitledIndexFor(lastKind, counts),
      });
      step.label = `Letzte ${lastKind === "runde" ? "Runde" : "Reihe"}`;
      steps.push(step);
      for (const extra of trailing) {
        steps.push(
          buildStep({
            original: extra,
            lang,
            kind: "hinweis",
            rowFrom: null,
            rowTo: null,
            untitledIndex: untitledIndexFor("hinweis", counts),
          }),
        );
      }
      continue;
    }

    if (isFoundationLine(line)) {
      const kind: RowKind = /\b(Fadenring|Zauberring|magic ring|magic circle)\b/i.test(line)
        ? "runde"
        : "anschlag";
      steps.push(
        buildStep({
          original: line,
          lang,
          kind,
          rowFrom: kind === "runde" ? 1 : null,
          rowTo: kind === "runde" ? 1 : null,
          untitledIndex: untitledIndexFor("anschlag", counts),
        }),
      );
      continue;
    }

    for (const sentence of splitProse(line)) {
      const kind = assemblyKind(sentence);
      steps.push(
        buildStep({
          original: sentence,
          lang,
          kind,
          rowFrom: null,
          rowTo: null,
          untitledIndex: untitledIndexFor(kind, counts),
        }),
      );
    }
  }

  flushMeta();
  return attachHintsToSteps(steps).steps;
}

export function parsePattern(text: string, fallbackName?: string): ParsedPattern {
  const language = detectLanguage(text);
  const normalized = normalizePatternText(text);
  const lines = normalized.split("\n");
  const meta = emptyMeta();
  const { title, start } = extractTitle(lines);
  const suggestedName = title || fallbackName || null;
  const fallbackTitle = suggestedName || "Hauptteil";
  const rawSections = splitSections(lines, start, fallbackTitle, meta);

  const sections: ParsedSection[] = rawSections.map((section) => {
    const classified = classifySection(section.title);
    if (classified.sizeLabel && !meta.sizes.includes(classified.sizeLabel)) {
      meta.sizes.push(classified.sizeLabel);
    }
    return {
      title: classified.sizeLabel
        ? `Größe ${classified.sizeLabel}`
        : section.title,
      kind: classified.kind,
      sizeLabel: classified.sizeLabel,
      steps: parseSectionBody(section.bodyLines.join("\n"), language),
    };
  });

  return {
    suggestedName,
    language,
    meta,
    sections: sections.filter((s) => s.steps.length > 0),
  };
}
