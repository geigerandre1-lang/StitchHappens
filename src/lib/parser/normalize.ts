import { isSectionHeader, looksLikeRowStart } from "./sections";

export function normalizePatternText(text: string): string {
  let t = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  t = t.replace(/[—−]/g, "–");
  t = t.replace(/([A-Za-zÄÖÜäöüß])-\n([a-zäöüß])/g, "$1$2");

  const lines = t.split("\n");
  const joined: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\s+$/g, "");
    while (i + 1 < lines.length) {
      const nextRaw = lines[i + 1];
      const next = nextRaw.trim();
      if (!next) break;
      if (looksLikeRowStart(next) || isSectionHeader(next)) break;

      const prev = line.trim();
      if (!prev) break;

      const lastWord = prev.split(/\s+/).pop() || "";
      const nextIsShortFragment = /^[a-zäöüß]{1,6}([.,;:!?)"”']|$)/.test(next);
      const brokenWord =
        lastWord.length <= 4 &&
        /[äöüßa-zA-ZÄÖÜ]$/.test(lastWord) &&
        /^[a-zäöüß]/.test(next);

      if ((nextIsShortFragment && /[a-zäöüß]$/.test(prev)) || brokenWord) {
        line = prev + next;
        i += 1;
        continue;
      }

      const nextContinues =
        !/^[.!?]$/.test(prev.slice(-1)) &&
        (next.startsWith("„") ||
          next.startsWith('"') ||
          next.startsWith("'") ||
          /^[a-zäöüß]/.test(next) ||
          /^werden kann/.test(next));

      if (nextContinues) {
        line = `${prev} ${next}`;
        i += 1;
        continue;
      }
      break;
    }
    joined.push(line.trim());
  }

  return joined.join("\n");
}
