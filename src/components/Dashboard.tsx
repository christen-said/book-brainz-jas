import { Card } from "@/components/ui/card";
import {
  getEntries,
  getEntriesForWeek,
  getUniqueDaysThisWeek,
  getTotalPagesRead,
  getTotalBooks,
  type ReadingEntry,
} from "@/lib/readingLog";
import { BookOpen, FileText, Calendar, TrendingUp } from "lucide-react";

interface DashboardProps {
  refreshKey: number;
}

function StatCard({ icon: Icon, label, value, color, emoji }: { icon: any; label: string; value: string | number; color: string; emoji: string }) {
  return (
    <Card className="p-4 funky-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${color}`}>
          {emoji}
        </div>
        <div>
          <p className="text-2xl font-display font-extrabold text-foreground">{value}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </Card>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_EMOJIS_DONE = ["🌟", "💪", "🔥", "⚡", "🎯", "🚀", "👑"];
const DAY_EMOJIS_TODAY = "👈";

export default function Dashboard({ refreshKey }: DashboardProps) {
  const now = new Date();
  const weekEntries = getEntriesForWeek(now);
  const daysThisWeek = getUniqueDaysThisWeek(now);
  const totalPages = getTotalPagesRead();
  const totalBooks = getTotalBooks();
  const totalEntries = getEntries().length;

  const dayMap = new Set<number>();
  weekEntries.forEach((e) => {
    const d = new Date(e.date);
    dayMap.add(d.getDay());
  });

  const weekPages = weekEntries.reduce((sum, e) => sum + Math.max(0, e.endPage - e.startPage), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Calendar} label="Days This Week" value={`${daysThisWeek}/5`} color="bg-primary/15" emoji="📅" />
        <StatCard icon={FileText} label="Pages This Week" value={weekPages} color="bg-accent/15" emoji="📄" />
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="bg-golden/15" emoji="📚" />
        <StatCard icon={TrendingUp} label="Total Pages" value={totalPages} color="bg-secondary" emoji="📈" />
      </div>

      {/* Weekly Progress */}
      <Card className="p-5 funky-border bg-card">
        <h3 className="font-display font-bold text-foreground mb-4">This Week's Vibe Check 📊</h3>
        <div className="flex justify-between gap-2">
          {DAY_NAMES.map((day, i) => {
            const done = dayMap.has(i);
            const isToday = now.getDay() === i;
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground funky-shadow"
                      : isToday
                      ? "bg-accent/20 text-accent-foreground border-3 border-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? DAY_EMOJIS_DONE[i] : isToday ? DAY_EMOJIS_TODAY : ""}
                </div>
                <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</span>
              </div>
            );
          })}
        </div>
        {daysThisWeek >= 5 && (
          <div className="mt-4 p-3 rounded-2xl bg-primary/10 text-center animate-bounce-in">
            <span className="text-sm font-bold text-foreground">🏆 YOU'RE A LEGEND! 5-day streak unlocked!</span>
          </div>
        )}
      </Card>

      {/* Recent Entries */}
      {totalEntries > 0 && (
        <Card className="p-5 funky-border bg-card">
          <h3 className="font-display font-bold text-foreground mb-3">Recent Reads 📝</h3>
          <div className="space-y-3">
            {getEntries()
              .slice(-5)
              .reverse()
              .map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 border-2 border-border">
                  <div className="text-2xl">{["📕", "📗", "📘", "📙", "📓"][idx % 5]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.author} · pp. {entry.startPage}-{entry.endPage} ·{" "}
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary-foreground bg-primary px-2.5 py-1 rounded-full">
                    {entry.endPage - entry.startPage} pg
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
