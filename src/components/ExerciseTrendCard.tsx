"use client";

import { useState } from "react";
import { TrendChart } from "./TrendChart";
import type { ProgressionSuggestion } from "@/lib/progression";

export function ExerciseTrendCard({
  name,
  series,
  volumeSeries,
  latestTopSet,
  suggestion,
}: {
  name: string;
  series: { date: string; value: number }[];
  volumeSeries: { date: string; value: number }[];
  latestTopSet: { weightKg: number; reps: number } | null;
  suggestion: ProgressionSuggestion;
}) {
  // Charts are only mounted once expanded — with ~20+ exercises on the page,
  // rendering every chart up front made the page too heavy to reliably load
  // on a phone over gym wifi.
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <button type="button" onClick={() => setExpanded((e) => !e)} className="flex w-full items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">{name}</h3>
        <div className="flex items-center gap-2">
          {latestTopSet && (
            <span className="text-xs text-stone-500">
              last: {latestTopSet.weightKg}kg × {latestTopSet.reps}
            </span>
          )}
          <span className="text-stone-400">{expanded ? "−" : "+"}</span>
        </div>
      </button>

      {suggestion.type === "increase" && (
        <p className="mt-1 text-xs font-medium text-success">
          Ready to add weight — try {suggestion.toWeight}kg next time
        </p>
      )}
      {suggestion.type === "stalled" && (
        <p className="mt-1 text-xs font-medium text-gold-foreground">
          <span className="rounded-full bg-gold-soft px-2 py-0.5 text-gold-foreground">Stalled</span>{" "}
          — no improvement in 4 sessions. Consider a deload, a variation swap, or hold steady.
        </p>
      )}

      {expanded && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-stone-400 dark:text-stone-600">Estimated 1-rep max, per session</p>
          <TrendChart data={series} unit="kg" />

          <p className="mb-2 mt-4 text-xs text-stone-400 dark:text-stone-600">
            Volume per session (weight × reps × sets) — total work, not peak strength
          </p>
          <TrendChart data={volumeSeries} unit="kg" />
        </div>
      )}
    </div>
  );
}
