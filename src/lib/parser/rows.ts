export type RowParse = {
  from: number;
  to: number;
  kind: "reihe" | "runde";
  body: string;
};

/** Rounds first, so "Rd" is never eaten as "R" (Reihe). Optional trailing dot: Rd. / rd. */
export const ROUND_UNIT = String.raw`Runden|Runde|Rd\.?|Rnds\.?|Rounds|Round|Rnd\.?`;
export const ROW_UNIT = String.raw`Reihen|Reihe|Rh\.?|Rows|Row`;
const UNIT = String.raw`(?:${ROUND_UNIT}|${ROW_UNIT}|R\.?)`;

export function kindFromToken(token: string): "reihe" | "runde" {
  const t = token.replace(/\./g, "").toLowerCase().trim();
  if (/^(rd|rnd|runde|runden|round|rounds)$/.test(t)) return "runde";
  return "reihe";
}

export function looksLikeRowStart(line: string): boolean {
  const t = line.trim();
  if (new RegExp(`^\\d`, "i").test(t) && new RegExp(`(?:${UNIT})`, "i").test(t.slice(0, 40))) {
    return parseRowLine(t) != null;
  }
  return parseRowLine(t) != null;
}

export function parseRowLine(line: string): RowParse | null {
  const t = line.trim();

  const patterns: Array<{
    re: RegExp;
    read: (m: RegExpMatchArray) => RowParse | null;
  }> = [
    // 2.–40. Rd. / 2.-4. Runde: / 1. rd:
    {
      re: new RegExp(
        `^(\\d+)\\s*\\.\\s*[–-]\\s*(\\d+)\\s*\\.\\s*(${UNIT})\\s*:?\\s*(.*)$`,
        "i",
      ),
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[2]),
        kind: kindFromToken(m[3]),
        body: m[4],
      }),
    },
    // 2. bis 4. Rd.
    {
      re: new RegExp(
        `^(\\d+)\\.\\s*bis\\s*(\\d+)\\.\\s*(${UNIT})\\s*:?\\s*(.*)$`,
        "i",
      ),
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[2]),
        kind: kindFromToken(m[3]),
        body: m[4],
      }),
    },
    // 1. Rd. / 1.rd: / 3. Runden
    {
      re: new RegExp(`^(\\d+)\\s*\\.\\s*(${UNIT})\\s*:?\\s*(.*)$`, "i"),
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[1]),
        kind: kindFromToken(m[2]),
        body: m[3],
      }),
    },
    // 2-40 Rd. / 2–4 rd
    {
      re: new RegExp(
        `^(\\d+)\\s*[–-]\\s*(\\d+)\\s*\\.?\\s*(${UNIT})\\s*:?\\s*(.*)$`,
        "i",
      ),
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[2]),
        kind: kindFromToken(m[3]),
        body: m[4],
      }),
    },
    // Runde 9+10: / Rd 3+4:
    {
      re: new RegExp(`^(${UNIT})\\s+(\\d+)\\s*\\+\\s*(\\d+)\\s*:?\\s*(.*)$`, "i"),
      read: (m) => ({
        from: Number(m[2]),
        to: Number(m[3]),
        kind: kindFromToken(m[1]),
        body: m[4],
      }),
    },
    // Rows 2-40: / Rnds 3-5: / Runden 2–8:
    {
      re: new RegExp(
        `^(${UNIT})\\s+(\\d+)\\s*[–-]\\s*(\\d+)\\s*:?\\s*(.*)$`,
        "i",
      ),
      read: (m) => ({
        from: Number(m[2]),
        to: Number(m[3]),
        kind: kindFromToken(m[1]),
        body: m[4],
      }),
    },
    // Rd. 1: / rd 2 / Runde 3: / Rnd 4:
    {
      re: new RegExp(`^(${UNIT})\\s+(\\d+)\\s*:?\\s*(.*)$`, "i"),
      read: (m) => ({
        from: Number(m[2]),
        to: Number(m[2]),
        kind: kindFromToken(m[1]),
        body: m[3],
      }),
    },
    // 1 Rd: / 3 runden 6 fM
    {
      re: new RegExp(`^(\\d+)\\s+(${UNIT})\\s*:?\\s*(.*)$`, "i"),
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[1]),
        kind: kindFromToken(m[2]),
        body: m[3],
      }),
    },
    {
      re: /^R(?:nd|ow)?\.?\s*(\d+)\s*[–-]\s*(\d+)\s*[.):]\s*(.*)$/i,
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[2]),
        kind: /rnd/i.test(t) || !/ow/i.test(t) ? "runde" : "reihe",
        body: m[3],
      }),
    },
    {
      re: /^R(?:nd|ow)?\.?\s*(\d+)\s*[.):]\s*(.*)$/i,
      read: (m) => ({
        from: Number(m[1]),
        to: Number(m[1]),
        kind: /rnd/i.test(t) || !/ow/i.test(t) ? "runde" : "reihe",
        body: m[2],
      }),
    },
  ];

  for (const { re, read } of patterns) {
    const match = t.match(re);
    if (!match) continue;
    const parsed = read(match);
    if (!parsed || !parsed.from || !parsed.to || parsed.to < parsed.from) continue;
    parsed.body = parsed.body.replace(/^[.:]\s*/, "").trim();
    return parsed;
  }

  return null;
}
