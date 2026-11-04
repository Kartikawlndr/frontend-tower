BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM tower_infrastruktur
    WHERE id_menara IS NULL
       OR (
         id_menara !~ '^[0-9]{1,41}$'
         AND id_menara !~ '^TWR-[0-9]{4}-[0-9]{1,41}$'
       )
  ) THEN
    RAISE EXCEPTION 'Cannot migrate tower IDs: found IDs outside the numeric or TWR format.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tower_infrastruktur
    WHERE id_menara ~ '^[0-9]{1,41}$'
      AND date_created IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate tower IDs: a registered tower has no registration date.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT
        'TWR-' || EXTRACT(YEAR FROM date_created AT TIME ZONE 'UTC')::integer::text
          || '-' || id_menara AS new_id
      FROM tower_infrastruktur
      WHERE id_menara ~ '^[0-9]{1,41}$'
    ) AS candidates
    GROUP BY new_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot migrate tower IDs: generated IDs would not be unique.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tower_infrastruktur AS current
    JOIN tower_infrastruktur AS candidate
      ON candidate.id_menara =
        'TWR-' || EXTRACT(YEAR FROM current.date_created AT TIME ZONE 'UTC')::integer::text
          || '-' || current.id_menara
     AND candidate.id <> current.id
    WHERE current.id_menara ~ '^[0-9]{1,41}$'
  ) THEN
    RAISE EXCEPTION 'Cannot migrate tower IDs: a generated ID already belongs to another tower.';
  END IF;
END $$;

WITH id_map AS (
  SELECT
    id,
    id_menara AS old_id,
    'TWR-' || EXTRACT(YEAR FROM date_created AT TIME ZONE 'UTC')::integer::text
      || '-' || id_menara AS new_id
  FROM tower_infrastruktur
  WHERE id_menara ~ '^[0-9]{1,41}$'
)
UPDATE tower_registration_attempts AS attempt
SET submission_data = jsonb_set(
  attempt.submission_data::jsonb,
  '{id_menara}',
  to_jsonb(id_map.new_id),
  true
)::json
FROM id_map
WHERE attempt.tower_id = id_map.id
  AND attempt.submission_data IS NOT NULL
  AND attempt.submission_data::jsonb->>'id_menara' = id_map.old_id;

UPDATE tower_infrastruktur AS tower
SET id_menara =
  'TWR-' || EXTRACT(YEAR FROM tower.date_created AT TIME ZONE 'UTC')::integer::text
    || '-' || tower.id_menara
WHERE tower.id_menara ~ '^[0-9]{1,41}$';

COMMIT;
