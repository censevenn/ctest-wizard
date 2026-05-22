// Cloud-backed library for saved C-Test texts, keyed by 6-digit guest code.
import type { SampleText } from "@/data/sampleTexts";
import { supabase } from "@/integrations/supabase/client";

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

export async function fetchLibrary(guestCode: string): Promise<LibraryItem[]> {
  if (!/^\d{6}$/.test(guestCode)) return [];
  const { data, error } = await supabase
    .from("library_items")
    .select("*")
    .eq("guest_code", guestCode)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("fetchLibrary error", error);
    return [];
  }
  return (data as DbRow[]).map(rowToItem);
}

export async function saveLibraryItem(
  guestCode: string,
  item: Omit<LibraryItem, "createdAt"> & { createdAt?: number }
): Promise<LibraryItem> {
  const row = {
    id: item.id,
    guest_code: guestCode,
    title: item.title,
    topic: item.topic,
    level: item.level,
    text: item.text,
    source: item.source,
  };
  const { data, error } = await supabase
    .from("library_items")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    console.error("saveLibraryItem error", error);
    return { ...item, createdAt: item.createdAt ?? Date.now() } as LibraryItem;
  }
  return rowToItem(data as DbRow);
}

export async function removeLibraryItem(guestCode: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("library_items")
    .delete()
    .eq("id", id)
    .eq("guest_code", guestCode);
  if (error) console.error("removeLibraryItem error", error);
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
