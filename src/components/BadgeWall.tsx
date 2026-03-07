import { Card } from "@/components/ui/card";
import { checkBadges, type Badge } from "@/lib/readingLog";

interface BadgeWallProps {
  refreshKey: number;
}

const ALL_POSSIBLE_BADGES: Badge[] = [
  { id: "first-entry", name: "First Page", description: "Log your first reading!", emoji: "📖" },
  { id: "weekly-star", name: "Weekly Legend", description: "Read 5+ days this week!", emoji: "⭐" },
  { id: "page-turner", name: "Page Devourer", description: "Eat 100+ pages!", emoji: "🍕" },
  { id: "bookworm", name: "Mega Nerd", description: "500+ pages consumed!", emoji: "🤓" },
  { id: "explorer", name: "Book Hopper", description: "Read 3 different books!", emoji: "🐸" },
  { id: "library", name: "Library Boss", description: "Read 10 different books!", emoji: "👑" },
  { id: "streak-2", name: "On Fire", description: "2-week reading streak!", emoji: "🔥" },
  { id: "streak-4", name: "Unstoppable", description: "4-week reading streak!", emoji: "💀" },
  { id: "dedicated", name: "Absolute Unit", description: "20 reading log entries!", emoji: "💪" },
];

export default function BadgeWall({ refreshKey }: BadgeWallProps) {
  const earned = checkBadges();
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-lg font-display font-bold text-foreground">
          {earned.length === 0 ? "No badges yet... go earn some! 💪" : `${earned.length} of ${ALL_POSSIBLE_BADGES.length} badges unlocked 🔓`}
        </p>
        <p className="text-sm text-muted-foreground">Collect 'em all!</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ALL_POSSIBLE_BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <Card
              key={badge.id}
              className={`p-4 text-center border-3 rounded-2xl transition-all ${
                isEarned ? "border-primary bg-primary/5 funky-shadow" : "border-border bg-muted/30 opacity-40 grayscale"
              }`}
            >
              <div className={`text-4xl mb-2 ${isEarned ? "animate-pop-in" : ""}`}>{badge.emoji}</div>
              <p className={`text-xs font-display font-bold ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>{badge.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
