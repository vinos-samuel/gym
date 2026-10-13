-- Seed: exercise library, 4-day program (PRD Appendix A), profile baseline, initial body metrics.
-- Target weights are intentionally not seeded here — first logged session sets them per exercise.

INSERT INTO exercises (name, muscle_group, equipment, tracking_type, illustration_path, form_cue, video_url) VALUES
('Leg press', 'Quads, glutes', 'Machine', 'reps', '/exercises/leg-press.svg', 'Feet mid-platform, push through heels, don''t lock knees hard at top', 'https://www.youtube.com/results?search_query=leg+press+machine+form'),
('KB goblet squat', 'Quads, glutes', 'Kettlebell', 'reps', '/exercises/kb-goblet-squat.svg', 'Hold KB at chest, sit back and down, chest up, knees track toes', 'https://www.youtube.com/results?search_query=kettlebell+goblet+squat+form'),
('Leg extension', 'Quads', 'Machine', 'reps', '/exercises/leg-extension.svg', 'Control the negative, don''t slam the weight stack down', 'https://www.youtube.com/results?search_query=leg+extension+machine+form'),
('Seated leg curl', 'Hamstrings', 'Machine', 'reps', '/exercises/seated-leg-curl.svg', 'Full range, pause briefly at full contraction', 'https://www.youtube.com/results?search_query=seated+leg+curl+machine+form'),
('Standing calf raise', 'Calves', 'Machine', 'reps', '/exercises/standing-calf-raise.svg', 'Full stretch at bottom, pause at top', 'https://www.youtube.com/results?search_query=standing+calf+raise+machine+form'),
('Pallof press', 'Core (anti-rotation)', 'Cable', 'reps', '/exercises/pallof-press.svg', 'Resist rotation — hips and shoulders stay square to the front', 'https://www.youtube.com/results?search_query=pallof+press+form'),
('Machine chest press', 'Chest', 'Machine', 'reps', '/exercises/machine-chest-press.svg', 'Shoulder blades pinned back, press without locking elbows out', 'https://www.youtube.com/results?search_query=machine+chest+press+form'),
('Seated DB shoulder press', 'Shoulders', 'Dumbbell', 'reps', '/exercises/seated-db-shoulder-press.svg', 'Seated, core braced, press straight overhead not forward', 'https://www.youtube.com/results?search_query=seated+dumbbell+shoulder+press+form'),
('Incline DB press', 'Chest (upper)', 'Dumbbell', 'reps', '/exercises/incline-db-press.svg', '30-45° incline, press up and slightly back', 'https://www.youtube.com/results?search_query=incline+dumbbell+press+form'),
('Cable lateral raise', 'Shoulders', 'Cable', 'reps', '/exercises/cable-lateral-raise.svg', 'Lead with elbow, raise to shoulder height, control the descent', 'https://www.youtube.com/results?search_query=cable+lateral+raise+form'),
('Rope triceps pushdown', 'Triceps', 'Cable', 'reps', '/exercises/rope-triceps-pushdown.svg', 'Elbows pinned to sides, split the rope apart at the bottom', 'https://www.youtube.com/results?search_query=rope+triceps+pushdown+form'),
('Dead bug', 'Core (anterior)', 'Bodyweight', 'reps', '/exercises/dead-bug.svg', 'Lower back stays flat on the floor the whole rep', 'https://www.youtube.com/results?search_query=dead+bug+exercise+form'),
('Barbell RDL', 'Hamstrings, glutes, back', 'Barbell', 'reps', '/exercises/barbell-rdl.svg', 'Hinge at hips, soft knees, bar stays close to legs, flat back', 'https://www.youtube.com/results?search_query=barbell+RDL+romanian+deadlift+form'),
('Back extension', 'Lower back, glutes, hamstrings', 'Machine', 'reps', '/exercises/back-extension.svg', 'Hinge from the hips, don''t hyperextend the lower back at the top', 'https://www.youtube.com/results?search_query=back+extension+machine+form'),
('KB swing', 'Hamstrings, glutes', 'Kettlebell', 'reps', '/exercises/kb-swing.svg', 'Power from the hip hinge, not the arms — snap the hips forward', 'https://www.youtube.com/results?search_query=kettlebell+swing+form'),
('Side plank', 'Core (lateral)', 'Bodyweight', 'seconds', '/exercises/side-plank.svg', 'Straight line head to heels, hips lifted, don''t sag', 'https://www.youtube.com/results?search_query=side+plank+form'),
('Lat pulldown', 'Back (lats)', 'Machine', 'reps', '/exercises/lat-pulldown.svg', 'Pull to upper chest, drive elbows down and back', 'https://www.youtube.com/results?search_query=lat+pulldown+form'),
('KB gorilla row', 'Back (lats)', 'Kettlebell', 'reps', '/exercises/kb-gorilla-row.svg', 'Hip hinge stance, row one KB up while the other stays anchored', 'https://www.youtube.com/results?search_query=kettlebell+gorilla+row+form'),
('Seated cable row', 'Back', 'Machine', 'reps', '/exercises/seated-cable-row.svg', 'Chest up, pull to torso, squeeze shoulder blades together', 'https://www.youtube.com/results?search_query=seated+cable+row+form'),
('Face pull', 'Rear delts, upper back', 'Cable', 'reps', '/exercises/face-pull.svg', 'Pull to face height, elbows high, external rotation at the end', 'https://www.youtube.com/results?search_query=face+pull+cable+form'),
('DB curl', 'Biceps', 'Dumbbell', 'reps', '/exercises/db-curl.svg', 'Elbows stay at sides, no swinging the torso for momentum', 'https://www.youtube.com/results?search_query=dumbbell+curl+form'),
('KB farmer''s carry', 'Full body, grip, core', 'Kettlebell', 'meters', '/exercises/kb-farmers-carry.svg', 'Stand tall, shoulders back, don''t let the KBs pull you sideways', 'https://www.youtube.com/results?search_query=farmers+carry+form');

