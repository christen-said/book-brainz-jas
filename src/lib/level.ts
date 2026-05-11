export interface ReaderLevel {
  level: number;
  name: string;
  emoji: string;
  minPages: number;
}

export const LEVELS: ReaderLevel[] = [
  { level: 1, name: "Rookie", emoji: "🌱", minPages: 0 },
  { level: 2, name: "Page Flipper", emoji: "📖", minPages: 100 },
  { level: 3, name: "Bookworm", emoji: "🐛", minPages: 500 },
  { level: 4, name: "Library Goblin", emoji: "👹", minPages: 1500 },
  { level: 5, name: "Reading Beast", emoji: "🦁", minPages: 3000 },
  { level: 6, name: "Legendary Nerd", emoji: "👑", minPages: 5000 },
];

export function getLevel(totalPages: number): ReaderLevel {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (totalPages >= l.minPages) current = l;
  }
  return current;
}

export function getNextLevel(totalPages: number): ReaderLevel | null {
  const current = getLevel(totalPages);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function getLevelProgress(totalPages: number): {
  current: ReaderLevel;
  next: ReaderLevel | null;
  pagesIntoLevel: number;
  pagesNeededForNext: number;
  percent: number;
} {
  const current = getLevel(totalPages);
  const next = getNextLevel(totalPages);
  const pagesIntoLevel = totalPages - current.minPages;
  if (!next) {
    return { current, next, pagesIntoLevel, pagesNeededForNext: 0, percent: 100 };
  }
  const span = next.minPages - current.minPages;
  const percent = Math.min(100, Math.round((pagesIntoLevel / span) * 100));
  return { current, next, pagesIntoLevel, pagesNeededForNext: next.minPages - totalPages, percent };
}
