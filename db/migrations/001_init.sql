-- GYM schema. Single-tenant (no RLS/user_id) — the app layer's session cookie
-- is the security boundary, since there is exactly one user.

CREATE TABLE programs (
  id serial PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE program_days (
  id serial PRIMARY KEY,
  program_id integer NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_order integer NOT NULL,
  name text NOT NULL,
  UNIQUE (program_id, day_order)
);

CREATE TABLE exercises (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  muscle_group text NOT NULL,
  equipment text NOT NULL,
  tracking_type text NOT NULL DEFAULT 'reps' CHECK (tracking_type IN ('reps', 'seconds', 'meters')),
  illustration_path text,
  form_cue text,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE day_exercises (
  id serial PRIMARY KEY,
  program_day_id integer NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_id integer NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_in_day integer NOT NULL,
  target_sets integer NOT NULL,
  target_rep_low integer NOT NULL,
  target_rep_high integer NOT NULL,
  progression_increment_kg numeric(5,2) NOT NULL DEFAULT 2.5,
  notes text,
  UNIQUE (program_day_id, order_in_day)
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  program_day_id integer NOT NULL REFERENCES program_days(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text
);

CREATE TABLE sets (
  id serial PRIMARY KEY,
  workout_id integer NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id integer NOT NULL REFERENCES exercises(id),
  set_number integer NOT NULL,
  weight_kg numeric(6,2) NOT NULL,
  reps integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  client_id text UNIQUE -- idempotency key so offline-queue retries never double-log a set
);

CREATE TABLE body_metrics (
  id serial PRIMARY KEY,
  metric_date date NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('bodyweight_kg', 'waist_cm')),
  value numeric(6,2) NOT NULL,
  UNIQUE (metric_date, metric_type)
);

CREATE TABLE nutrition_log (
  id serial PRIMARY KEY,
  log_date date NOT NULL UNIQUE,
  kcal integer NOT NULL,
  protein_g integer NOT NULL
);

CREATE TABLE profile (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  height_cm numeric(5,1),
  target_kcal_low integer,
  target_kcal_high integer,
  target_protein_low integer,
  target_protein_high integer,
  activity_notes text,
  health_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Empty until the blood report is uploaded; structure exists from day 1.
CREATE TABLE biomarkers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  value numeric,
  unit text,
  reference_range text,
  measured_date date NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sets_workout ON sets(workout_id);
CREATE INDEX idx_sets_exercise_completed ON sets(exercise_id, completed_at DESC);
CREATE INDEX idx_workouts_program_day ON workouts(program_day_id, started_at DESC);
CREATE INDEX idx_day_exercises_day ON day_exercises(program_day_id, order_in_day);
