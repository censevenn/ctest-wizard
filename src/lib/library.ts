// Cloud-backed library for saved C-Test texts, keyed by 6-digit guest code.
// Includes a localStorage fallback so the app keeps working if the cloud is unreachable.
import type { SampleText } from "@/data/sampleTexts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LibraryItem extends SampleText {
  source: "ai" | "custom";
  createdAt: number;
}

interface DbRow {
  id: string;
  guest_code: string;
  title: string;
  topic: string;
  level: string;
  text: string;
  source: string;
  created_at: string;
}

function rowToItem(r: DbRow): LibraryItem {
  const level: LibraryItem["level"] =
    r.level === "B2" || r.level === "C1" ? r.level : "Custom";
  return {
    id: r.id,
    title: r.title,
    topic: r.topic,
    level,
    text: r.text,
    source: r.source === "ai" ? "ai" : "custom",
    createdAt: new Date(r.created_at).getTime(),
  };
}

// ---- Local fallback cache ---------------------------------------------------

const cacheKey = (code: string) => `ctest-library-cache-${code}`;
let offlineNoticeShown = false;

function notifyOffline(reason: string) {
  if (offlineNoticeShown) return;
  offlineNoticeShown = true;
  try {
    toast.error("Sync failed. Working in offline mode", { description: reason });
  } catch {
    /* toast may not be mounted yet */
  }
}

function readCache(code: string): LibraryItem[] {
  try {
    const raw = localStorage.getItem(cacheKey(code));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LibraryItem[];
  } catch (e) {
    console.warn("library cache read failed", e);
    return [];
  }
}

function writeCache(code: string, items: LibraryItem[]) {
  try {
    localStorage.setItem(cacheKey(code), JSON.stringify(items));
  } catch (e) {
    console.warn("library cache write failed", e);
  }
}

// ---- Public API -------------------------------------------------------------

export async function fetchLibrary(guestCode: string): Promise<LibraryItem[]> {
  if (!/^\d{6}$/.test(guestCode)) return [];
  try {
    const { data, error } = await supabase
      .from("library_items")
      .select("*")
      .eq("guest_code", guestCode)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const items = (data as DbRow[]).map(rowToItem);
    writeCache(guestCode, items);
    return items;
  } catch (e) {
    console.error("fetchLibrary error — falling back to local cache", e);
    notifyOffline(e instanceof Error ? e.message : "Unknown error");
    return readCache(guestCode);
  }
}

export async function saveLibraryItem(
  guestCode: string,
  item: Omit<LibraryItem, "createdAt"> & { createdAt?: number }
): Promise<LibraryItem> {
  const optimistic: LibraryItem = { ...item, createdAt: item.createdAt ?? Date.now() } as LibraryItem;
  const row = {
    id: item.id,
    guest_code: guestCode,
    title: item.title,
    topic: item.topic,
    level: item.level,
    text: item.text,
    source: item.source,
  };
  try {
    const { data, error } = await supabase
      .from("library_items")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    const saved = rowToItem(data as DbRow);
    const cache = readCache(guestCode).filter((c) => c.id !== saved.id);
    writeCache(guestCode, [saved, ...cache]);
    return saved;
  } catch (e) {
    console.error("saveLibraryItem error — caching locally", e);
    notifyOffline(e instanceof Error ? e.message : "Unknown error");
    const cache = readCache(guestCode).filter((c) => c.id !== optimistic.id);
    writeCache(guestCode, [optimistic, ...cache]);
    return optimistic;
  }
}

export async function removeLibraryItem(guestCode: string, id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("library_items")
      .delete()
      .eq("id", id)
      .eq("guest_code", guestCode);
    if (error) throw error;
  } catch (e) {
    console.error("removeLibraryItem error", e);
    notifyOffline(e instanceof Error ? e.message : "Unknown error");
  }
  writeCache(guestCode, readCache(guestCode).filter((c) => c.id !== id));
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
