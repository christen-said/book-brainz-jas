import { Card } from "@/components/ui/card";
import { checkBadges, type Badge } from "@/lib/readingLog";

interface BadgeWallProps {
  refreshKey: number;
}

const ALL_POSSIBLE_BADGES: Badge[] = [
  { id: "first-entry", name: "First Page", description: "Log your first reading!", emoji: "📖" },
  { id: "weekly-star", name: "Weekly Star", description: "Read 5+ days this week!", emoji: "⭐" },
  { id: "page-turner", name: "Page Turner", description: "Read 100+ pages total!", emoji: "📚" },
  { id: "bookworm", name: "Bookworm", description: "Read 500+ pages total!", emoji: "🐛" },
  { id: "explorer", name: "Book Explorer", description: "Read 3 different books!", emoji: "🗺️" },
  { id: "library", name: "Library Builder", description: "Read 10 different books!", emoji: "🏛️" },
  { id: "streak-2", name: "On a Roll", description: "2-week reading streak!", emoji: "🔥" },
  { id: "streak-4", name: "Super Reader", description: "4-week reading streak!", emoji: "🏆" },
  { id: "dedicated", name: "Dedicated Reader", description: "20 reading log entries!", emoji: "💪" },
];

export default function BadgeWall({ refreshKey }: BadgeWallProps) {
  const earned = checkBadges();
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm font-semibold text-muted-foreground">
          {earned.length} of {ALL_POSSIBLE_BADGES.length} badges earned
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ALL_POSSIBLE_BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <Card
              key={badge.id}
              className={`p-4 text-center border-2 transition-all ${
                isEarned ? "border-golden bg-golden/5 shadow-md" : "border-border bg-muted/30 opacity-50"
              }`}
            >
              <div className={`text-3xl mb-2 ${isEarned ? "animate-pop-in" : "grayscale"}`}>{badge.emoji}</div>
              <p className={`text-xs font-bold ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>{badge.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
