import { db } from "./db";

// node-postgres parses Postgres `date` columns into JS Date objects by
// default, despite every type in this file declaring `date: string` — that
// mismatch only surfaces once a Date object gets rendered directly as a
// React child (crashes with "Objects are not valid as a React child"), which
// JSON.stringify-based debugging never reveals since it silently stringifies
// Dates. Every date-typed query result is normalized through this so the
// `string` types are actually true at runtime, not just on paper.
function toDateString(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : (value as string);
}

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

export type ExerciseLibraryItem = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  tracking_type: TrackingType;
  illustration_path: string | null;
  form_cue: string | null;
  video_url: string | null;
};

export async function getAllExercises(): Promise<ExerciseLibraryItem[]> {
  const { rows } = await db.query<ExerciseLibraryItem>(
    `SELECT id, name, muscle_group, equipment, tracking_type, illustration_path, form_cue, video_url
     FROM exercises ORDER BY name`
  );
  return rows;
}

export async function getWorkoutSubstitutions(workoutId: number): Promise<Map<number, number>> {
  const { rows } = await db.query<{ day_exercise_id: number; substitute_exercise_id: number }>(
    `SELECT day_exercise_id, substitute_exercise_id FROM workout_substitutions WHERE workout_id = $1`,
    [workoutId]
  );
  return new Map(rows.map((r) => [r.day_exercise_id, r.substitute_exercise_id]));
}

export async function setWorkoutSubstitution(
  workoutId: number,
  dayExerciseId: number,
  substituteExerciseId: number
): Promise<void> {
  await db.query(
    `INSERT INTO workout_substitutions (workout_id, day_exercise_id, substitute_exercise_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (workout_id, day_exercise_id) DO UPDATE SET substitute_exercise_id = EXCLUDED.substitute_exercise_id`,
    [workoutId, dayExerciseId, substituteExerciseId]
  );
}

export async function removeWorkoutSubstitution(workoutId: number, dayExerciseId: number): Promise<void> {
  await db.query(`DELETE FROM workout_substitutions WHERE workout_id = $1 AND day_exercise_id = $2`, [
    workoutId,
    dayExerciseId,
  ]);
}

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

export type ProgramDay = {
  id: number;
  name: string;
  day_order: number;
  warmup_text: string | null;
  cooldown_text: string | null;
};

