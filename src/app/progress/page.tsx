import Link from "next/link";
import {
  getLatestBodyMetrics,
  getBodyMetricSeries,
  getExercisesWithHistory,
  getExerciseSessionHistory,
  getExerciseRecentSessionSets,
  getCurrentTargetsForExercise,
} from "@/lib/queries";
import { computeProgressionSuggestion } from "@/lib/progression";
import { BodyMetricsEntry } from "@/components/BodyMetricsEntry";
import { ExerciseTrendCard } from "@/components/ExerciseTrendCard";

export const dynamic = "force-dynamic";

function estimate1RM(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export default async function ProgressPage() {
  const [latest, bodyweightSeries, waistSeries, exercises] = await Promise.all([
    getLatestBodyMetrics(),
    getBodyMetricSeries("bodyweight_kg"),
    getBodyMetricSeries("waist_cm"),
    getExercisesWithHistory(),
  ]);

  const exerciseCards = await Promise.all(
    exercises.map(async (exercise) => {
      const [sessionHistory, recentSessionSets, targets] = await Promise.all([
        getExerciseSessionHistory(exercise.id),
        getExerciseRecentSessionSets(exercise.id, 4),
        getCurrentTargetsForExercise(exercise.id),
      ]);

      const series = sessionHistory.map((s) => ({
        date: s.date,
        value: estimate1RM(s.weightKg, s.reps),
      }));

      const latestTopSet = sessionHistory[sessionHistory.length - 1] ?? null;

      const suggestion = targets
        ? computeProgressionSuggestion(recentSessionSets, targets)
        : ({ type: "insufficient_data" } as const);

      return { id: exercise.id, name: exercise.name, series, latestTopSet, suggestion };
    })
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-zinc-50 px-4 pb-10 pt-6 dark:bg-zinc-950">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Progress</h1>
        <Link href="/" className="text-sm font-medium text-accent">
          ← Today
        </Link>
      </header>

      <BodyMetricsEntry
        latestBodyweight={latest.bodyweight_kg}
        latestWaist={latest.waist_cm}
        bodyweightSeries={bodyweightSeries}
        waistSeries={waistSeries}
      />

      {exerciseCards.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Log a few more sessions and exercise trends will show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-500">Exercises</h2>
          {exerciseCards.map((card) => (
            <ExerciseTrendCard
              key={card.id}
              name={card.name}
              series={card.series}
              latestTopSet={card.latestTopSet}
              suggestion={card.suggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
