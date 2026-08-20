import type { PatternLanguage, RowKind } from "./types";

export type RepeatSequence = {
  times: number;
  sequence: string;
};

export function extractExpectedStitches(text: string): {
  text: string;
  count: number | null;
} {
  const trimmed = text.trim();
  const match = trimmed.match(
    /(?:\s*\[=\s*(\d+)\s*M?\s*\]|\s*\[(\d+)\s*(?:hStb|fM|Stb|hdc|sc|dc|M|Maschen|sts?|stitches?)?\]|\s*\((\d+)\s*(?:M|Maschen|sts?|stitches?)?\))\s*$/i,
  );
  if (!match || match.index == null) return { text: trimmed, count: null };
  const count = Number(match[1] || match[2] || match[3]);
  return { text: trimmed.slice(0, match.index).trim(), count };
}

const MAL_WORDS: Array<[string, number]> = [
  ["zehnmal", 10],
  ["neunmal", 9],
  ["achtmal", 8],
  ["siebenmal", 7],
  ["sechsmal", 6],
  ["fuenfmal", 5],
  ["fünfmal", 5],
  ["viermal", 4],
  ["dreimal", 3],
  ["zweimal", 2],
  ["einmal", 1],
];

export function extractRepeatSequence(text: string): {
  text: string;
  repeat: RepeatSequence | null;
} {
  let result = text;
  let last: RepeatSequence | null = null;

  const wordAlt = MAL_WORDS.map(([w]) => w).join("|");
  const wordRe = new RegExp(`(?:${wordAlt}|(\\d+)\\s*-?\\s*mal)\\s*:\\s*\\(([^)]+)\\)`, "gi");
  result = result.replace(wordRe, (all, digits: string | undefined, seq: string, offset: number, src: string) => {
    const word = src.slice(offset).toLowerCase();
    const fromWord = MAL_WORDS.find(([w]) => word.startsWith(w));
    const times = digits ? Number(digits) : fromWord?.[1];
    if (!times || !seq) return all;
    last = { times, sequence: seq.trim() };
    return `${times}-mal wiederholen: (${seq.trim()})`;
  });

  const patterns: RegExp[] = [
    /(\d+)\s*[x×]\s*[\(\[]([^)\]]+)[)\]]/gi,
    /[\(\[]([^)\]]+)[)\]]\s*(?:[x×*]|mal)\s*(\d+)/gi,
    /\*([^*]+)\*\s*(?:wdh\.?|rep(?:eat)?|mal)\s*(\d+)/gi,
    /(\d+)\s*(?:mal|times)\s*[\(\[]([^)\]]+)[)\]]/gi,
  ];

  for (const re of patterns) {
    result = result.replace(re, (all, a: string, b: string) => {
      const times = Number(/^\d+$/.test(a) ? a : b);
      const sequence = (/^\d+$/.test(a) ? b : a).trim();
      if (!times || !sequence || /^\d+$/.test(sequence)) return all;
      last = { times, sequence };
      return `${times}-mal wiederholen: ${sequence}`;
    });
  }

  return { text: result, repeat: last };
}

export function extractRepeatPrevious(text: string): string | null {
  const match = text.match(
    /Die Reihe(?:n)?\s+(\d+)(?:\s*(?:bis|[–-])\s*(\d+))?\s+(?:wh\.?|wdh\.?|wiederholen)/i,
  );
  if (!match) return null;
  if (match[2]) return `Reihen ${match[1]}–${match[2]} wiederholen`;
  return `Reihe ${match[1]} wiederholen`;
}

export function isMetaLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^(?:Material(?:ien)?|Garn|Wolle|Nadel|Häkelnadel|Hook|Yarn|Abkürzungen|Abbreviations|Schwierigkeit|Größe|Size|Gauge|Maschenprobe|Zubehör)\s*:/i.test(t)) {
    return true;
  }
  if (/^[A-Za-zÄÖÜß]{1,12}\s*=\s+\S/.test(t) && t.length < 80) return true;
  return false;
}

export function isFoundationLine(line: string): boolean {
  const t = line.trim();
  return (
    /^(?:\d+\s*(?:Lm|LM|ch)\b|(?:Ch|LM|Lm)\s+\d+\b)/i.test(t) ||
    /\b(Fadenring|Zauberring|magic ring|magic circle)\b/i.test(t)
  );
}

export function friendlyLabel(opts: {
  kind: RowKind;
  rowFrom: number | null;
  rowTo: number | null;
  untitledIndex: number;
}): string {
  const { kind, rowFrom, rowTo, untitledIndex } = opts;
  if (rowFrom != null && rowTo != null) {
    const unit = kind === "runde" ? "Runde" : "Reihe";
    if (rowFrom === rowTo) return `${rowFrom}. ${unit}`;
    return `${rowFrom}–${rowTo}. ${unit}`;
  }
  if (kind === "anschlag") return untitledIndex > 1 ? `Anschlag ${untitledIndex}` : "Anschlag";
  if (kind === "montage") return untitledIndex > 1 ? `Montage ${untitledIndex}` : "Montage";
  return untitledIndex > 1 ? `Hinweis ${untitledIndex}` : "Hinweis";
}

export function rangeNote(
  rowFrom: number | null,
  rowTo: number | null,
  kind: RowKind,
  repeatPrevious?: string | null,
): string | null {
  if (rowFrom == null || rowTo == null || rowFrom === rowTo) {
    return repeatPrevious ?? null;
  }
  const n = rowTo - rowFrom + 1;
  const unit = kind === "runde" ? "Runden" : "Reihen";
  if (repeatPrevious) return `${n} ${unit} · ${repeatPrevious}`;
  return `${n} gleiche ${unit}`;
}

export function buildSummary(
  instruction: string,
  lang: PatternLanguage,
  extra: { expectedStitches: number | null; rangeNote: string | null },
): string {
  const first = instruction.split(/(?<=[.!?])\s+/)[0]?.trim() ?? instruction;
  const bits = [first.replace(/\.$/, "")];
  if (extra.rangeNote) bits.push(extra.rangeNote);
  if (extra.expectedStitches != null) {
    bits.push(
      lang === "de"
        ? `${extra.expectedStitches} Maschen`
        : `${extra.expectedStitches} stitches`,
    );
  }
  return bits.join(" · ");
}

export const KIND_META: Record<
  RowKind,
  { de: string; hint: string }
> = {
  anschlag: { de: "Anschlag", hint: "Start der Arbeit" },
  reihe: { de: "Reihe", hint: "Hin- und Rückreihe" },
  runde: { de: "Runde", hint: "In der Runde / Spirale" },
  hinweis: { de: "Hinweis", hint: "Faden, Wenden, Infos" },
  montage: { de: "Montage", hint: "Nähen, füllen, formen" },
};
