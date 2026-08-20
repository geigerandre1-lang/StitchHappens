import type { FoundAbbreviation, PatternLanguage, StitchDef } from "./types";

export const STITCH_DEFS: StitchDef[] = [
  {
    keys: ["sl\\s*sts?", "slst", "ss"],
    canon: "sl st",
    de: "Kettmasche",
    dePl: "Kettmaschen",
    en: "slip stitch",
    enPl: "slip stitches",
  },
  {
    keys: ["hStb", "hSt"],
    canon: "hStb",
    de: "halbes Stäbchen",
    dePl: "halbe Stäbchen",
    en: "half double crochet",
    enPl: "half double crochet",
  },
  {
    keys: ["DStb", "dStb", "2er\\s*Stb"],
    canon: "DStb",
    de: "Doppelstäbchen",
    dePl: "Doppelstäbchen",
    en: "treble crochet",
    enPl: "treble crochet",
  },
  {
    keys: ["htr"],
    canon: "htr",
    de: "halbes Stäbchen",
    dePl: "halbe Stäbchen",
    en: "half treble (UK)",
    enPl: "half treble (UK)",
  },
  {
    keys: ["hdc"],
    canon: "hdc",
    de: "halbes Stäbchen",
    dePl: "halbe Stäbchen",
    en: "half double crochet",
    enPl: "half double crochet",
  },
  {
    keys: ["dtr"],
    canon: "dtr",
    de: "Dreifachstäbchen",
    dePl: "Dreifachstäbchen",
    en: "double treble",
    enPl: "double treble",
  },
  {
    keys: ["vfM"],
    canon: "vfM",
    de: "verlängerte feste Masche",
    dePl: "verlängerte feste Maschen",
    en: "extended single crochet",
    enPl: "extended single crochet",
  },
  {
    keys: ["fM", "FM"],
    canon: "fM",
    de: "Festmasche",
    dePl: "Festmaschen",
    en: "single crochet",
    enPl: "single crochet",
  },
  {
    keys: ["Stb"],
    canon: "Stb",
    de: "Stäbchen",
    dePl: "Stäbchen",
    en: "double crochet",
    enPl: "double crochet",
  },
  {
    keys: ["sc"],
    canon: "sc",
    de: "feste Masche",
    dePl: "feste Maschen",
    en: "single crochet",
    enPl: "single crochet",
  },
  {
    keys: ["dc"],
    canon: "dc",
    de: "Stäbchen",
    dePl: "Stäbchen",
    en: "double crochet (US)",
    enPl: "double crochet (US)",
  },
  {
    keys: ["tr"],
    canon: "tr",
    de: "Doppelstäbchen",
    dePl: "Doppelstäbchen",
    en: "treble crochet",
    enPl: "treble crochet",
  },
  {
    keys: ["ch"],
    canon: "ch",
    de: "Luftmasche",
    dePl: "Luftmaschen",
    en: "chain",
    enPl: "chain stitches",
  },
  {
    keys: ["W-?L[Mm]", "Wlm"],
    canon: "Wlm",
    de: "Wendeluftmasche",
    dePl: "Wendeluftmaschen",
    en: "turning chain",
    enPl: "turning chains",
  },
  {
    keys: ["Lfm", "Luftm\\.?", "Lm", "LM"],
    canon: "LM",
    de: "Luftmasche",
    dePl: "Luftmaschen",
    en: "chain",
    enPl: "chain stitches",
  },
  {
    keys: ["Ktm", "kM", "Km", "KM"],
    canon: "Km",
    de: "Kettmasche",
    dePl: "Kettmaschen",
    en: "slip stitch",
    enPl: "slip stitches",
  },
];

export const TECHNIQUE_DEFS: { keys: string[]; canon: string; de: string; en: string }[] = [
  { keys: ["blo", "BLO", "hMG", "hMg"], canon: "blo", de: "hinteres Maschenglied", en: "back loop only" },
  { keys: ["flo", "FLO", "vMG", "vMg"], canon: "flo", de: "vorderes Maschenglied", en: "front loop only" },
  { keys: ["uAbn"], canon: "uAbn", de: "unsichtbare Abnahme", en: "invisible decrease" },
  { keys: ["invdec"], canon: "invdec", de: "unsichtbare Abnahme", en: "invisible decrease" },
  { keys: ["inc", "Zunahmen", "Zunahme"], canon: "inc", de: "Zunahme", en: "increase" },
  { keys: ["dec", "Abnahmen", "Abnahme"], canon: "dec", de: "Abnahme", en: "decrease" },
  { keys: ["tog"], canon: "tog", de: "zusammen", en: "together" },
  { keys: ["yo", "YO"], canon: "yo", de: "Umschlag", en: "yarn over" },
  { keys: ["wdh", "wh"], canon: "wdh", de: "wiederholen", en: "repeat" },
  { keys: ["abn"], canon: "abn", de: "Abnahme", en: "decrease" },
  { keys: ["zun"], canon: "zun", de: "Zunahme", en: "increase" },
  { keys: ["MR", "mr"], canon: "MR", de: "magischer Ring", en: "magic ring" },
  { keys: ["FR"], canon: "FR", de: "Fadenring", en: "magic ring" },
  { keys: ["VS"], canon: "VS", de: "Vorderseite", en: "right side" },
  { keys: ["RS"], canon: "RS", de: "Rückseite", en: "wrong side" },
];

