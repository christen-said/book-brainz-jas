import { useEffect, useState, useCallback } from "react";
import { getEntriesFromDb, saveEntryToDb } from "./supabase";

export interface ReadingEntry {
  id: string;
  date: string;
  title: string;
  author: string;
  startPage: number;
  endPage: number;
  prompts: string[];
  responses: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earnedDate?: string;
}

// Hook-based API for async Supabase data
export function useReadingEntries(refreshKey: number = 0) {
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntriesFromDb();
      setEntries(data);
    } catch (e) {
      console.error("Failed to load entries:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { entries, loading, refresh };
}

export async function saveEntry(entry: ReadingEntry) {
  await saveEntryToDb(entry);
}

// Format a Date as YYYY-MM-DD using its local calendar day
export function toLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function getWeekRangeStrings(date: Date): { start: string; end: string } {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  return { start: toLocalDateString(startOfWeek), end: toLocalDateString(endOfWeek) };
}

function getEntriesForWeek(entries: ReadingEntry[], date: Date): ReadingEntry[] {
  const { start, end } = getWeekRangeStrings(date);
  return entries.filter((e) => {
    const d = e.date.slice(0, 10);
    return d >= start && d < end;
  });
}

export function getUniqueDaysForWeek(entries: ReadingEntry[], date: Date): number {
  const weekEntries = getEntriesForWeek(entries, date);
  const uniqueDays = new Set(weekEntries.map((e) => e.date.slice(0, 10)));
  return uniqueDays.size;
}

export function getWeekEntries(entries: ReadingEntry[], date: Date): ReadingEntry[] {
  return getEntriesForWeek(entries, date);
}

export function getTotalPagesRead(entries: ReadingEntry[]): number {
  return entries.reduce((sum, e) => sum + Math.max(0, e.endPage - e.startPage), 0);
}

export function getTotalBooks(entries: ReadingEntry[]): number {
  const titles = new Set(entries.map((e) => `${e.title}::${e.author}`));
  return titles.size;
}

export function getStreakWeeks(entries: ReadingEntry[]): number {
  if (entries.length === 0) return 0;
  const now = new Date();
  let streakWeeks = 0;
  let checkDate = new Date(now);

  while (true) {
    const days = getUniqueDaysForWeek(entries, checkDate);
    if (days >= 5) {
      streakWeeks++;
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      break;
    }
  }
  return streakWeeks;
}

// Reading prompts categorized by type
const PROMPTS = {
  comprehension: [
    "What happened in the part you read today? Summarize it in 2-3 sentences.",
    "Who are the main characters in what you read? What are they like?",
    "What was the most important event in today's reading?",
    "Where and when does this part of the story take place?",
    "What problem or challenge is a character facing right now?",
  ],
  connection: [
    "Does this story remind you of anything in your own life? How?",
    "If you could talk to one character, what would you ask them?",
    "Would you want to be friends with any character? Why or why not?",
    "Has anything like this ever happened to you or someone you know?",
    "How would you feel if you were in the main character's situation?",
  ],
  prediction: [
    "What do you think will happen next? Why?",
    "Do you think the character will make a good decision? Why?",
    "How do you think this book will end?",
    "What clues has the author given about what might happen?",
    "If you were writing this story, what would happen next?",
  ],
  opinion: [
    "What's your favorite part of what you read today and why?",
    "Would you recommend this book to a friend? Why or why not?",
    "What's something interesting or surprising you learned?",
    "Is there anything you would change about this story?",
    "Rate today's reading from 1-5 stars and explain why.",
  ],
};

export function getRandomPrompts(count: number = 3): string[] {
  const categories = Object.values(PROMPTS);
  const selected: string[] = [];
  const usedCategories = new Set<number>();

  while (selected.length < count) {
    let catIndex: number;
    do {
      catIndex = Math.floor(Math.random() * categories.length);
    } while (usedCategories.has(catIndex) && usedCategories.size < categories.length);
    usedCategories.add(catIndex);

    const cat = categories[catIndex];
    const prompt = cat[Math.floor(Math.random() * cat.length)];
    if (!selected.includes(prompt)) {
      selected.push(prompt);
    }
  }
  return selected;
}

export function checkBadges(entries: ReadingEntry[]): Badge[] {
  const allBadges: Badge[] = [];
  const totalPages = getTotalPagesRead(entries);
  const totalBooks = getTotalBooks(entries);
  const streakWeeks = getStreakWeeks(entries);
  const daysThisWeek = getUniqueDaysForWeek(entries, new Date());

  if (entries.length >= 1) allBadges.push({ id: "first-entry", name: "First Page", description: "Logged your first reading!", emoji: "📖" });
  if (daysThisWeek >= 5) allBadges.push({ id: "weekly-star", name: "Weekly Star", description: "Read 5+ days this week!", emoji: "⭐" });
  if (totalPages >= 100) allBadges.push({ id: "page-turner", name: "Page Turner", description: "Read 100+ pages total!", emoji: "📚" });
  if (totalPages >= 500) allBadges.push({ id: "bookworm", name: "Bookworm", description: "Read 500+ pages total!", emoji: "🐛" });
  if (totalBooks >= 3) allBadges.push({ id: "explorer", name: "Book Explorer", description: "Read 3 different books!", emoji: "🗺️" });
  if (totalBooks >= 10) allBadges.push({ id: "library", name: "Library Builder", description: "Read 10 different books!", emoji: "🏛️" });
  if (streakWeeks >= 2) allBadges.push({ id: "streak-2", name: "On a Roll", description: "2-week reading streak!", emoji: "🔥" });
  if (streakWeeks >= 4) allBadges.push({ id: "streak-4", name: "Super Reader", description: "4-week reading streak!", emoji: "🏆" });
  if (entries.length >= 20) allBadges.push({ id: "dedicated", name: "Dedicated Reader", description: "20 reading log entries!", emoji: "💪" });

  return allBadges;
}
