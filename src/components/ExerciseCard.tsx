"use client";

import { useState } from "react";
import { NumberStepper } from "./NumberStepper";
import type { DayExercise, SetRow } from "@/lib/queries";

type LoggedSet = { setNumber: number; weightKg: number; reps: number };

const trackingLabel: Record<DayExercise["tracking_type"], string> = {
  reps: "Reps",
  seconds: "Sec",
  meters: "Meters",
};

const trackingStep: Record<DayExercise["tracking_type"], number> = {
  reps: 1,
  seconds: 5,
  meters: 5,
};

export function ExerciseCard({
  exercise,
  lastSets,
  loggedSets,
  onLogSet,
  onEditSet,
}: {
  exercise: DayExercise;
  lastSets: SetRow[];
  loggedSets: LoggedSet[];
  onLogSet: (setNumber: number, weightKg: number, reps: number) => void;
  onEditSet: (setNumber: number, weightKg: number, reps: number) => void;
}) {
  const nextSetNumber = loggedSets.length + 1;
  const isDone = nextSetNumber > exercise.target_sets;

  const prefillFor = (setNumber: number) => {
    const matching = lastSets.find((s) => s.set_number === setNumber);
    const fallback = lastSets[lastSets.length - 1];
    const source = matching ?? fallback;
    return {
      weightKg: source ? Number(source.weight_kg) : 0,
      reps: source ? source.reps : exercise.target_rep_low,
    };
  };

  const prefill = prefillFor(nextSetNumber <= exercise.target_sets ? nextSetNumber : exercise.target_sets);
  const [weight, setWeight] = useState(prefill.weightKg);
  const [reps, setReps] = useState(prefill.reps);
  const [expanded, setExpanded] = useState(false);
  const [editingSetNumber, setEditingSetNumber] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState(0);
  const [editReps, setEditReps] = useState(0);

  function startEditing(setNumber: number, current: LoggedSet) {
    setEditingSetNumber(setNumber);
    setEditWeight(current.weightKg);
    setEditReps(current.reps);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        {exercise.illustration_path && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exercise.illustration_path}
              alt=""
              width={56}
              height={56}
              className="rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{exercise.name}</h3>
          <p className="text-sm text-zinc-500">
            {exercise.target_sets} × {exercise.target_rep_low}–{exercise.target_rep_high}{" "}
            {trackingLabel[exercise.tracking_type].toLowerCase()}
            {exercise.notes ? ` · ${exercise.notes}` : ""}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
          {exercise.form_cue}
          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline"
            >
              Watch form
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: exercise.target_sets }, (_, i) => i + 1).map((setNumber) => {
          const logged = loggedSets.find((s) => s.setNumber === setNumber);
          if (logged && editingSetNumber === setNumber) {
            return (
              <div
                key={setNumber}
                className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <span className="text-sm font-medium text-zinc-500">Editing set {setNumber}</span>
                <div className="flex items-center gap-6">
                  <NumberStepper value={editWeight} onChange={setEditWeight} step={2.5} label="kg" />
                  <NumberStepper
                    value={editReps}
                    onChange={setEditReps}
                    step={trackingStep[exercise.tracking_type]}
                    label={trackingLabel[exercise.tracking_type]}
                  />
                </div>
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSetNumber(null)}
                    className="flex-1 rounded-xl bg-zinc-100 py-3 text-base font-medium text-zinc-900 active:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:active:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onEditSet(setNumber, editWeight, editReps);
                      setEditingSetNumber(null);
                    }}
                    className="flex-1 rounded-xl bg-zinc-900 py-3 text-base font-medium text-zinc-50 active:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-950 dark:active:bg-zinc-300"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          }
          if (logged) {
            return (
              <button
                key={setNumber}
                type="button"
                onClick={() => startEditing(setNumber, logged)}
                className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500 active:bg-zinc-100 dark:bg-zinc-800/50 dark:active:bg-zinc-800"
              >
                <span>Set {setNumber}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  ✓ {logged.weightKg}kg × {logged.reps}
                </span>
              </button>
            );
          }
          if (setNumber !== nextSetNumber) {
            return (
              <div
                key={setNumber}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600"
              >
                Set {setNumber}
              </div>
            );
          }
          return (
            <div
              key={setNumber}
              className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <span className="text-sm font-medium text-zinc-500">Set {setNumber}</span>
              <div className="flex items-center gap-6">
                <NumberStepper value={weight} onChange={setWeight} step={2.5} label="kg" />
                <NumberStepper
                  value={reps}
                  onChange={setReps}
                  step={trackingStep[exercise.tracking_type]}
                  label={trackingLabel[exercise.tracking_type]}
                />
              </div>
              <button
                type="button"
                onClick={() => onLogSet(setNumber, weight, reps)}
                className="w-full rounded-xl bg-zinc-900 py-3 text-base font-medium text-zinc-50 active:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-950 dark:active:bg-zinc-300"
              >
                Log set
              </button>
            </div>
          );
        })}
        {isDone && (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-600">All sets done</p>
        )}
      </div>
    </div>
  );
}
