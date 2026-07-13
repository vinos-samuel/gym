import {
  getActiveWorkout,
  getNextProgramDayId,
  getProgramDayWithExercises,
  getSetsForWorkout,
  getLastSessionSets,
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
    workout = { id: workoutId, program_day_id: programDayId };
  }

  const { day, exercises } = await getProgramDayWithExercises(programDayId);
  const loggedSets = await getSetsForWorkout(workout.id);

  const exercisesWithHistory = await Promise.all(
    exercises.map(async (exercise) => ({
      ...exercise,
      lastSets: await getLastSessionSets(exercise.exercise_id),
      loggedSets: loggedSets.filter((s) => s.exercise_id === exercise.exercise_id),
    }))
  );

  return <WorkoutSession workoutId={workout.id} dayName={day.name} exercises={exercisesWithHistory} />;
}
