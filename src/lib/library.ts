// Lightweight localStorage-backed library for saved C-Test texts.
import type { SampleText } from "@/data/sampleTexts";

const KEY = "ctest.library.v1";

export interface LibraryItem extends SampleText {
  source: "ai" | "custom";
  createdAt: number;
}

function safeParse(raw: string | null): LibraryItem[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function getLibrary(): LibraryItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY)).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveLibraryItem(item: Omit<LibraryItem, "createdAt"> & { createdAt?: number }): LibraryItem {
  const full: LibraryItem = { ...item, createdAt: item.createdAt ?? Date.now() };
  const all = getLibrary().filter((x) => x.id !== full.id);
  all.unshift(full);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
  return full;
}

export function removeLibraryItem(id: string): void {
  const all = getLibrary().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
