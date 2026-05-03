// C-Test logic
// First sentence stays full. From the second sentence onward, every 2nd word is truncated.
// Truncation per target word (length L): show first ceil(L/2) letters, gap covers floor(L/2) letters — exactly one input per word.
// Hyphenated compounds (e.g. Mehr-Test-Wort) are one word: one prefix + one gap.
// Tokenization: split on whitespace and punctuation so punctuation is never merged into a word token.

export type Token =
  | { type: "text"; value: string }
  | {
      type: "gap";
      id: string;
      prefix: string;
      answer: string;
      original: string;
    };

/** Letters + combining marks; internal hyphens/apostrophes stay one word (single gap). */
const WORD_LIKE = /^[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*$/u;

/** Split into words vs separators (spaces + listed punctuation). Capturing group keeps delimiters in the array. */
const WORD_NONWORD_SPLIT = /(\s+|[.,!?;:()])/g;

function normalizeCtestInput(text: string): string {
  return text.normalize("NFC").replace(/\u200B/g, "").replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  const t = normalizeCtestInput(text);
  if (!t) return [];
  const matches = t.match(/[^.!?…]+[.!?…]+["»”'']?|\S+$/gu);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [t];
}

/**
 * Split sentence into alternating runs: word-like segments vs whitespace/punctuation chunks.
 * Empty strings from split are dropped.
 */
export function splitWordsAndNonWords(sentence: string): string[] {
  return sentence.split(WORD_NONWORD_SPLIT).filter((p) => p.length > 0);
}

function isWord(piece: string): boolean {
  return WORD_LIKE.test(piece);
}

/** Number of characters kept as static prefix before the gap (ceil(L/2) for L >= 2; whole word for L <= 1). */
export function keepCount(word: string): number {
  const n = word.length;
  if (n <= 1) return n;
  return Math.ceil(n / 2);
}

export function buildCTest(rawText: string): Token[] {
  const text = normalizeCtestInput(rawText);
  if (!text) return [];

  const sentences = splitSentences(text);
  const tokens: Token[] = [];
  let gapIdx = 0;
  let wordCounterFromSecondSentence = 0;

  sentences.forEach((sentence, sIdx) => {
    const pieces = splitWordsAndNonWords(sentence);
    const isFirstSentence = sIdx === 0;

    pieces.forEach((piece) => {
      if (!isWord(piece) || isFirstSentence) {
        if (piece.length > 0) tokens.push({ type: "text", value: piece });
        return;
      }

      wordCounterFromSecondSentence += 1;
      const shouldGap = wordCounterFromSecondSentence % 2 === 0;

      if (!shouldGap || piece.length <= 1) {
        tokens.push({ type: "text", value: piece });
        return;
      }

      const keep = keepCount(piece);
      const gapLen = piece.length - keep;
      if (gapLen <= 0) {
        tokens.push({ type: "text", value: piece });
        return;
      }

      const prefix = piece.slice(0, keep);
      const answer = piece.slice(keep);

      tokens.push({
        type: "gap",
        id: `gap-${gapIdx++}`,
        prefix,
        answer,
        original: piece,
      });
    });

    if (sIdx < sentences.length - 1) {
      tokens.push({ type: "text", value: " " });
    }
  });

  return tokens;
}
