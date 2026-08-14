"use client";

import { useState } from "react";
import type { DayExercise, ExerciseLibraryItem, ProgramDay } from "@/lib/queries";

type ProgramDayWithExercises = { day: ProgramDay; exercises: DayExercise[] };

export function ProgramEditor({
  program,
  allExercises,
}: {
  program: ProgramDayWithExercises[];
  allExercises: ExerciseLibraryItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {program.map(({ day, exercises }) => (
        <DaySection key={day.id} day={day} exercises={exercises} allExercises={allExercises} />
      ))}
    </div>
  );
}

function DaySection({
  day,
  exercises,
  allExercises,
}: {
  day: ProgramDay;
  exercises: DayExercise[];
  allExercises: ExerciseLibraryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    window.location.reload();
  }

  async function handleAdd(exerciseId: number) {
    setBusy(true);
    await fetch("/api/program/day-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programDayId: day.id,
        exerciseId,
        targetSets: 3,
        targetRepLow: 8,
        targetRepHigh: 12,
        incrementKg: 2.5,
      }),
    });
    setAdding(false);
    await refresh();
  }

  const existingIds = new Set(exercises.map((e) => e.exercise_id));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4"
      >
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">{day.name}</span>
        <span className="text-sm text-zinc-400">
          {exercises.length} exercises {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
          {exercises.map((exercise, i) => (
            <ExerciseRow
              key={exercise.day_exercise_id}
              exercise={exercise}
              isFirst={i === 0}
              isLast={i === exercises.length - 1}
              onChanged={refresh}
              busy={busy}
              setBusy={setBusy}
            />
          ))}

          {adding ? (
            <select
              autoFocus
              defaultValue=""
              disabled={busy}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) void handleAdd(id);
              }}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="" disabled>
                Choose an exercise…
              </option>
              {allExercises
                .filter((e) => !existingIds.has(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-2 self-start text-sm font-medium text-accent underline"
            >
              + Add exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({
  exercise,
  isFirst,
  isLast,
  onChanged,
  busy,
  setBusy,
}: {
  exercise: DayExercise;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState(exercise.target_sets);
  const [repLow, setRepLow] = useState(exercise.target_rep_low);
  const [repHigh, setRepHigh] = useState(exercise.target_rep_high);
  const [increment, setIncrement] = useState(Number(exercise.progression_increment_kg));

  async function handleReorder(direction: "up" | "down") {
    setBusy(true);
    await fetch("/api/program/day-exercises/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayExerciseId: exercise.day_exercise_id, direction }),
    });
    onChanged();
  }

  async function handleSave() {
    setBusy(true);
    await fetch(`/api/program/day-exercises/${exercise.day_exercise_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetSets: sets,
        targetRepLow: repLow,
        targetRepHigh: repHigh,
        incrementKg: increment,
      }),
    });
    onChanged();
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${exercise.name} from this day? (Its logged history is kept.)`)) return;
    setBusy(true);
    await fetch(`/api/program/day-exercises/${exercise.day_exercise_id}`, { method: "DELETE" });
    onChanged();
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent-soft/30 p-3">
        <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{exercise.name}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
            Sets
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
            Increment (kg)
            <input
              type="number"
              step="0.5"
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
            Rep low
            <input
              type="number"
              value={repLow}
              onChange={(e) => setRepLow(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
            Rep high
            <input
              type="number"
              value={repHigh}
              onChange={(e) => setRepHigh(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{exercise.name}</p>
        <p className="text-xs text-zinc-500">
          {exercise.target_sets} × {exercise.target_rep_low}–{exercise.target_rep_high} · +
          {exercise.progression_increment_kg}kg
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={busy || isFirst}
          onClick={() => handleReorder("up")}
          aria-label="Move up"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 disabled:opacity-30 dark:bg-zinc-800 dark:text-zinc-400"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={busy || isLast}
          onClick={() => handleReorder("down")}
          aria-label="Move down"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 disabled:opacity-30 dark:bg-zinc-800 dark:text-zinc-400"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          aria-label="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-red-500 dark:bg-zinc-800"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
