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
    <div className="flex items-center justify-between rounded-xl bg-stone-100 px-4 py-3 dark:bg-stone-800">
      <div>
        <span className="text-xs uppercase tracking-wide text-stone-500">Rest</span>
        <p className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
          {mm}:{String(ss).padStart(2, "0")}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 active:bg-stone-300 dark:bg-stone-700 dark:text-stone-50 dark:active:bg-stone-600"
      >
        Skip
      </button>
    </div>
  );
}
