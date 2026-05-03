import { describe, it, expect } from "vitest";
import { buildCTest, keepCount, splitWordsAndNonWords } from "./ctest";

describe("splitWordsAndNonWords", () => {
  it("splits on listed punctuation and whitespace without fragmenting words", () => {
    expect(splitWordsAndNonWords("Hallo, Welt!")).toEqual(["Hallo", ",", " ", "Welt", "!"]);
  });

  it("keeps hyphenated compounds as a single word token", () => {
    expect(splitWordsAndNonWords("sozial-verträglich und gut.")).toEqual([
      "sozial-verträglich",
      " ",
      "und",
      " ",
      "gut",
      ".",
    ]);
  });
});

describe("buildCTest", () => {
  it("yields at most one gap per logical word (Unicode letters + hyphens)", () => {
    const text =
      "Erster Satz bleibt ganz. Größte Herausforderung und viel Spaß heute.";

    const tokens = buildCTest(text);
    const gaps = tokens.filter((t) => t.type === "gap");
    const originals = new Set(gaps.map((g) => (g.type === "gap" ? g.original : "")));

    // Sentence 2, every 2nd word: Herausforderung, viel, heute — not split on umlauts (no extra gaps on ß/ä)
    expect(originals.has("Herausforderung")).toBe(true);
    expect(originals.has("viel")).toBe(true);
    expect(originals.has("heute")).toBe(true);
    expect(originals.has("Größte")).toBe(false);
    expect(gaps.length).toBe(3);
  });

  it("merges hyphenated words into a single token (one prefix + one gap)", () => {
    const text = "Erster komplett. Zwei Wörter und Mehr-Test-Wort folgen.";
    const tokens = buildCTest(text);
    const gaps = tokens.filter((t) => t.type === "gap");
    const hyphenGap = gaps.find((g) => g.type === "gap" && g.original.includes("-"));
    expect(hyphenGap).toBeDefined();
    expect(hyphenGap?.type === "gap" && hyphenGap.original).toBe("Mehr-Test-Wort");
    if (hyphenGap && hyphenGap.type === "gap") {
      const k = keepCount(hyphenGap.original);
      expect(k).toBe(Math.ceil(hyphenGap.original.length / 2));
      expect(hyphenGap.prefix).toBe(hyphenGap.original.slice(0, k));
      expect(hyphenGap.answer).toBe(hyphenGap.original.slice(k));
      expect(hyphenGap.prefix.length + hyphenGap.answer.length).toBe(hyphenGap.original.length);
    }
  });

  it("uses ceil/2 visible prefix and one gap only (odd length example)", () => {
    const text = "Erster Satz. Apfel Birnen kommen dran.";
    const tokens = buildCTest(text);
    const birnen = tokens.find((t) => t.type === "gap" && t.original === "Birnen");
    expect(birnen?.type).toBe("gap");
    if (birnen?.type === "gap") {
      expect(birnen.original).toBe("Birnen");
      expect(birnen.prefix.length).toBe(Math.ceil("Birnen".length / 2));
      expect(birnen.answer.length).toBe(Math.floor("Birnen".length / 2));
    }
  });

  it("splits on ellipsis without breaking tokens", () => {
    const text = "Erster Satz komplett. Zweiter Satz endet hier… Dritter Satz läuft weiter.";
    const tokens = buildCTest(text);
    const gaps = tokens.filter((t) => t.type === "gap");
    expect(gaps.length).toBeGreaterThan(0);
    expect(tokens.some((t) => t.type === "text" && t.value.includes("…"))).toBe(true);
  });

  it("normalizes decomposed umlauts to a single word (no empty fragments)", () => {
    // NFD: f + combining diaeresis — NFC merges to one ä so "fährt" stays one word (not split into multiple gaps).
    const nfd = "Zweiter Satz. f\u0061\u0308hrt schnell und bremst.\n";
    const tokens = buildCTest(nfd);
    const emptyText = tokens.filter((t) => t.type === "text" && t.value === "");
    expect(emptyText.length).toBe(0);
    const gapWords = tokens
      .filter((t): t is { type: "gap"; original: string } => t.type === "gap")
      .map((g) => g.original);
    expect(gapWords).toEqual(["schnell", "bremst"]);
  });
});
