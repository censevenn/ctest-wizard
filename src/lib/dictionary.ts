/** Free Dictionary API (German). Fallback: Duden / Leo links. */

export type DictionaryResult =
  | {
      ok: true;
      word: string;
      meanings: string[];
      phonetic?: string;
    }
  | {
      ok: false;
      word: string;
      dudenUrl: string;
      leoUrl: string;
      message: string;
    };

function encodeWord(w: string): string {
  return encodeURIComponent(w.trim());
}

export function dudenSearchUrl(word: string): string {
  return `https://www.duden.de/suchen/dudenonline/${encodeWord(word)}`;
}

export function leoSearchUrl(word: string): string {
  return `https://dict.leo.org/ende/index_de.html#/search=${encodeWord(word)}`;
}

export function verbformenSearchUrl(word: string): string {
  return `https://www.verbformen.ru/suche/?w=${encodeWord(word)}`;
}

export async function fetchGermanDictionary(word: string): Promise<DictionaryResult> {
  const w = word.trim();
  if (!w) {
    return {
      ok: false,
      word: w,
      dudenUrl: dudenSearchUrl(w),
      leoUrl: leoSearchUrl(w),
      message: "Leeres Wort",
    };
  }

  const url = `https://api.dictionaryapi.dev/api/v2/entries/de/${encodeWord(w)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        word: w,
        dudenUrl: dudenSearchUrl(w),
        leoUrl: leoSearchUrl(w),
        message: res.status === 404 ? "Kein Eintrag gefunden" : `API-Fehler (${res.status})`,
      };
    }
    const data = (await res.json()) as Array<{
      word?: string;
      phonetic?: string;
      meanings?: Array<{ definitions?: Array<{ definition?: string }> }>;
      meanings_legacy?: Array<{ definitions?: Array<{ definition?: string }> }>;
    }>;

    const entry = data[0];
    if (!entry) {
      return {
        ok: false,
        word: w,
        dudenUrl: dudenSearchUrl(w),
        leoUrl: leoSearchUrl(w),
        message: "Leere Antwort",
      };
    }

    const meanings: string[] = [];
    const defs = entry.meanings ?? [];
    for (const m of defs) {
      for (const d of m.definitions ?? []) {
        const def = d.definition?.trim();
        if (def) meanings.push(def);
        if (meanings.length >= 5) break;
      }
      if (meanings.length >= 5) break;
    }

    if (meanings.length === 0) {
      return {
        ok: false,
        word: entry.word ?? w,
        dudenUrl: dudenSearchUrl(w),
        leoUrl: leoSearchUrl(w),
        message: "Keine Definitionen",
      };
    }

    return {
      ok: true,
      word: entry.word ?? w,
      phonetic: entry.phonetic,
      meanings,
    };
  } catch {
    return {
      ok: false,
      word: w,
      dudenUrl: dudenSearchUrl(w),
      leoUrl: leoSearchUrl(w),
      message: "Netzwerkfehler",
    };
  }
}
