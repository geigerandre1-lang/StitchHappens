export type MetaField =
  | "hook"
  | "yarn"
  | "yarnAmount"
  | "height"
  | "width"
  | "length"
  | "gauge"
  | "difficulty"
  | "sizes"
  | "other";

export type PatternMeta = {
  hook: string | null;
  yarn: string | null;
  yarnAmount: string | null;
  height: string | null;
  width: string | null;
  length: string | null;
  gauge: string | null;
  difficulty: string | null;
  sizes: string[];
  extras: Array<{ label: string; value: string }>;
};

export type SectionKind = "work" | "montage" | "size";

export function emptyMeta(): PatternMeta {
  return {
    hook: null,
    yarn: null,
    yarnAmount: null,
    height: null,
    width: null,
    length: null,
    gauge: null,
    difficulty: null,
    sizes: [],
    extras: [],
  };
}

export const META_LABELS: Record<Exclude<MetaField, "other" | "sizes">, string> = {
  hook: "Häkelnadel",
  yarn: "Garn / Wolle",
  yarnAmount: "Wollmenge",
  height: "Höhe",
  width: "Breite",
  length: "Länge",
  gauge: "Maschenprobe",
  difficulty: "Schwierigkeit",
};

const FIELD_PATTERNS: Array<{ field: MetaField; re: RegExp }> = [
  { field: "hook", re: /^(Häkelnadel(?:größe)?|Nadel(?:stärke)?|Hook(?:\s*size)?|Needle)\s*[:.]?\s*(.+)$/i },
  { field: "yarnAmount", re: /^(Wollmenge|Verbrauch|Menge|Yardage)\s*[:.]?\s*(.+)$/i },
  { field: "yarn", re: /^(Garn|Wolle|Yarn)\s*[:.]?\s*(.+)$/i },
  { field: "height", re: /^(Höhe|Hoehe|Height)\s*[:.]?\s*(.+)$/i },
  { field: "width", re: /^(Breite|Width)\s*[:.]?\s*(.+)$/i },
  { field: "length", re: /^(Länge|Laenge|Length)\s*[:.]?\s*(.+)$/i },
  { field: "gauge", re: /^(Maschenprobe|Gauge)\s*[:.]?\s*(.+)$/i },
  { field: "difficulty", re: /^(Schwierigkeit|Level|Difficulty)\s*[:.]?\s*(.+)$/i },
  { field: "height", re: /^((?:Fertige\s+)?Größe)\s*:\s*(.+\d.*(?:cm|mm).*)$/i },
  { field: "sizes", re: /^(Gr[oö](?:ss|ß)en|Sizes)\s*:\s*(.+)$/i },
  {
    field: "other",
    re: /^(Fertige Größe|Finished size|Abmessungen|Maße|Material(?:ien)?)\s*:\s*(.+)$/i,
  },
];

export function parseMetaLine(
  line: string,
): { field: MetaField; label: string; value: string } | null {
  const t = line.trim();
  if (!t || t.length > 160) return null;
  for (const { field, re } of FIELD_PATTERNS) {
    const match = t.match(re);
    if (!match) continue;
    const value = (match[2] ?? "").trim();
    if (!value) continue;
    const label =
      field === "other"
        ? match[1]
        : field === "sizes"
          ? "Größen"
          : META_LABELS[field];
    return { field, label, value };
  }
  return null;
}

export function parseSizeList(value: string): string[] {
  return value
    .split(/[,;/()]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.length < 24);
}

export function extractLooseMeta(meta: PatternMeta, line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (!meta.hook && /nadel|hook/i.test(t)) {
    const mm = t.match(/(\d+[.,]\d+)\s*mm/i);
    if (mm) {
      meta.hook = `${mm[1].replace(".", ",")} mm`;
      return true;
    }
  }
  if (!meta.yarn && /^(Baumwollgarn|Garn|Wolle|Cotton)\b/i.test(t)) {
    meta.yarn = t.replace(/\s+/g, " ").slice(0, 160);
    return true;
  }
  return false;
}

export function applyMetaLine(meta: PatternMeta, line: string): boolean {
  const parsed = parseMetaLine(line);
  if (!parsed) return false;
  if (parsed.field === "sizes") {
    const sizes = parseSizeList(parsed.value);
    for (const size of sizes) {
      if (!meta.sizes.includes(size)) meta.sizes.push(size);
    }
    return true;
  }
  if (parsed.field === "other") {
    meta.extras.push({ label: parsed.label, value: parsed.value });
    return true;
  }
  if (!meta[parsed.field]) {
    meta[parsed.field] = parsed.value;
  } else {
    meta.extras.push({ label: parsed.label, value: parsed.value });
  }
  return true;
}

export function parseSizeHeader(line: string): string | null {
  const t = line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/:$/, "")
    .trim();
  if (!t) return null;
  if (/^größen?\s*:/i.test(line.trim())) return null;
  const labeled = t.match(/^(?:gr[oö](?:ss|ß)e|size)\s+(.+)$/i);
  if (labeled) return labeled[1].trim();
  if (/^(xs|s|m|l|xl|xxl|xxxl)$/i.test(t)) return t.toUpperCase();
  if (/^\d+\s*[-–]\s*\d+\s*(?:monate|jahre|j\.?)$/i.test(t)) return t;
  return null;
}

export function isMontageTitle(title: string): boolean {
  return /^(montage|zusammenbau|fertigstellung|abschluss|assembly|finishing|construction|making up)\b/i.test(
    title.trim(),
  );
}

export function classifySection(title: string): { kind: SectionKind; sizeLabel: string | null } {
  if (isMontageTitle(title)) return { kind: "montage", sizeLabel: null };
  const size = parseSizeHeader(title);
  if (size) return { kind: "size", sizeLabel: size };
  return { kind: "work", sizeLabel: null };
}

export function metaHasContent(meta: PatternMeta): boolean {
  return Boolean(
    meta.hook ||
      meta.yarn ||
      meta.yarnAmount ||
      meta.height ||
      meta.width ||
      meta.length ||
      meta.gauge ||
      meta.difficulty ||
      meta.sizes.length ||
      meta.extras.length,
  );
}

export function metaSummaryChips(meta: PatternMeta): string[] {
  const chips: string[] = [];
  if (meta.hook) chips.push(meta.hook.includes("mm") ? meta.hook : `${meta.hook}`);
  if (meta.yarnAmount) chips.push(meta.yarnAmount);
  else if (meta.yarn) chips.push(meta.yarn);
  if (meta.height && meta.width) chips.push(`${meta.height} × ${meta.width}`);
  else if (meta.height) chips.push(`H ${meta.height}`);
  else if (meta.width) chips.push(`B ${meta.width}`);
  if (meta.sizes.length) chips.push(meta.sizes.join(" · "));
  return chips;
}
