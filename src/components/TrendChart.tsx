"use client";

import { useState } from "react";

type Point = { date: string; value: number };

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export function TrendChart({ data, unit }: { data: Point[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-stone-400 dark:text-stone-600">No data yet.</p>;
  }
  if (data.length === 1) {
    return (
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
        {data[0].value}
        <span className="ml-1 text-sm font-normal text-stone-500">{unit}</span>
      </p>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * plotW,
    y: PAD_TOP + plotH - ((d.value - min) / range) * plotH,
    ...d,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];
  const shown = active !== null ? coords[active] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img">
        <title>
          {unit} trend from {data[0].date} to {data[data.length - 1].date}
        </title>
        <line
          x1={PAD_X}
          y1={PAD_TOP + plotH}
          x2={WIDTH - PAD_X}
          y2={PAD_TOP + plotH}
          stroke="currentColor"
          className="text-stone-200 dark:text-stone-800"
          strokeWidth={1}
        />
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === active ? 6 : 4}
            fill="var(--accent)"
            className="cursor-pointer"
            onClick={() => setActive(i === active ? null : i)}
          />
        ))}
        <text x={last.x} y={PAD_TOP - 4} textAnchor="end" fontSize="13" fontWeight="600" fill="var(--accent)">
          {last.value}
          {unit}
        </text>
        <text x={PAD_X} y={HEIGHT - 6} fontSize="10" fill="currentColor" className="text-stone-400 dark:text-stone-600">
          {formatDate(data[0].date)}
        </text>
        <text
          x={WIDTH - PAD_X}
          y={HEIGHT - 6}
          textAnchor="end"
          fontSize="10"
          fill="currentColor"
          className="text-stone-400 dark:text-stone-600"
        >
          {formatDate(data[data.length - 1].date)}
        </text>
      </svg>
      {shown && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-stone-900 px-2 py-1 text-xs text-stone-50 dark:bg-stone-50 dark:text-stone-950">
          {formatDate(shown.date)}: {shown.value}
          {unit}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
