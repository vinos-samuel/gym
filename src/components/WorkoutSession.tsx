"use client";

import { useEffect, useMemo, useState } from "react";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";
import { initOfflineQueueSync, logSetWithQueue, subscribePendingCount } from "@/lib/offlineQueue";
import type { DayExercise, SetRow } from "@/lib/queries";

const REST_SECONDS = 90;

type LoggedSet = { setNumber: number; weightKg: number; reps: number };
type ExerciseWithHistory = DayExercise & { lastSets: SetRow[]; loggedSets: SetRow[] };

export function WorkoutSession({
  workoutId,
  dayName,
  exercises,
}: {
  workoutId: number;
  dayName: string;
  exercises: ExerciseWithHistory[];
}) {
  const [loggedByExercise, setLoggedByExercise] = useState<Record<number, LoggedSet[]>>(() => {
    const initial: Record<number, LoggedSet[]> = {};
    for (const ex of exercises) {
      initial[ex.exercise_id] = ex.loggedSets.map((s) => ({
        setNumber: s.set_number,
        weightKg: Number(s.weight_kg),
        reps: s.reps,
      }));
    }
    return initial;
  });
  const [restKey, setRestKey] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    initOfflineQueueSync();
    return subscribePendingCount(setPendingCount);
  }, []);

  const totalTarget = useMemo(() => exercises.reduce((sum, e) => sum + e.target_sets, 0), [exercises]);
  const totalLogged = useMemo(
    () => Object.values(loggedByExercise).reduce((sum, sets) => sum + sets.length, 0),
    [loggedByExercise]
  );

  function handleLogSet(exercise: ExerciseWithHistory, setNumber: number, weightKg: number, reps: number) {
    setLoggedByExercise((prev) => ({
      ...prev,
      [exercise.exercise_id]: [...(prev[exercise.exercise_id] ?? []), { setNumber, weightKg, reps }],
    }));
    setShowRest(true);
    setRestKey((k) => k + 1);

    void logSetWithQueue({
      clientId: crypto.randomUUID(),
      workoutId,
      exerciseId: exercise.exercise_id,
      setNumber,
      weightKg,
      reps,
    });
  }

  async function handleFinish() {
    const message =
      totalLogged < totalTarget
        ? `You've only logged ${totalLogged} of ${totalTarget} sets. Finish workout anyway?`
        : "Finish workout?";
    if (!window.confirm(message)) return;

    setFinishing(true);
    try {
      await fetch("/api/workouts/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId }),
      });
    } catch {
      // best-effort; workout stays "active" and will resume next visit if this fails
    }
    setFinished(true);
    setFinishing(false);
  }

  async function handleUndoFinish() {
    setFinishing(true);
    try {
      await fetch("/api/workouts/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId }),
      });
      window.location.reload();
    } catch {
      setFinishing(false);
    }
  }

  if (finished) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-zinc-950">
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nice work.</p>
        <p className="text-zinc-500">
          {totalLogged} of {totalTarget} sets logged. See you next session.
        </p>
        <button
          type="button"
          onClick={handleUndoFinish}
          disabled={finishing}
          className="mt-4 text-sm text-zinc-400 underline disabled:opacity-50 dark:text-zinc-600"
        >
          {finishing ? "Reopening…" : "Not done — keep logging"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-zinc-50 px-4 pb-28 pt-6 dark:bg-zinc-950">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{dayName}</h1>
          <p className="text-sm text-zinc-500">
            {totalLogged}/{totalTarget} sets
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Syncing {pendingCount}
          </span>
        )}
      </header>

      {showRest && <RestTimer key={restKey} durationSeconds={REST_SECONDS} onDismiss={() => setShowRest(false)} />}

      <div className="flex flex-col gap-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.exercise_id}
            exercise={exercise}
            lastSets={exercise.lastSets}
            loggedSets={loggedByExercise[exercise.exercise_id] ?? []}
            onLogSet={(setNumber, weightKg, reps) => handleLogSet(exercise, setNumber, weightKg, reps)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={handleFinish}
          disabled={finishing}
          className="w-full rounded-xl bg-zinc-900 py-4 text-base font-medium text-zinc-50 active:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:active:bg-zinc-300"
        >
          {finishing ? "Finishing…" : "Finish workout"}
        </button>
      </div>
    </div>
  );
}
