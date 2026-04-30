ALTER TABLE bookings
ALTER COLUMN player_id DROP NOT NULL;

ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_player_or_coach_required;

ALTER TABLE bookings
ADD CONSTRAINT bookings_player_or_coach_required
CHECK (player_id IS NOT NULL OR coach_id IS NOT NULL);
