import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLevelProgress, LEVELS } from "@/lib/level";

interface LevelCardProps {
  totalPages: number;
}

export default function LevelCard({ totalPages }: LevelCardProps) {
  const { current, next, pagesNeededForNext, percent } = getLevelProgress(totalPages);

  return (
    <Card className="p-5 funky-border bg-gradient-to-br from-primary/15 via-card to-accent/10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-4xl funky-shadow rotate-[-4deg]">
          {current.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Level {current.level} of {LEVELS.length}
          </p>
          <h3 className="text-xl font-display font-extrabold text-foreground truncate">
            {current.name}
          </h3>
          <p className="text-xs font-bold text-muted-foreground">{totalPages} XP (pages)</p>
        </div>
      </div>

      <div className="mt-4">
        <Progress value={percent} className="h-3 border-2 border-border" />
        <div className="mt-2 flex items-center justify-between text-xs font-bold">
          {next ? (
            <>
              <span className="text-muted-foreground">
                {pagesNeededForNext} pages to <span className="text-foreground">{next.emoji} {next.name}</span>
              </span>
              <span className="text-primary">{percent}%</span>
            </>
          ) : (
            <span className="text-foreground">Max level. You're insufferable now. 👑</span>
          )}
        </div>
      </div>
    </Card>
  );
}