export async function getProgramDayWithExercises(
  programDayId: number
): Promise<{ day: ProgramDay; exercises: DayExercise[] }> {
  const day = await db.query<ProgramDay>(
    `SELECT id, name, day_order, warmup_text, cooldown_text FROM program_days WHERE id = $1`,
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

// ---- Body metrics ----

export type BodyMetricType = "bodyweight_kg" | "waist_cm";

export async function logBodyMetric(
  date: string,
  type: BodyMetricType,
  value: number
): Promise<void> {
  await db.query(
    `INSERT INTO body_metrics (metric_date, metric_type, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (metric_date, metric_type) DO UPDATE SET value = EXCLUDED.value`,
    [date, type, value]
  );
}

export async function getLatestBodyMetrics(): Promise<Record<BodyMetricType, number | null>> {
  const { rows } = await db.query<{ metric_type: BodyMetricType; value: string }>(
    `SELECT DISTINCT ON (metric_type) metric_type, value
     FROM body_metrics ORDER BY metric_type, metric_date DESC`
  );
  const result: Record<BodyMetricType, number | null> = { bodyweight_kg: null, waist_cm: null };
  for (const row of rows) result[row.metric_type] = Number(row.value);
  return result;
}

export async function getBodyMetricSeries(
  type: BodyMetricType,
  limit = 60
): Promise<{ date: string; value: number }[]> {
  const { rows } = await db.query<{ date: string; value: string }>(
    `SELECT metric_date AS date, value FROM body_metrics
     WHERE metric_type = $1 ORDER BY metric_date DESC LIMIT $2`,
    [type, limit]
  );
  return rows.map((r) => ({ date: toDateString(r.date), value: Number(r.value) })).reverse();
}

// ---- Progress / trends ----

export type SessionTopSet = { workoutId: number; date: string; weightKg: number; reps: number };
export type SessionSets = { workoutId: number; date: string; sets: { weightKg: number; reps: number }[] };

export async function getExercisesWithHistory(): Promise<{ id: number; name: string }[]> {
  const { rows } = await db.query<{ id: number; name: string }>(
    `SELECT DISTINCT e.id, e.name FROM exercises e
     JOIN sets s ON s.exercise_id = e.id
     JOIN workouts w ON w.id = s.workout_id AND w.completed_at IS NOT NULL
     ORDER BY e.name`
  );
  return rows;
}

export type ExerciseTargets = { targetRepHigh: number; targetSets: number; incrementKg: number };

/** All four "per exercise" progress queries below are batched across every
 * exercise in one query each, rather than one query per exercise. The
 * Progress page has ~20 exercises; querying each individually meant 60-80
 * concurrent round trips fighting over a 10-connection pool — this is what
 * made the page feel broken/unresponsive. */

export async function getAllExerciseSessionHistories(
  limit = 12
): Promise<Map<number, SessionTopSet[]>> {
  const { rows } = await db.query<{
    exercise_id: number;
    workout_id: number;
    date: string;
    weight_kg: string;
    reps: number;
  }>(
    `WITH top_sets AS (
       SELECT s.exercise_id, w.id AS workout_id, w.completed_at::date AS date, s.weight_kg, s.reps,
              ROW_NUMBER() OVER (
                PARTITION BY s.exercise_id, w.id ORDER BY s.weight_kg DESC, s.reps DESC
              ) AS rn
       FROM sets s JOIN workouts w ON w.id = s.workout_id
       WHERE w.completed_at IS NOT NULL
     ),
     ranked AS (
       SELECT exercise_id, workout_id, date, weight_kg, reps,
              ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY date DESC) AS session_rank
       FROM top_sets WHERE rn = 1
     )
     SELECT exercise_id, workout_id, date, weight_kg, reps
     FROM ranked WHERE session_rank <= $1
     ORDER BY exercise_id, date ASC`,
    [limit]
  );

  const result = new Map<number, SessionTopSet[]>();
  for (const r of rows) {
    if (!result.has(r.exercise_id)) result.set(r.exercise_id, []);
    result.get(r.exercise_id)!.push({
      workoutId: r.workout_id,
      date: toDateString(r.date),
      weightKg: Number(r.weight_kg),
      reps: r.reps,
    });
  }
  return result;
}

export async function getAllExerciseVolumeHistories(
  limit = 12
): Promise<Map<number, { date: string; volume: number }[]>> {
  const { rows } = await db.query<{ exercise_id: number; date: string; volume: string }>(
    `WITH vol AS (
       SELECT s.exercise_id, w.id AS workout_id, w.completed_at::date AS date,
              SUM(s.weight_kg * s.reps) AS volume
       FROM sets s JOIN workouts w ON w.id = s.workout_id
       WHERE w.completed_at IS NOT NULL
       GROUP BY s.exercise_id, w.id, w.completed_at
     ),
     ranked AS (
       SELECT *, ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY date DESC) AS session_rank
       FROM vol
     )
     SELECT exercise_id, date, volume FROM ranked WHERE session_rank <= $1
     ORDER BY exercise_id, date ASC`,
    [limit]
  );

  const result = new Map<number, { date: string; volume: number }[]>();
  for (const r of rows) {
    if (!result.has(r.exercise_id)) result.set(r.exercise_id, []);
    result.get(r.exercise_id)!.push({ date: toDateString(r.date), volume: Number(r.volume) });
  }
  return result;
}

export async function getAllExerciseRecentSessionSets(
  sessionLimit = 4
): Promise<Map<number, SessionSets[]>> {
  const { rows } = await db.query<{
    exercise_id: number;
    workout_id: number;
    date: string;
    weight_kg: string;
    reps: number;
  }>(
    `WITH session_rank AS (
       SELECT DISTINCT s.exercise_id, w.id AS workout_id, w.completed_at::date AS date,
              DENSE_RANK() OVER (PARTITION BY s.exercise_id ORDER BY w.completed_at DESC) AS rnk
       FROM sets s JOIN workouts w ON w.id = s.workout_id
       WHERE w.completed_at IS NOT NULL
     )
     SELECT s.exercise_id, sr.workout_id, sr.date, s.weight_kg, s.reps
     FROM sets s
     JOIN session_rank sr ON sr.workout_id = s.workout_id AND sr.exercise_id = s.exercise_id
     WHERE sr.rnk <= $1
     ORDER BY s.exercise_id, sr.date ASC, s.set_number ASC`,
    [sessionLimit]
  );

  const result = new Map<number, Map<number, SessionSets>>();
  for (const r of rows) {
    if (!result.has(r.exercise_id)) result.set(r.exercise_id, new Map());
    const byWorkout = result.get(r.exercise_id)!;
    if (!byWorkout.has(r.workout_id)) {
      byWorkout.set(r.workout_id, { workoutId: r.workout_id, date: toDateString(r.date), sets: [] });
    }
    byWorkout.get(r.workout_id)!.sets.push({ weightKg: Number(r.weight_kg), reps: r.reps });
  }

  const flattened = new Map<number, SessionSets[]>();
  for (const [exerciseId, byWorkout] of result) {
    flattened.set(exerciseId, [...byWorkout.values()]);
  }
  return flattened;
}

export async function getAllCurrentTargets(): Promise<Map<number, ExerciseTargets>> {
  const { rows } = await db.query<{
    exercise_id: number;
    target_rep_high: number;
    target_sets: number;
    increment: string;
  }>(
    `SELECT DISTINCT ON (exercise_id) exercise_id, target_rep_high, target_sets,
            progression_increment_kg AS increment
     FROM day_exercises ORDER BY exercise_id, id`
  );
  const result = new Map<number, ExerciseTargets>();
  for (const r of rows) {
    result.set(r.exercise_id, {
      targetRepHigh: r.target_rep_high,
      targetSets: r.target_sets,
      incrementKg: Number(r.increment),
    });
  }
  return result;
}
