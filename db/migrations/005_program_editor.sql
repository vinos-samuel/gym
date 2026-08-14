-- Removing an exercise from a program day (program editor) must not be
-- blocked by old workout_substitutions rows referencing that slot — the
-- real history (sets.exercise_id) is untouched either way, only the
-- "what was this slot substituted with" record becomes moot.
ALTER TABLE workout_substitutions DROP CONSTRAINT workout_substitutions_day_exercise_id_fkey;
ALTER TABLE workout_substitutions
  ADD CONSTRAINT workout_substitutions_day_exercise_id_fkey
  FOREIGN KEY (day_exercise_id) REFERENCES day_exercises(id) ON DELETE CASCADE;
