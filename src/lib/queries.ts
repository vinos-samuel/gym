import { db } from "./db";

export type TrackingType = "reps" | "seconds" | "meters";

export type DayExercise = {
  day_exercise_id: number;
  order_in_day: number;
  target_sets: number;
  target_rep_low: number;
  target_rep_high: number;
  progression_increment_kg: string;
  notes: string | null;
  exercise_id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  tracking_type: TrackingType;
  illustration_path: string | null;
  form_cue: string | null;
  video_url: string | null;
};

export type SetRow = {
  id: number;
  exercise_id: number;
  set_number: number;
  weight_kg: string;
  reps: number;
  completed_at: string;
  client_id: string | null;
};

export async function getActiveWorkout(): Promise<{
  id: number;
  program_day_id: number;
  notes: string | null;
} | null> {
  const { rows } = await db.query<{ id: number; program_day_id: number; notes: string | null }>(
    `SELECT id, program_day_id, notes FROM workouts WHERE completed_at IS NULL ORDER BY started_at DESC LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function updateWorkoutNotes(workoutId: number, notes: string): Promise<void> {
  await db.query(`UPDATE workouts SET notes = $1 WHERE id = $2`, [notes, workoutId]);
}

export async function getNextProgramDayId(): Promise<number> {
  const activeProgram = await db.query<{ id: number }>(
    `SELECT id FROM programs WHERE is_active = true ORDER BY id LIMIT 1`
  );
  const programId = activeProgram.rows[0]?.id;
  if (!programId) throw new Error("No active program found");

  const dayCountResult = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM program_days WHERE program_id = $1`,
    [programId]
  );
  const dayCount = dayCountResult.rows[0].count;

  const lastCompleted = await db.query<{ day_order: number }>(
    `SELECT pd.day_order
     FROM workouts w
     JOIN program_days pd ON pd.id = w.program_day_id
     WHERE w.completed_at IS NOT NULL AND pd.program_id = $1
     ORDER BY w.completed_at DESC
     LIMIT 1`,
    [programId]
  );

  const nextDayOrder =
    lastCompleted.rows.length === 0 ? 1 : (lastCompleted.rows[0].day_order % dayCount) + 1;

  const next = await db.query<{ id: number }>(
    `SELECT id FROM program_days WHERE program_id = $1 AND day_order = $2`,
    [programId, nextDayOrder]
  );
  return next.rows[0].id;
}

export async function getProgramDayWithExercises(
  programDayId: number
): Promise<{ day: { id: number; name: string; day_order: number }; exercises: DayExercise[] }> {
  const day = await db.query<{ id: number; name: string; day_order: number }>(
    `SELECT id, name, day_order FROM program_days WHERE id = $1`,
    [programDayId]
  );
  const exercises = await db.query<DayExercise>(
    `SELECT de.id AS day_exercise_id, de.order_in_day, de.target_sets, de.target_rep_low, de.target_rep_high,
            de.progression_increment_kg, de.notes,
            e.id AS exercise_id, e.name, e.muscle_group, e.equipment, e.tracking_type,
            e.illustration_path, e.form_cue, e.video_url
     FROM day_exercises de
     JOIN exercises e ON e.id = de.exercise_id
     WHERE de.program_day_id = $1
     ORDER BY de.order_in_day`,
    [programDayId]
  );
  return { day: day.rows[0], exercises: exercises.rows };
}

export async function getLastSessionSets(exerciseId: number): Promise<SetRow[]> {
  const { rows } = await db.query<SetRow>(
    `SELECT s.id, s.exercise_id, s.set_number, s.weight_kg, s.reps, s.completed_at, s.client_id
     FROM sets s
     WHERE s.exercise_id = $1
       AND s.workout_id = (
         SELECT s2.workout_id FROM sets s2
         WHERE s2.exercise_id = $1
         ORDER BY s2.completed_at DESC
         LIMIT 1
       )
     ORDER BY s.set_number`,
    [exerciseId]
  );
  return rows;
}

export async function getSetsForWorkout(workoutId: number): Promise<SetRow[]> {
  const { rows } = await db.query<SetRow>(
    `SELECT id, exercise_id, set_number, weight_kg, reps, completed_at, client_id
     FROM sets WHERE workout_id = $1 ORDER BY exercise_id, set_number`,
    [workoutId]
  );
  return rows;
}

export async function createWorkout(programDayId: number): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO workouts (program_day_id) VALUES ($1) RETURNING id`,
    [programDayId]
  );
  return rows[0].id;
}

export async function completeWorkout(workoutId: number): Promise<void> {
  await db.query(`UPDATE workouts SET completed_at = now() WHERE id = $1`, [workoutId]);
}

export async function reopenWorkout(workoutId: number): Promise<void> {
  await db.query(`UPDATE workouts SET completed_at = NULL WHERE id = $1`, [workoutId]);
}

export async function logSet(params: {
  workoutId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  clientId: string;
}): Promise<number | null> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO sets (workout_id, exercise_id, set_number, weight_kg, reps, client_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (client_id) DO NOTHING
     RETURNING id`,
    [params.workoutId, params.exerciseId, params.setNumber, params.weightKg, params.reps, params.clientId]
  );
  return rows[0]?.id ?? null;
}

export async function updateSet(params: {
  workoutId: number;
  exerciseId: number;
  setNumber: number;
  weightKg: number;
  reps: number;
}): Promise<void> {
  await db.query(
    `UPDATE sets SET weight_kg = $1, reps = $2
     WHERE workout_id = $3 AND exercise_id = $4 AND set_number = $5`,
    [params.weightKg, params.reps, params.workoutId, params.exerciseId, params.setNumber]
  );
}
