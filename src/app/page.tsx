import {
  getActiveWorkout,
  getNextProgramDayId,
  getProgramDayWithExercises,
  getSetsForWorkout,
  getLastSessionSets,
  getAllExercises,
  getWorkoutSubstitutions,
  createWorkout,
} from "@/lib/queries";
import { WorkoutSession } from "@/components/WorkoutSession";

// This page creates a workout row as a side effect and always reflects live
// DB state — it must never be statically prerendered or cached.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  let workout = await getActiveWorkout();

  const programDayId = workout ? workout.program_day_id : await getNextProgramDayId();
  if (!workout) {
    const workoutId = await createWorkout(programDayId);
    workout = { id: workoutId, program_day_id: programDayId, notes: null };
  }

  const [{ day, exercises }, loggedSets, allExercises, substitutions] = await Promise.all([
    getProgramDayWithExercises(programDayId),
    getSetsForWorkout(workout.id),
    getAllExercises(),
    getWorkoutSubstitutions(workout.id),
  ]);

  const exercisesById = new Map(allExercises.map((e) => [e.id, e]));

  const exercisesWithHistory = await Promise.all(
    exercises.map(async (exercise) => {
      const substituteId = substitutions.get(exercise.day_exercise_id);
      const substitute = substituteId ? exercisesById.get(substituteId) : undefined;

      // The slot's targets (sets/reps/increment) always come from the program;
      // only the "which exercise" identity fields swap when substituted.
      const effective = {
        ...exercise,
        exercise_id: substitute?.id ?? exercise.exercise_id,
        name: substitute?.name ?? exercise.name,
        muscle_group: substitute?.muscle_group ?? exercise.muscle_group,
        equipment: substitute?.equipment ?? exercise.equipment,
        tracking_type: substitute?.tracking_type ?? exercise.tracking_type,
        illustration_path: substitute?.illustration_path ?? exercise.illustration_path,
        form_cue: substitute?.form_cue ?? exercise.form_cue,
        video_url: substitute?.video_url ?? exercise.video_url,
      };

      return {
        ...effective,
        originalExerciseId: exercise.exercise_id,
        isSubstituted: Boolean(substitute),
        lastSets: await getLastSessionSets(effective.exercise_id),
        loggedSets: loggedSets.filter((s) => s.exercise_id === effective.exercise_id),
      };
    })
  );

  return (
    <WorkoutSession
      workoutId={workout.id}
      dayName={day.name}
      warmupText={day.warmup_text}
      cooldownText={day.cooldown_text}
      exercises={exercisesWithHistory}
      allExercises={allExercises}
      initialNotes={workout.notes ?? ""}
    />
  );
}
