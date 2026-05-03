import { useCallback, useEffect, useRef, useState } from "react";

const RECOMMENDED_MS = 5 * 60 * 1000;

type UseExerciseTimerOptions = {
  paused: boolean;
};

export function useExerciseTimer({ paused }: UseExerciseTimerOptions) {
  const [active, setActive] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const loop = useCallback(() => {
    if (segmentStartRef.current == null) return;
    const now = performance.now();
    setElapsedMs(Math.floor(accumulatedRef.current + (now - segmentStartRef.current)));
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (!active) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    if (paused) {
      if (segmentStartRef.current != null) {
        accumulatedRef.current += performance.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      setElapsedMs(Math.floor(accumulatedRef.current));
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    if (segmentStartRef.current == null) {
      segmentStartRef.current = performance.now();
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, paused, loop]);

  const start = useCallback(() => {
    if (active) return;
    accumulatedRef.current = 0;
    segmentStartRef.current = null;
    setElapsedMs(0);
    setActive(true);
  }, [active]);

  const reset = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    segmentStartRef.current = null;
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setActive(false);
  }, []);

  const overRecommended = active && elapsedMs > RECOMMENDED_MS;

  return {
    active,
    elapsedMs,
    start,
    reset,
    recommendedMs: RECOMMENDED_MS,
    overRecommended,
  };
}

export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
