import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import type { ReaderLevel } from "@/lib/level";

interface LevelUpModalProps {
  level: ReaderLevel | null;
  onClose: () => void;
}

const SNARKY_MESSAGES: Record<number, string> = {
  2: "Oh wow. You read some pages. Groundbreaking. 📖",
  3: "Bookworm now. Your screen time is officially jealous. 🐛",
  4: "Library Goblin unlocked. Please return your library books. 👹",
  5: "Reading Beast?? Are you okay?? Go outside maybe?? 🦁",
  6: "Legendary Nerd. There is no higher honor. Or insult. 👑",
};

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (!level) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [level]);

  if (!level) return null;

  return (
    <Dialog open={!!level} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="funky-border bg-card max-w-sm">
        <DialogHeader>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Level Up!
            </p>
            <div className="text-7xl mb-3 animate-bounce-in">{level.emoji}</div>
            <DialogTitle className="text-3xl font-display font-extrabold text-foreground">
              Level {level.level}: {level.name}
            </DialogTitle>
            <DialogDescription className="text-base font-bold text-foreground/80 mt-3">
              {SNARKY_MESSAGES[level.level] ?? "Congrats, I guess. 🎉"}
            </DialogDescription>
          </div>
        </DialogHeader>
        <Button onClick={onClose} className="w-full font-display font-bold text-base h-12 rounded-2xl">
          Fine, thanks 🙄
        </Button>
      </DialogContent>
    </Dialog>
  );
}
