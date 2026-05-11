import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Play, Square, RotateCcw } from "lucide-react";
import {
  getElapsedMs,
  isTimerRunning,
  startTimer,
  stopTimer,
  resetTimer,
  subscribeTimer,
} from "@/lib/timerStore";

interface ReadingTimerProps {
  onStop: (minutes: number) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function ReadingTimer({ onStop }: ReadingTimerProps) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const running = isTimerRunning();

  // Subscribe to timer events
  useEffect(() => subscribeTimer(() => force((n) => n + 1)), []);

  // Tick every 500ms while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = getElapsedMs();

  const handleStop = () => {
    const totalMs = stopTimer();
    const minutes = Math.max(0, Math.round(totalMs / 60000));
    onStop(minutes);
  };

  return (
    <Card className="funky-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-xl rotate-[-5deg]">
            ⏱️
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-foreground">Time Your Reading</h3>
            {running || elapsed > 0 ? (
              <p className="text-xs font-mono font-bold text-primary">{formatTime(elapsed)} {running ? "· running" : "· paused"}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Optional. Skip it if you want.</p>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t-2 border-border">
          <p className="text-xs text-muted-foreground mb-4 italic">
            Start this before you read, stop when you're done. Revolutionary concept, I know.
          </p>

          <div className="text-center mb-4">
            <div className="font-mono text-5xl font-extrabold text-foreground tracking-wider">
              {formatTime(elapsed)}
            </div>
          </div>

          <div className="flex gap-2">
            {!running ? (
              <Button
                type="button"
                onClick={startTimer}
                className="flex-1 rounded-xl font-display font-bold h-12"
              >
                <Play className="w-4 h-4 mr-1" /> {elapsed > 0 ? "Resume" : "Start"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStop}
                variant="destructive"
                className="flex-1 rounded-xl font-display font-bold h-12"
              >
                <Square className="w-4 h-4 mr-1" /> Stop
              </Button>
            )}
            <Button
              type="button"
              onClick={resetTimer}
              variant="outline"
              className="rounded-xl font-display font-bold h-12 border-2"
              disabled={running && elapsed === 0}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
