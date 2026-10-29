BEGIN;

DROP INDEX IF EXISTS tower_registration_attempts_one_registered_per_tower;

CREATE UNIQUE INDEX tower_registration_attempts_one_registered_per_tower
  ON tower_registration_attempts (tower_id)
  WHERE status = 'Registered'
    AND attempt_type = 'New Registration'
    AND tower_id IS NOT NULL;

COMMIT;
