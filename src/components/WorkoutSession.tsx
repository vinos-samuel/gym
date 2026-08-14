"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";
import { initOfflineQueueSync, logSetWithQueue, subscribePendingCount } from "@/lib/offlineQueue";
import type { DayExercise, ExerciseLibraryItem, SetRow } from "@/lib/queries";

const REST_SECONDS = 90;

type LoggedSet = { setNumber: number; weightKg: number; reps: number };
type ExerciseWithHistory = DayExercise & {
  lastSets: SetRow[];
  loggedSets: SetRow[];
  originalExerciseId: number;
  isSubstituted: boolean;
};

export function WorkoutSession({
  workoutId,
  dayName,
  warmupText,
  cooldownText,
  exercises,
  allExercises,
  initialNotes,
}: {
  workoutId: number;
  dayName: string;
  warmupText: string | null;
  cooldownText: string | null;
  exercises: ExerciseWithHistory[];
  allExercises: ExerciseLibraryItem[];
  initialNotes: string;
}) {
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [notesOpen, setNotesOpen] = useState(initialNotes.length > 0);
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

  function handleEditSet(exercise: ExerciseWithHistory, setNumber: number, weightKg: number, reps: number) {
    setLoggedByExercise((prev) => ({
      ...prev,
      [exercise.exercise_id]: (prev[exercise.exercise_id] ?? []).map((s) =>
        s.setNumber === setNumber ? { setNumber, weightKg, reps } : s
      ),
    }));

    void fetch("/api/sets/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, exerciseId: exercise.exercise_id, setNumber, weightKg, reps }),
    });
  }

  async function handleSwap(dayExerciseId: number, substituteExerciseId: number) {
    setSwapping(true);
    await fetch("/api/workouts/substitute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, dayExerciseId, substituteExerciseId }),
    });
    window.location.reload();
  }

  async function handleRevertSwap(dayExerciseId: number) {
    setSwapping(true);
    await fetch("/api/workouts/substitute", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, dayExerciseId }),
    });
    window.location.reload();
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

  function handleSaveNotes() {
    void fetch("/api/workouts/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, notes }),
    });
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-2xl font-semibold text-success">Nice work.</p>
        <p className="text-stone-500">
          {totalLogged} of {totalTarget} sets logged. See you next session.
        </p>
        <button
          type="button"
          onClick={handleUndoFinish}
          disabled={finishing}
          className="mt-4 text-sm text-stone-400 underline disabled:opacity-50 dark:text-stone-600"
        >
          {finishing ? "Reopening…" : "Not done — keep logging"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 bg-background px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{dayName}</h1>
          <p
            className={`text-sm font-medium ${
              totalTarget > 0 && totalLogged >= totalTarget ? "text-success" : "text-stone-500"
            }`}
          >
            {totalLogged}/{totalTarget} sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              Syncing {pendingCount}
            </span>
          )}
          <Link
            href="/program"
            className="flex items-center justify-center rounded-lg bg-accent p-2 text-accent-foreground active:opacity-80"
            aria-label="Program"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 5h12M4 10h12M4 15h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <Link
            href="/progress"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground active:opacity-80"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 15V9M10 15V5M16 15V11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Progress
          </Link>
        </div>
      </header>

      {showRest && <RestTimer key={restKey} durationSeconds={REST_SECONDS} onDismiss={() => setShowRest(false)} />}

      {warmupText && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setWarmupOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Warm-up
            <span className="text-stone-400">{warmupOpen ? "−" : "+"}</span>
          </button>
          {warmupOpen && (
            <p className="border-t border-stone-200 px-3 py-2 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
              {warmupText}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.day_exercise_id}
            exercise={exercise}
            isSubstituted={exercise.isSubstituted}
            allExercises={allExercises}
            lastSets={exercise.lastSets}
            loggedSets={loggedByExercise[exercise.exercise_id] ?? []}
            onLogSet={(setNumber, weightKg, reps) => handleLogSet(exercise, setNumber, weightKg, reps)}
            onEditSet={(setNumber, weightKg, reps) => handleEditSet(exercise, setNumber, weightKg, reps)}
            onSwap={(substituteId) => handleSwap(exercise.day_exercise_id, substituteId)}
            onRevertSwap={() => handleRevertSwap(exercise.day_exercise_id)}
          />
        ))}
      </div>

      {swapping && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-stone-900 dark:bg-stone-900 dark:text-stone-50">
            Swapping…
          </div>
        </div>
      )}

      {cooldownText && (
        <div className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600 dark:bg-stone-900 dark:text-stone-400">
          <span className="font-medium text-stone-700 dark:text-stone-300">Cool-down: </span>
          {cooldownText}
        </div>
      )}

      {notesOpen ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="How did today go?"
          rows={2}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-600"
        />
      ) : (
        <button
          type="button"
          onClick={() => setNotesOpen(true)}
          className="self-start text-sm text-stone-400 underline dark:text-stone-600"
        >
          + Add note
        </button>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
        <button
          type="button"
          onClick={handleFinish}
          disabled={finishing}
          className="w-full rounded-xl bg-accent py-4 text-base font-medium text-accent-foreground active:opacity-80 disabled:opacity-50"
        >
          {finishing ? "Finishing…" : "Finish workout"}
        </button>
      </div>
    </div>
  );
}
