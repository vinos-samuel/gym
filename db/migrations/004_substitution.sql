-- Exercise substitution: swap an exercise for the current session without
-- touching the program. Requested after "Did abdominal crunch instead of
-- dead bug today" got logged as a text note instead of real data, since
-- there was no way to log it as its own exercise.

INSERT INTO exercises (name, muscle_group, equipment, tracking_type, illustration_path, form_cue, video_url)
VALUES (
  'Ab crunch',
  'Core (anterior)',
  'Bodyweight',
  'reps',
  '/exercises/ab-crunch.svg',
  'Curl shoulders toward hips, don''t pull on your neck',
  'https://www.youtube.com/results?search_query=ab+crunch+form'
);

-- Tracks which exercise was actually performed for a given program day
-- slot, when it differs from what's programmed. Sets already carry the
-- real exercise_id (that never changes), so this is purely a per-workout
-- label used to render the swapped-in exercise's card correctly.
CREATE TABLE workout_substitutions (
  id serial PRIMARY KEY,
  workout_id integer NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  day_exercise_id integer NOT NULL REFERENCES day_exercises(id),
  substitute_exercise_id integer NOT NULL REFERENCES exercises(id),
  UNIQUE (workout_id, day_exercise_id)
);
