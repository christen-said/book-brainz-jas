import { supabase } from "@/integrations/supabase/client";
import type { ReadingEntry } from "./readingLog";

export async function getEntriesFromDb(): Promise<ReadingEntry[]> {
  const { data, error } = await supabase
    .from("reading_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;

  return (data || []).map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    author: e.author,
    startPage: e.start_page,
    endPage: e.end_page,
    prompts: e.prompts || [],
    responses: e.responses || [],
  }));
}

export async function saveEntryToDb(entry: ReadingEntry): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reading_entries").insert({
    user_id: user.id,
    date: entry.date,
    title: entry.title,
    author: entry.author,
    start_page: entry.startPage,
    end_page: entry.endPage,
    prompts: entry.prompts,
    responses: entry.responses,
  });

  if (error) throw error;
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function updateProfile(displayName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("user_id", user.id);

  if (error) throw error;
}
