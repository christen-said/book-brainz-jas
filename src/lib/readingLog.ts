export interface ReadingEntry {
  id: string;
  date: string; // ISO date string
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

const STORAGE_KEY = "reading-log-entries";

export function getEntries(): ReadingEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveEntry(entry: ReadingEntry) {
  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntriesForWeek(date: Date): ReadingEntry[] {
  const entries = getEntries();
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return entries.filter((e) => {
    const d = new Date(e.date);
    return d >= startOfWeek && d < endOfWeek;
  });
}

export function getUniqueDaysThisWeek(date: Date): number {
  const weekEntries = getEntriesForWeek(date);
  const uniqueDays = new Set(weekEntries.map((e) => e.date.split("T")[0]));
  return uniqueDays.size;
}

export function getTotalPagesRead(): number {
  return getEntries().reduce((sum, e) => sum + Math.max(0, e.endPage - e.startPage), 0);
}

export function getTotalBooks(): number {
  const titles = new Set(getEntries().map((e) => `${e.title}::${e.author}`));
  return titles.size;
}

export function getStreakWeeks(): number {
  const entries = getEntries();
  if (entries.length === 0) return 0;

  const now = new Date();
  let streakWeeks = 0;
  let checkDate = new Date(now);

  // Check current week first, then go backwards
  while (true) {
    const days = getUniqueDaysThisWeek(checkDate);
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

export function checkBadges(): Badge[] {
  const allBadges: Badge[] = [];
  const entries = getEntries();
  const totalPages = getTotalPagesRead();
  const totalBooks = getTotalBooks();
  const streakWeeks = getStreakWeeks();
  const daysThisWeek = getUniqueDaysThisWeek(new Date());

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
