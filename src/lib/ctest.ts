// C-Test logic
// First sentence stays full. From the second sentence onward, every 2nd word is truncated.
// Truncation: if word length is even -> keep first half, hide second half.
// If odd -> keep floor(n/2), hide ceil(n/2)  (i.e. hide MORE than half).
// Examples: Hase(4)->Ha + se(2). Apfel(5)->Ap + fel(3). Deutschland(11)->Deuts + chland(6). ist(3)->i + st(2).
// Each truncatable word becomes exactly one token: static prefix + one gap (suffix), never multiple gaps per word.

export type Token =
  | { type: "text"; value: string }
  | {
    type: "gap";
    id: string;
    prefix: string;
    answer: string; // hidden suffix; validation is exact string equality
    original: string; // original whole word
  };

// Letters + combining marks; hyphenated compounds (e.g. Mehr-Test-Wort); NFC avoids decomposed umlaut splits.
const WORD_LIKE = /^[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*$/u;

function normalizeCtestInput(text: string): string {
  return text.normalize("NFC").replace(/\u200B/g, "").replace(/\s+/g, " ").trim();
}

// Split text into sentences while preserving terminators (supports … and typical closing quotes).
function splitSentences(text: string): string[] {
  const t = normalizeCtestInput(text);
  if (!t) return [];
  const matches = t.match(/[^.!?…]+[.!?…]+["»”'']?|\S+$/gu);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [t];
}

// Tokenize a sentence into word/non-word pieces, preserving spaces & punctuation attached to words.
function tokenize(sentence: string): string[] {
  const raw =
    sentence.match(/[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*|[^\p{L}\p{M}]+/gu) ?? [];
  return raw.filter((p) => p.length > 0);
}

function isWord(piece: string): boolean {
  return WORD_LIKE.test(piece);
}

// Returns how many letters to KEEP at the start of a word (the visible prefix).
// Spec: keep first half = Math.ceil(n/2). Even n -> exact half. Odd n -> keep more, hide less.
export function keepCount(word: string): number {
  const n = word.length;
  if (n <= 1) return n; // don't truncate 1-letter words
  return Math.ceil(n / 2);
}

export function buildCTest(rawText: string): Token[] {
  const text = normalizeCtestInput(rawText);
  if (!text) return [];

  const sentences = splitSentences(text);
  const tokens: Token[] = [];
  let gapIdx = 0;
  let wordCounterFromSecondSentence = 0; // counts only words

  sentences.forEach((sentence, sIdx) => {
    const pieces = tokenize(sentence);
    const isFirstSentence = sIdx === 0;

    pieces.forEach((piece) => {
      if (!isWord(piece) || isFirstSentence) {
        if (piece.length > 0) tokens.push({ type: "text", value: piece });
        return;
      }

      // From the 2nd sentence onward: every 2nd word is truncated.
      wordCounterFromSecondSentence += 1;
      const shouldGap = wordCounterFromSecondSentence % 2 === 0;

      if (!shouldGap || piece.length <= 1) {
        tokens.push({ type: "text", value: piece });
        return;
      }

      const keep = keepCount(piece);
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

    // Add a space between sentences
    if (sIdx < sentences.length - 1) {
      tokens.push({ type: "text", value: " " });
    }
  });

  return tokens;
}