INSERT INTO programs (name, is_active) VALUES ('4-Day Rotation', true);

INSERT INTO program_days (program_id, day_order, name)
SELECT p.id, d.day_order, d.name
FROM programs p, (VALUES
  (1, 'Lower (squat-focus)'),
  (2, 'Push'),
  (3, 'Lower (hinge-focus)'),
  (4, 'Pull')
) AS d(day_order, name)
WHERE p.name = '4-Day Rotation';

-- Day 1: Lower (squat-focus)
INSERT INTO day_exercises (program_day_id, exercise_id, order_in_day, target_sets, target_rep_low, target_rep_high, progression_increment_kg, notes)
SELECT pd.id, e.id, x.order_in_day, x.sets, x.rep_low, x.rep_high, x.incr, x.notes
FROM program_days pd
JOIN programs p ON p.id = pd.program_id AND p.name = '4-Day Rotation' AND pd.day_order = 1
JOIN (VALUES
  (1, 'Leg press', 4, 8, 12, 5.0, NULL),
  (2, 'KB goblet squat', 3, 8, 12, 5.0, NULL),
  (3, 'Leg extension', 3, 10, 15, 5.0, NULL),
  (4, 'Seated leg curl', 3, 10, 15, 5.0, NULL),
  (5, 'Standing calf raise', 3, 10, 15, 5.0, NULL),
  (6, 'Pallof press', 3, 10, 15, 2.5, 'Reps per side')
) AS x(order_in_day, exercise_name, sets, rep_low, rep_high, incr, notes) ON true
JOIN exercises e ON e.name = x.exercise_name;

-- Day 2: Push
INSERT INTO day_exercises (program_day_id, exercise_id, order_in_day, target_sets, target_rep_low, target_rep_high, progression_increment_kg, notes)
SELECT pd.id, e.id, x.order_in_day, x.sets, x.rep_low, x.rep_high, x.incr, x.notes
FROM program_days pd
JOIN programs p ON p.id = pd.program_id AND p.name = '4-Day Rotation' AND pd.day_order = 2
JOIN (VALUES
  (1, 'Machine chest press', 4, 8, 12, 5.0, NULL),
  (2, 'Seated DB shoulder press', 3, 8, 12, 2.5, NULL),
  (3, 'Incline DB press', 3, 8, 12, 2.5, NULL),
  (4, 'Cable lateral raise', 3, 12, 15, 2.5, NULL),
  (5, 'Rope triceps pushdown', 3, 10, 15, 2.5, NULL),
  (6, 'Dead bug', 3, 10, 15, 2.5, 'Reps per side')
) AS x(order_in_day, exercise_name, sets, rep_low, rep_high, incr, notes) ON true
JOIN exercises e ON e.name = x.exercise_name;

-- Day 3: Lower (hinge-focus)
INSERT INTO day_exercises (program_day_id, exercise_id, order_in_day, target_sets, target_rep_low, target_rep_high, progression_increment_kg, notes)
SELECT pd.id, e.id, x.order_in_day, x.sets, x.rep_low, x.rep_high, x.incr, x.notes
FROM program_days pd
JOIN programs p ON p.id = pd.program_id AND p.name = '4-Day Rotation' AND pd.day_order = 3
JOIN (VALUES
  (1, 'Barbell RDL', 4, 8, 10, 2.5, 'Conservative progression — key hinge-pattern lift'),
  (2, 'Back extension', 3, 10, 15, 5.0, NULL),
  (3, 'KB swing', 3, 12, 15, 5.0, NULL),
  (4, 'Seated leg curl', 3, 10, 15, 5.0, NULL),
  (5, 'Side plank', 3, 30, 30, 2.5, 'Seconds per side')
) AS x(order_in_day, exercise_name, sets, rep_low, rep_high, incr, notes) ON true
JOIN exercises e ON e.name = x.exercise_name;

-- Day 4: Pull
INSERT INTO day_exercises (program_day_id, exercise_id, order_in_day, target_sets, target_rep_low, target_rep_high, progression_increment_kg, notes)
SELECT pd.id, e.id, x.order_in_day, x.sets, x.rep_low, x.rep_high, x.incr, x.notes
FROM program_days pd
JOIN programs p ON p.id = pd.program_id AND p.name = '4-Day Rotation' AND pd.day_order = 4
JOIN (VALUES
  (1, 'Lat pulldown', 4, 8, 12, 5.0, NULL),
  (2, 'KB gorilla row', 3, 8, 12, 2.5, 'Reps per side'),
  (3, 'Seated cable row', 3, 8, 12, 5.0, NULL),
  (4, 'Face pull', 3, 12, 15, 2.5, NULL),
  (5, 'DB curl', 3, 10, 12, 2.5, NULL),
  (6, 'KB farmer''s carry', 3, 30, 30, 5.0, 'Meters per trip')
) AS x(order_in_day, exercise_name, sets, rep_low, rep_high, incr, notes) ON true
JOIN exercises e ON e.name = x.exercise_name;

INSERT INTO profile (id, height_cm, target_kcal_low, target_kcal_high, target_protein_low, target_protein_high, activity_notes, health_notes)
VALUES (1, NULL, NULL, NULL, NULL, NULL, 'Set your own activity notes', 'Set your own health notes');

-- Body metrics are entered in the app; no seed values.
