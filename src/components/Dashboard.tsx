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

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card className="p-4 border-2 border-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-display font-extrabold text-foreground">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </Card>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard({ refreshKey }: DashboardProps) {
  const now = new Date();
  const weekEntries = getEntriesForWeek(now);
  const daysThisWeek = getUniqueDaysThisWeek(now);
  const totalPages = getTotalPagesRead();
  const totalBooks = getTotalBooks();
  const totalEntries = getEntries().length;

  // Build a map of which days this week have entries
  const dayMap = new Set<number>();
  weekEntries.forEach((e) => {
    const d = new Date(e.date);
    dayMap.add(d.getDay());
  });

  // Pages read this week
  const weekPages = weekEntries.reduce((sum, e) => sum + Math.max(0, e.endPage - e.startPage), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Calendar} label="Days This Week" value={`${daysThisWeek}/5`} color="bg-primary/10 text-primary" />
        <StatCard icon={FileText} label="Pages This Week" value={weekPages} color="bg-accent/10 text-accent" />
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="bg-golden/10 text-golden" />
        <StatCard icon={TrendingUp} label="Total Pages" value={totalPages} color="bg-primary/10 text-primary" />
      </div>

      {/* Weekly Progress Bar */}
      <Card className="p-5 border-2 border-border bg-card">
        <h3 className="font-display font-bold text-foreground mb-4">This Week's Progress</h3>
        <div className="flex justify-between gap-2">
          {DAY_NAMES.map((day, i) => {
            const done = dayMap.has(i);
            const isToday = now.getDay() === i;
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground shadow-md"
                      : isToday
                      ? "bg-accent/20 text-accent border-2 border-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : isToday ? "📖" : ""}
                </div>
                <span className={`text-xs font-semibold ${isToday ? "text-accent" : "text-muted-foreground"}`}>{day}</span>
              </div>
            );
          })}
        </div>
        {daysThisWeek >= 5 && (
          <div className="mt-4 p-3 rounded-lg bg-golden/10 text-center">
            <span className="text-sm font-bold text-golden-foreground">⭐ Amazing! You hit your 5-day goal this week!</span>
          </div>
        )}
      </Card>

      {/* Recent Entries */}
      {totalEntries > 0 && (
        <Card className="p-5 border-2 border-border bg-card">
          <h3 className="font-display font-bold text-foreground mb-3">Recent Entries</h3>
          <div className="space-y-3">
            {getEntries()
              .slice(-5)
              .reverse()
              .map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl">📖</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.author} · pp. {entry.startPage}-{entry.endPage} ·{" "}
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
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
