-- Short warm-up/cool-down routines per program day, tailored to that day's
-- muscle groups. Requested after a real session note ("Did abdominal crunch
-- instead of dead bug today... there should be a short effective warm up and
-- cool down stretch exercise routine"). Text, not structured exercises —
-- editing a short routine doesn't need the same modeling as tracked sets.

ALTER TABLE program_days ADD COLUMN warmup_text text;
ALTER TABLE program_days ADD COLUMN cooldown_text text;

UPDATE program_days SET
  warmup_text = 'Leg swings (front-back + side-side), bodyweight squats x10, hip circles, ankle rocks — 3-5 min.',
  cooldown_text = 'Standing quad stretch, kneeling hip flexor stretch, standing hamstring stretch — 20-30s each side.'
WHERE day_order = 1;

UPDATE program_days SET
  warmup_text = 'Arm circles, band pull-aparts or light shoulder rotations, one light warm-up set before your first press — 3-5 min.',
  cooldown_text = 'Doorway chest stretch, overhead triceps stretch, cross-body shoulder stretch — 20-30s each side.'
WHERE day_order = 2;

UPDATE program_days SET
  warmup_text = 'Cat-cow x10, glute bridges x10, bodyweight hip hinges x10, leg swings — 3-5 min. Go slow — this is about waking up the hinge pattern, not loading it.',
  cooldown_text = 'Standing hamstring stretch, figure-4 glute stretch, child''s pose for the lower back — 20-30s each side.'
WHERE day_order = 3;

UPDATE program_days SET
  warmup_text = 'Band pull-aparts, scapular retractions, arm circles, light lat activation on the pulldown — 3-5 min.',
  cooldown_text = 'Overhead lat stretch, cross-body rear delt stretch, wall bicep stretch — 20-30s each side.'
WHERE day_order = 4;
