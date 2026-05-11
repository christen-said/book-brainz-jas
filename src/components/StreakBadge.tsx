import { useReadingEntries, getDailyStreak } from "@/lib/readingLog";

interface StreakBadgeProps {
  refreshKey: number;
}

export default function StreakBadge({ refreshKey }: StreakBadgeProps) {
  const { entries, loading } = useReadingEntries(refreshKey);
  if (loading) return null;

  const streak = getDailyStreak(entries);
  const active = streak > 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-extrabold border-2 transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary funky-shadow"
          : "bg-secondary text-foreground border-border"
      }`}
      title={active ? `You've logged reading ${streak} day${streak === 1 ? "" : "s"} in a row` : "Log a book today to start a streak"}
    >
      <span className={active ? "animate-wiggle" : "opacity-60"}>🔥</span>
      <span>
        {active ? `${streak} day streak` : "Start a streak!"}
      </span>
    </div>
  );
}