export const GLOSSARY = [
  ...STITCH_DEFS.map((d) => ({
    abbr: d.canon,
    de: d.dePl,
    en: d.enPl,
  })),
  ...TECHNIQUE_DEFS.map((d) => ({
    abbr: d.canon,
    de: d.de,
    en: d.en,
  })),
  { abbr: "R / Rh", de: "Reihe", en: "row" },
  { abbr: "Rd", de: "Runde", en: "round" },
  { abbr: "Rnd", de: "Runde", en: "round" },
  { abbr: "wh / wdh", de: "wiederholen", en: "repeat" },
  { abbr: "VS", de: "Vorderseite", en: "right side" },
  { abbr: "RS", de: "Rückseite", en: "wrong side" },
];

function keyAlternation(keys: string[]): string {
  return keys.join("|");
}

function stitchAlt(): string {
  return STITCH_DEFS.flatMap((d) => d.keys).join("|");
}

function isSimpleLeadRest(rest: string): boolean {
  const t = rest.trim();
  if (/\b(viermal|dreimal|achtmal|zweimal|zehnmal|sechsmal|wh\.?)\b/i.test(t)) return false;
  if (/(?:hStb|fM|Stb|hdc|sc|dc)[A-Z]\b/.test(t)) return false;
  if (/\d+(?:hStb|fM|Stb)[A-Z]?\b/i.test(t)) return false;
  return true;
}

function expandSpecials(text: string, found: FoundAbbreviation[]): string {
  let result = text;
  result = result.replace(/Anf-(\d+)-L[Mm]\b/gi, (_all, n: string) => {
    found.push({
      abbr: `Anf-${n}-LM`,
      meaning: "Anfangs-Luftmaschen (zählen nicht als Masche)",
      count: Number(n),
    });
    return `Anf-${n}-LM (Anfangs-Luftmaschen, zählen nicht)`;
  });
  result = result.replace(/\bRe?(\d+)\s*zus\b/gi, (_all, n: string) => {
    found.push({ abbr: `${n}zus`, meaning: `${n} Maschen zusammenhäkeln`, count: Number(n) });
    return `${n} Maschen zusammenhäkeln`;
  });
  result = result.replace(/\bwh\.(?=\s|$)/gi, () => {
    found.push({ abbr: "wh", meaning: "wiederholen", count: null });
    return "wiederholen";
  });
  return result;
}

function expandStitchesInline(
  text: string,
  lang: PatternLanguage,
  found: FoundAbbreviation[],
): string {
  const alt = stitchAlt();
  const re = new RegExp(
    `(?<![A-Za-zÄÖÜäöüß])(\\d+)?\\s*(${alt})([A-Z])?(?![A-Za-zÄÖÜäöüß])(?!\\s*\\()`,
    "g",
  );
  return text.replace(re, (all, countRaw: string | undefined, stitch: string, color: string | undefined) => {
    if (/\(.*\)/.test(all)) return all;
    const def = findDef(stitch);
    if (!def) return all;
    const count = countRaw ? Number(countRaw) : null;
    const meaning = stitchMeaning(def, count, lang);
    const colorBit = color ? `, Farbe ${color}` : "";
    found.push({
      abbr: `${def.canon}${color ?? ""}`,
      meaning: color ? `${meaning}, Farbe ${color}` : meaning,
      count,
    });
    const label = `${count != null ? `${count} ` : ""}${def.canon}${color ?? ""}`;
    if (all.includes("(") || all.includes("=")) return all;
    return `${label} (${meaning}${colorBit})`;
  });
}

export function stitchMeaning(def: StitchDef, count: number | null, lang: PatternLanguage): string {
  const plural = count !== 1;
  if (lang === "de") {
    return plural ? def.dePl : def.de;
  }
  const en = plural ? def.enPl : def.en;
  const de = plural ? def.dePl : def.de;
  return `${en} / ${de}`;
}

function findDef(token: string): StitchDef | undefined {
  const t = token.trim();
  return STITCH_DEFS.find((def) =>
    def.keys.some((key) => new RegExp(`^(?:${key})$`, "i").test(t)),
  );
}

