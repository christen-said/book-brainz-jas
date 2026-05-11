// Module-level singleton so the timer state survives Radix Tab unmounts
// and any in-app navigation. Resets only on full page reload.

type Listener = () => void;

interface TimerState {
  startedAt: number | null; // epoch ms when current run started; null if paused
  accumulatedMs: number; // ms accumulated across previous runs
}

const state: TimerState = {
  startedAt: null,
  accumulatedMs: 0,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeTimer(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getElapsedMs(): number {
  return state.accumulatedMs + (state.startedAt ? Date.now() - state.startedAt : 0);
}

export function isTimerRunning(): boolean {
  return state.startedAt !== null;
}

export function startTimer() {
  if (state.startedAt !== null) return;
  state.startedAt = Date.now();
  emit();
}

export function stopTimer(): number {
  if (state.startedAt !== null) {
    state.accumulatedMs += Date.now() - state.startedAt;
    state.startedAt = null;
  }
  emit();
  return state.accumulatedMs;
}

export function resetTimer() {
  state.startedAt = null;
  state.accumulatedMs = 0;
  emit();
}

export function elapsedMinutes(): number {
  return Math.max(0, Math.round(getElapsedMs() / 60000));
}
