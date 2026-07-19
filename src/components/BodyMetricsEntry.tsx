"use client";

import { useState } from "react";
import { TrendChart } from "./TrendChart";

type Series = { date: string; value: number }[];

export function BodyMetricsEntry({
  latestBodyweight,
  latestWaist,
  bodyweightSeries,
  waistSeries,
}: {
  latestBodyweight: number | null;
  latestWaist: number | null;
  bodyweightSeries: Series;
  waistSeries: Series;
}) {
  return (
    <div className="flex flex-col gap-4">
      <MetricCard
        label="Bodyweight"
        unit="kg"
        latest={latestBodyweight}
        series={bodyweightSeries}
        type="bodyweight_kg"
      />
      <MetricCard label="Waist" unit="cm" latest={latestWaist} series={waistSeries} type="waist_cm" />
    </div>
  );
}

function MetricCard({
  label,
  unit,
  latest,
  series,
  type,
}: {
  label: string;
  unit: string;
  latest: number | null;
  series: Series;
  type: "bodyweight_kg" | "waist_cm";
}) {
  const [value, setValue] = useState(latest !== null ? String(latest) : "");
  const [saved, setSaved] = useState(false);

  async function handleLog() {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed)) return;
    await fetch("/api/body-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), type, value: parsed }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</h3>
      <TrendChart data={series} unit={unit} />
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`${label} in ${unit}`}
          className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-3 text-base text-zinc-900 focus:border-accent focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={handleLog}
          className="shrink-0 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground active:opacity-80"
        >
          {saved ? "Saved" : "Log today"}
        </button>
      </div>
    </div>
  );
}
