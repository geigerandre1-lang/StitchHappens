import { looksLikeRowStart } from "./rows";
import { parseMetaLine, parseSizeHeader } from "./meta";

export const SECTION_ALIASES: Record<string, string> = {
  stiel: "Stiel",
  montage: "Montage",
  zusammenbau: "Zusammenbau",
  fertigstellung: "Fertigstellung",
  körper: "Körper",
  korpus: "Körper",
  hauptteil: "Hauptteil",
  kopf: "Kopf",
  arme: "Arme",
  arm: "Arm",
  beine: "Beine",
  bein: "Bein",
  ohren: "Ohren",
  ohr: "Ohr",
  schnauze: "Schnauze",
  nase: "Nase",
  mund: "Mund",
  augen: "Augen",
  blätter: "Blätter",
  blaetter: "Blätter",
  blatt: "Blatt",
  bäckchen: "Bäckchen",
  baeckchen: "Bäckchen",
  wangen: "Bäckchen",
  kelch: "Kelch",
  krone: "Krone",
  abschluss: "Abschluss",
  blüte: "Blüte",
  bluete: "Blüte",
  blume: "Blume",
  hut: "Hut",
  mütze: "Mütze",
  muetze: "Mütze",
  schal: "Schal",
  henkel: "Henkel",
  träger: "Träger",
  traeger: "Träger",
  deckel: "Deckel",
  rand: "Rand",
  bordüre: "Bordüre",
  borduere: "Bordüre",
  schwanz: "Schwanz",
  flügel: "Flügel",
  fluegel: "Flügel",
  haare: "Haare",
  kragen: "Kragen",
  ärmel: "Ärmel",
  aermel: "Ärmel",
  kapuze: "Kapuze",
  stem: "Stiel",
  stalk: "Stiel",
  assembly: "Montage",
  finishing: "Fertigstellung",
  construction: "Montage",
  "making up": "Montage",
  makeup: "Montage",
  body: "Körper",
  main: "Hauptteil",
  "main piece": "Hauptteil",
  head: "Kopf",
  arms: "Arme",
  legs: "Beine",
  ears: "Ohren",
  ear: "Ohr",
  snout: "Schnauze",
  muzzle: "Schnauze",
  nose: "Nase",
  mouth: "Mund",
  eyes: "Augen",
  leaves: "Blätter",
  leaf: "Blatt",
  flower: "Blüte",
  blossom: "Blüte",
  hat: "Hut",
  cap: "Mütze",
  scarf: "Schal",
  handle: "Henkel",
  strap: "Träger",
  lid: "Deckel",
  brim: "Rand",
  border: "Rand",
  tail: "Schwanz",
  wings: "Flügel",
  wing: "Flügel",
  hair: "Haare",
  collar: "Kragen",
  sleeves: "Ärmel",
  sleeve: "Ärmel",
  hood: "Kapuze",
};

function foldHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ä")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHeaderLine(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/^_+|_+$/g, "")
    .replace(/:$/, "")
    .trim();
}

export function resolveSectionTitle(line: string): string | null {
  const normalized = foldHeader(normalizeHeaderLine(line));
  if (!normalized) return null;
  if (SECTION_ALIASES[normalized]) return SECTION_ALIASES[normalized];
  return null;
}

export { looksLikeRowStart };

const META_HEADER_RE =
  /(garnforbrug|^garn$|yarn|nadel|hook|needle|zubehör|zubehoer|hinweis|^notes?$|abbreviation|abkürzung|material|^höhe$|^hoehe$|height|gauge|maschenprobe|schwierigkeit)/i;

const INTRO_NOISE_RE =
  /^(Inhaltsverzeichnis|Abkürzungen|Abbreviations|So geht['’]?s|Hinweise?|Zubehör|Du brauchst|You (?:will )?need|Weitere\b|Das Material\b|Das wird\b)/i;

export function isIntroNoise(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (INTRO_NOISE_RE.test(t)) return true;
  if (/benötigt:\s*$/i.test(t)) return true;
  if (/^[A-Za-zÄÖÜß]{1,10}\s*=\s+\S/.test(t) && t.length < 90) return true;
  if (/^Optional:/i.test(t)) return true;
  if (/^\d+\s+[A-ZÄÖÜa-zÄÖÜäöüß].{10,}$/.test(t) && !looksLikeRowStart(t) && !/häkeln/i.test(t)) {
    return true;
  }
  return false;
}

function isSentenceLike(text: string): boolean {
  if (/^(Die|Der|Das|Häkle|Stopfe|Drapiere|Wenn|Ist|Für|Sticke|Beginne|Lege)\b/i.test(text)) {
    return true;
  }
  return /[.!?]$/.test(text) && !/\)$/.test(text);
}

export function isPartHeader(line: string): boolean {
  const raw = line.trim();
  if (!raw || looksLikeRowStart(raw) || parseMetaLine(raw) || isIntroNoise(raw)) return false;
  const stripped = normalizeHeaderLine(raw);
  if (stripped.length < 3 || stripped.length > 80) return false;
  if (isSentenceLike(stripped)) return false;

  if (
    /^(Abschluss|Fertigstellung|Zusammenbau|Montage|Assembly|Finishing|Construction)\b/i.test(
      stripped,
    )
  ) {
    return true;
  }

  const hasQty = /\(\s*\d+\s*x\b/i.test(stripped);
  const hasCrochetVerb = /\bhäkel(?:n|e)\b|\bcrochet(?:ing)?\b/i.test(stripped);
  const hasColon = /[:：]\s*$/.test(raw);

  if (hasCrochetVerb && (hasColon || hasQty) && stripped.split(/\s+/).length <= 14) {
    return true;
  }
  if (hasQty && (hasColon || stripped.split(/\s+/).length <= 10)) {
    return true;
  }
  return false;
}

export function isSectionHeader(line: string): boolean {
  const raw = line.trim();
  if (!raw || looksLikeRowStart(raw)) return false;
  if (parseMetaLine(raw)) return false;
  if (isIntroNoise(raw)) return false;
  const normalized = foldHeader(normalizeHeaderLine(raw));
  if (META_HEADER_RE.test(normalized) && !parseSizeHeader(raw)) return false;
  if (parseSizeHeader(raw)) return true;
  if (resolveSectionTitle(raw)) return true;
  if (isPartHeader(raw)) return true;

  const stripped = normalizeHeaderLine(raw);
  if (stripped.length < 2 || stripped.length > 32) return false;
  if (!/^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\s/-]*$/.test(stripped)) return false;

  const letters = stripped.replace(/[^A-Za-zÄÖÜäöüß]/g, "");
  const upper = letters.replace(/[^A-ZÄÖÜ]/g, "");
  return letters.length >= 2 && upper.length / letters.length >= 0.75;
}

export function displaySectionTitle(line: string, fallback: string): string {
  const resolved = resolveSectionTitle(line);
  if (resolved) return resolved;
  const cleaned = normalizeHeaderLine(line)
    .replace(/\s*häkeln\s*/gi, " ")
    .replace(/\s*crochet(?:ing)?\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}
