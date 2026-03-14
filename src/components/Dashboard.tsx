import { Card } from "@/components/ui/card";
import {
  useReadingEntries,
  getWeekEntries,
  getUniqueDaysForWeek,
  getTotalPagesRead,
  getTotalBooks,
} from "@/lib/readingLog";
import { BookOpen, FileText, Calendar, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MonthlyView({ entries }: { entries: { date: string; startPage: number; endPage: number }[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const dayData = new Map<number, { pages: number; count: number }>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const existing = dayData.get(day) || { pages: 0, count: 0 };
      dayData.set(day, {
        pages: existing.pages + Math.max(0, e.endPage - e.startPage),
        count: existing.count + 1,
      });
    }
  });

  const totalMonthPages = Array.from(dayData.values()).reduce((s, d) => s + d.pages, 0);
  const totalMonthDays = dayData.size;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = monthOffset === 0;
  const canGoForward = monthOffset < 0;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card className="p-5 funky-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonthOffset((o) => o - 1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-accent/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h3 className="font-display font-bold text-foreground">
          {MONTH_NAMES[month]} {year} 📅
        </h3>
        <button
          onClick={() => canGoForward && setMonthOffset((o) => o + 1)}
          className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center transition-colors ${canGoForward ? "hover:bg-accent/20" : "opacity-30 cursor-not-allowed"}`}
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const data = dayData.get(day);
          const isToday = isCurrentMonth && day === today;
          return (
            <div
              key={day}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                data
                  ? "bg-primary text-primary-foreground funky-shadow"
                  : isToday
                  ? "bg-accent/20 border-2 border-accent text-foreground"
                  : "bg-secondary/40 text-muted-foreground"
              }`}
              title={data ? `${data.pages} pages read` : undefined}
            >
              <span className="text-[11px]">{day}</span>
              {data && <span className="text-[9px] opacity-80">{data.pages}p</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1 p-3 rounded-2xl bg-secondary/40 text-center">
          <p className="text-lg font-display font-extrabold text-foreground">{totalMonthDays}</p>
          <p className="text-xs font-bold text-muted-foreground">days read</p>
        </div>
        <div className="flex-1 p-3 rounded-2xl bg-secondary/40 text-center">
          <p className="text-lg font-display font-extrabold text-foreground">{totalMonthPages}</p>
          <p className="text-xs font-bold text-muted-foreground">pages read</p>
        </div>
      </div>

      {totalMonthDays >= 20 && (
        <div className="mt-3 p-3 rounded-2xl bg-primary/10 text-center animate-bounce-in">
          <span className="text-sm font-bold text-foreground">🤯 20+ days this month?! You're UNSTOPPABLE!</span>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard({ refreshKey }: DashboardProps) {
  const { entries, loading } = useReadingEntries(refreshKey);
  const now = new Date();
  const weekEntries = getWeekEntries(entries, now);
  const daysThisWeek = getUniqueDaysForWeek(entries, now);
  const totalPages = getTotalPagesRead(entries);
  const totalBooks = getTotalBooks(entries);

  const dayMap = new Set<number>();
  weekEntries.forEach((e) => {
    const d = new Date(e.date);
    dayMap.add(d.getDay());
  });

  const weekPages = weekEntries.reduce((sum, e) => sum + Math.max(0, e.endPage - e.startPage), 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2 animate-wiggle">📚</div>
        <p className="text-muted-foreground font-display font-bold">Loading your stats...</p>
      </div>
    );
  }

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

      {/* Monthly View */}
      <MonthlyView entries={entries} />

      {/* Recent Entries */}
      {entries.length > 0 && (
        <Card className="p-5 funky-border bg-card">
          <h3 className="font-display font-bold text-foreground mb-3">Recent Reads 📝</h3>
          <div className="space-y-3">
            {entries
              .slice(0, 5)
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
