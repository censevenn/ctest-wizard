// C-Test logic
// First sentence stays full. From the second sentence onward, every 2nd word is truncated.
// Truncation: keep first half = Math.ceil(n/2), hide the rest.
// Strict rule: one word = one gap. Hyphens / apostrophes inside a word do NOT split it.

export type Token =
  | { type: "text"; value: string }
  | {
    type: "gap";
    id: string;
    prefix: string;
    answer: string;
    original: string;
  };

function normalize(text: string): string {
  return text.normalize("NFC").replace(/\u200B/g, "");
}

// A "word" = run of letters / combining marks, allowing internal -, ’, '
const WORD_CORE = /[\p{L}\p{M}]+(?:[-’'][\p{L}\p{M}]+)*/u;

/** Strip leading/trailing punctuation; return [leading, core, trailing]. */
function peelWord(token: string): [string, string, string] {
  const m = token.match(WORD_CORE);
  if (!m) return [token, "", ""];
  const start = m.index ?? 0;
  const core = m[0];
  return [token.slice(0, start), core, token.slice(start + core.length)];
}

/** Detect whether a token (after peeling) closes a sentence. */
function endsSentence(token: string): boolean {
  return /[.!?…]+["»”'']?\s*$/.test(token);
}

export function keepCount(word: string): number {
  const n = word.length;
  if (n <= 1) return n;
  return Math.ceil(n / 2);
}

export function buildCTest(rawText: string): Token[] {
  const text = normalize(rawText).trim();
  if (!text) return [];

  // Split on whitespace, keeping the whitespace runs.
  const parts = text.split(/(\s+)/);

  const tokens: Token[] = [];
  let gapIdx = 0;
  let sentenceIdx = 0; // 0 = first sentence (never gapped)
  let wordCounterInGapZone = 0;

  for (const part of parts) {
    if (part.length === 0) continue;
    if (/^\s+$/.test(part)) {
      tokens.push({ type: "text", value: part });
      continue;
    }

    const [lead, core, trail] = peelWord(part);

    if (!core) {
      tokens.push({ type: "text", value: part });
      if (endsSentence(part)) sentenceIdx += 1;
      continue;
    }

    const inGapZone = sentenceIdx >= 1;
    let didGap = false;

    if (inGapZone) {
      wordCounterInGapZone += 1;
      const shouldGap = wordCounterInGapZone % 2 === 0 && core.length > 1;
      if (shouldGap) {
        const keep = keepCount(core);
        if (lead) tokens.push({ type: "text", value: lead });
        tokens.push({
          type: "gap",
          id: `gap-${gapIdx++}`,
          prefix: core.slice(0, keep),
          answer: core.slice(keep),
          original: core,
        });
        if (trail) tokens.push({ type: "text", value: trail });
        didGap = true;
      }
    }

    if (!didGap) {
      tokens.push({ type: "text", value: part });
    }

    if (endsSentence(part)) sentenceIdx += 1;
  }

  return tokens;
}
