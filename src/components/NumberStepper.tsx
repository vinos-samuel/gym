"use client";

export function NumberStepper({
  value,
  onChange,
  step,
  min = 0,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  step: number;
  min?: number;
  label: string;
}) {
  const dec = () => onChange(Math.max(min, round(value - step)));
  const inc = () => onChange(round(value + step));

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs uppercase tracking-wide text-stone-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          aria-label={`Decrease ${label}`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl font-medium text-stone-900 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-50 dark:active:bg-stone-700"
        >
          −
        </button>
        <span className="w-16 text-center text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          aria-label={`Increase ${label}`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-2xl font-medium text-stone-900 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-50 dark:active:bg-stone-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