type LeadMatch = {
  prefix: string;
  count: number;
  def: StitchDef;
  rest: string;
};

function matchLeadingStitch(text: string): LeadMatch | null {
  const alt = STITCH_DEFS.flatMap((d) => d.keys).join("|");
  const mit = text.match(
    new RegExp(`^(Mit\\s+)(\\d+)\\s*(${alt})\\b(.*)$`, "i"),
  );
  if (mit) {
    const def = findDef(mit[3]);
    if (def) {
      return { prefix: mit[1], count: Number(mit[2]), def, rest: mit[4] };
    }
  }

  const numbered = text.match(new RegExp(`^(\\d+)\\s*(${alt})\\b(.*)$`, "i"));
  if (numbered) {
    const def = findDef(numbered[2]);
    if (def) {
      return { prefix: "", count: Number(numbered[1]), def, rest: numbered[3] };
    }
  }

  const prefixed = text.match(new RegExp(`^(${alt})\\s+(\\d+)\\b[:,]?\\s*(.*)$`, "i"));
  if (prefixed) {
    const def = findDef(prefixed[1]);
    if (def) {
      return { prefix: "", count: Number(prefixed[2]), def, rest: prefixed[3] };
    }
  }

  return null;
}

function expandTechniques(text: string, lang: PatternLanguage, found: FoundAbbreviation[]): string {
  let result = text;
  for (const tech of TECHNIQUE_DEFS) {
    const re = new RegExp(`\\b(?:${keyAlternation(tech.keys)})\\b`, "gi");
    if (!re.test(result)) continue;
    const alreadyExplained =
      result.toLowerCase().includes(tech.de.toLowerCase()) ||
      result.toLowerCase().includes(tech.en.toLowerCase());
    if (alreadyExplained) continue;
    const meaning = lang === "de" ? tech.de : `${tech.en} / ${tech.de}`;
    found.push({ abbr: tech.canon, meaning, count: null });
    result = result.replace(re, `${tech.canon} (${meaning})`);
  }
  return result;
}

function collectFromText(text: string, lang: PatternLanguage): FoundAbbreviation[] {
  const found: FoundAbbreviation[] = [];
  const alt = stitchAlt();
  const re = new RegExp(
    `(?<![A-Za-zÄÖÜäöüß])(\\d+)?\\s*(${alt})([A-Z])?(?![A-Za-zÄÖÜäöüß])`,
    "gi",
  );
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const def = findDef(match[2]);
    if (!def) continue;
    const count = match[1] ? Number(match[1]) : null;
    const color = match[3];
    const meaning = stitchMeaning(def, count, lang);
    found.push({
      abbr: `${def.canon}${color ?? ""}`,
      meaning: color ? `${meaning}, Farbe ${color}` : meaning,
      count,
    });
  }
  return found;
}

function uniqueAbbrs(items: FoundAbbreviation[]): FoundAbbreviation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.abbr}:${item.count ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function expandInstruction(
  raw: string,
  lang: PatternLanguage,
): { instruction: string; abbreviations: FoundAbbreviation[] } {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  const found: FoundAbbreviation[] = [];
  let working = expandSpecials(trimmed, found);
  const lead = matchLeadingStitch(working);

  if (lead && isSimpleLeadRest(lead.rest)) {
    found.push({
      abbr: lead.def.canon,
      meaning: stitchMeaning(lead.def, lead.count, lang),
      count: lead.count,
    });
    let rest = lead.rest.replace(/^[,:]\s*/, "").trim();
    rest = expandTechniques(rest, lang, found);
    rest = expandStitchesInline(rest, lang, found);
    found.push(...collectFromText(rest, lang));

    if (lang === "de") {
      rest = rest.replace(/^häkeln,\s*wenden\.?$/i, "häkeln und wenden");
      rest = rest.replace(/,\s*wenden\.?$/i, " und wenden");
    } else {
      rest = rest.replace(/^,?\s*turn\.?$/i, "turn");
    }

    const meaning = stitchMeaning(lead.def, lead.count, lang);
    const restPart = rest
      ? rest.match(/^(häkeln|turn|,)/i)
        ? ` ${rest}`
        : rest.startsWith(",")
          ? rest
          : ` ${rest}`
      : "";
    const instruction =
      `${lead.prefix}${lead.count} ${lead.def.canon} = ${meaning}${restPart}`
        .replace(/\s+/g, " ")
        .replace(/\s+\./g, ".")
        .trim();
    return { instruction, abbreviations: uniqueAbbrs(found) };
  }

  working = expandTechniques(working, lang, found);
  working = expandStitchesInline(working, lang, found);
  found.push(...collectFromText(working, lang));
  return { instruction: working.replace(/\s+/g, " ").trim(), abbreviations: uniqueAbbrs(found) };
}
