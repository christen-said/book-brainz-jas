import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReadingEntries } from "@/lib/readingLog";
import BookCover from "./BookCover";

interface HistoryProps {
  refreshKey: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BOOK_EMOJIS = ["📕", "📗", "📘", "📙", "📓", "📔", "📒"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function monthKey(dateStr: string): { key: string; label: string; sortKey: number } {
  const [y, m] = dateStr.slice(0, 10).split("-").map(Number);
  return {
    key: `${y}-${m}`,
    label: `${MONTH_NAMES[m - 1]} ${y}`,
    sortKey: y * 100 + m,
  };
}

function truncate(text: string, n: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > n ? trimmed.slice(0, n).trimEnd() + "…" : trimmed;
}

export default function History({ refreshKey }: HistoryProps) {
  const { entries, loading } = useReadingEntries(refreshKey);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2 animate-wiggle">📜</div>
        <p className="text-muted-foreground font-display font-bold">
          Digging up the receipts...
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-8 funky-border bg-card text-center">
        <div className="text-5xl mb-3">📜</div>
        <h3 className="font-display font-extrabold text-foreground text-lg mb-1">
          The scroll of nothing.
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          Log a book and it'll show up here forever. No pressure.
        </p>
      </Card>
    );
  }

  // Group by month, preserving newest-first order from entries
  const groups = new Map<string, { label: string; sortKey: number; items: typeof entries }>();
  entries.forEach((e) => {
    const { key, label, sortKey } = monthKey(e.date);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(e);
    } else {
      groups.set(key, { label, sortKey, items: [e] });
    }
  });

  const sortedGroups = Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);

  return (
    <div className="space-y-4">
      <Card className="p-5 funky-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-extrabold text-foreground text-xl">
            The Whole Saga 📜
          </h2>
          <span className="text-xs font-bold text-primary-foreground bg-primary px-2.5 py-1 rounded-full">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Every book she's grudgingly logged. Receipts attached.
        </p>
      </Card>

      <ScrollArea className="h-[60vh] rounded-2xl">
        <div className="space-y-6 pr-3">
          {sortedGroups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-background/90 backdrop-blur">
                <h3 className="font-display font-extrabold text-foreground text-base">
                  {group.label}
                  <span className="ml-2 text-xs font-bold text-muted-foreground">
                    · {group.items.length} {group.items.length === 1 ? "read" : "reads"}
                  </span>
                </h3>
              </div>

              <div className="space-y-3 mt-2">
                {group.items.map((entry, idx) => {
                  const pages = Math.max(0, entry.endPage - entry.startPage);
                  const firstResponse = entry.responses?.find((r) => r && r.trim().length > 0);
                  return (
                    <Card key={entry.id} className="p-4 funky-border bg-card">
                      <div className="flex items-start gap-3">
                        <BookCover
                          title={entry.title}
                          author={entry.author}
                          fallbackEmoji={BOOK_EMOJIS[idx % BOOK_EMOJIS.length]}
                          size={56}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-display font-extrabold text-foreground truncate">
                                {entry.title}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium truncate">
                                by {entry.author}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-primary-foreground bg-primary px-2.5 py-1 rounded-full">
                              {pages} pg
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-muted-foreground">
                            <span>📅 {formatDate(entry.date)}</span>
                            <span>📄 pp. {entry.startPage}–{entry.endPage}</span>
                            {typeof entry.minutesRead === "number" && entry.minutesRead > 0 && (
                              <span>⏱️ {entry.minutesRead} min</span>
                            )}
                          </div>

                          {firstResponse && (
                            <div className="mt-3 p-3 rounded-xl bg-secondary/50 border-2 border-border">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                Her hot take
                              </p>
                              <p className="text-sm text-foreground italic leading-snug">
                                "{truncate(firstResponse, 180)}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
