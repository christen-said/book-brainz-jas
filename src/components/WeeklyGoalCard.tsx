import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { getWeeklyGoal, updateWeeklyGoal } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface WeeklyGoalCardProps {
  weekPages: number;
}

export default function WeeklyGoalCard({ weekPages }: WeeklyGoalCardProps) {
  const [goal, setGoal] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("100");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const g = await getWeeklyGoal();
        if (active) {
          setGoal(g);
          setDraft(String(g));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pct = goal > 0 ? Math.min(100, Math.round((weekPages / goal) * 100)) : 0;
  const hit = weekPages >= goal && goal > 0;
  const remaining = Math.max(0, goal - weekPages);

  let snark = "Pages don't read themselves. 🙄";
  if (hit) snark = "Ok fine, you actually did it. 👏";
  else if (pct >= 75) snark = `So close it's almost suspicious. ${remaining} to go.`;
  else if (pct >= 40) snark = `Halfway-ish. Don't peak now. ${remaining} pages left.`;
  else if (pct > 0) snark = `Cool, ${weekPages} pages. Keep going. ${remaining} more.`;

  const handleSave = async () => {
    const n = parseInt(draft, 10);
    if (!Number.isFinite(n) || n < 1 || n > 10000) {
      toast({ title: "Pick a real number.", description: "Between 1 and 10,000 pages." });
      return;
    }
    setSaving(true);
    try {
      await updateWeeklyGoal(n);
      setGoal(n);
      setOpen(false);
      toast({ title: "Goal updated.", description: `${n} pages this week. Don't whine about it later.` });
    } catch (e: any) {
      toast({ title: "That broke.", description: e?.message ?? "Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 funky-border bg-card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display font-bold text-foreground">
            Weekly Page Goal 🎯
          </h3>
          <p className="text-xs font-medium text-muted-foreground">
            {loading ? "loading…" : `${weekPages} / ${goal} pages`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-9 w-9"
              title="Set weekly goal"
              aria-label="Set weekly goal"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Set Your Weekly Goal</DialogTitle>
              <DialogDescription>
                How many pages this week? Be ambitious. Or don't. We won't judge. Much.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <Label htmlFor="goal">Pages per week</Label>
              <Input
                id="goal"
                type="number"
                min={1}
                max={10000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Nevermind
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Lock it in"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Progress value={pct} className="h-3" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-sm font-bold ${hit ? "text-primary" : "text-foreground"}`}>
          {snark}
        </p>
        <span className="text-xs font-bold text-muted-foreground shrink-0">{pct}%</span>
      </div>
    </Card>
  );
}
