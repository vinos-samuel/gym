"use client";

import { useEffect, useState } from "react";

export function RestTimer({
  durationSeconds,
  onDismiss,
}: {
  durationSeconds: number;
  onDismiss: () => void;
}) {
  const [endTime] = useState(() => Date.now() + durationSeconds * 1000);
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemaining(secondsLeft);
    };

    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [endTime]);

  useEffect(() => {
    if (remaining <= 0) onDismiss();
  }, [remaining, onDismiss]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
      <div>
        <span className="text-xs uppercase tracking-wide text-zinc-500">Rest</span>
        <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {mm}:{String(ss).padStart(2, "0")}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-50 dark:active:bg-zinc-600"
      >
        Skip
      </button>
    </div>
  );
}
