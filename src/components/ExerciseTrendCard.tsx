import { TrendChart } from "./TrendChart";
import type { ProgressionSuggestion } from "@/lib/progression";

export function ExerciseTrendCard({
  name,
  series,
  latestTopSet,
  suggestion,
}: {
  name: string;
  series: { date: string; value: number }[];
  latestTopSet: { weightKg: number; reps: number } | null;
  suggestion: ProgressionSuggestion;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{name}</h3>
        {latestTopSet && (
          <span className="text-xs text-zinc-500">
            last: {latestTopSet.weightKg}kg × {latestTopSet.reps}
          </span>
        )}
      </div>
      <p className="mb-2 text-xs text-zinc-400 dark:text-zinc-600">Estimated 1-rep max, per session</p>

      {suggestion.type === "increase" && (
        <p className="mb-2 text-xs font-medium text-success">
          Ready to add weight — try {suggestion.toWeight}kg next time
        </p>
      )}
      {suggestion.type === "stalled" && (
        <p className="mb-2 text-xs font-medium text-accent">
          Stalled — no improvement in 4 sessions. Consider a deload, a variation swap, or hold steady.
        </p>
      )}

      <TrendChart data={series} unit="kg" />
    </div>
  );
}
