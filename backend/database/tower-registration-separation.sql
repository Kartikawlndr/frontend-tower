BEGIN;

ALTER TABLE tower_infrastruktur
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

UPDATE tower_infrastruktur
SET is_archived = deleted_at IS NOT NULL
WHERE is_archived IS DISTINCT FROM (deleted_at IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tower_registration_attempts_status_check'
      AND conrelid = 'tower_registration_attempts'::regclass
  ) THEN
    ALTER TABLE tower_registration_attempts
      ADD CONSTRAINT tower_registration_attempts_status_check
      CHECK (status IN ('Draft', 'Registered', 'Rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tower_registration_attempts_type_check'
      AND conrelid = 'tower_registration_attempts'::regclass
  ) THEN
    ALTER TABLE tower_registration_attempts
      ADD CONSTRAINT tower_registration_attempts_type_check
      CHECK (attempt_type IN ('New Registration', 'Update'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tower_registration_attempts_method_check'
      AND conrelid = 'tower_registration_attempts'::regclass
  ) THEN
    ALTER TABLE tower_registration_attempts
      ADD CONSTRAINT tower_registration_attempts_method_check
      CHECK (metode_pendaftaran IN ('Input Manual', 'Upload Document (.xlsx)'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tower_tenant_unique_name_per_tower
  ON tower_tenant (tower_id, lower(btrim(penyelenggara)));

CREATE UNIQUE INDEX IF NOT EXISTS tower_registration_attempts_one_registered_per_tower
  ON tower_registration_attempts (tower_id)
  WHERE status = 'Registered'
    AND attempt_type = 'New Registration'
    AND tower_id IS NOT NULL;

DROP INDEX IF EXISTS tower_infrastruktur_registered_id_menara_unique;

CREATE UNIQUE INDEX IF NOT EXISTS tower_infrastruktur_active_id_menara_unique
  ON tower_infrastruktur (id_menara)
  WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tower_infrastruktur'
      AND column_name = 'penyelenggara'
  ) THEN
    EXECUTE '
      INSERT INTO tower_tenant (
        tower_id,
        penyelenggara,
        user_created,
        date_created
      )
      SELECT
        tower.id,
        btrim(tower.penyelenggara),
        tower.user_created,
        COALESCE(tower.date_created, now())
      FROM tower_infrastruktur AS tower
      WHERE tower.verification_status IN (
          ''Registered'', ''Submitted'', ''Approved'', ''REGISTERED''
        )
        AND tower.deleted_at IS NULL
        AND NULLIF(btrim(tower.penyelenggara), '''') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM tower_tenant AS tenant
          WHERE tenant.tower_id = tower.id
            AND lower(btrim(tenant.penyelenggara)) =
                lower(btrim(tower.penyelenggara))
        )
    ';
  END IF;
END $$;

INSERT INTO tower_registration_attempts (
  user_created,
  tower_id,
  status,
  attempt_type,
  metode_pendaftaran,
  submission_data,
  validation_errors,
  date_created
)
SELECT
  tower.user_created,
  tower.id,
  'Registered',
  'New Registration',
  COALESCE(tower.metode_pendaftaran, 'Input Manual'),
  to_jsonb(tower) - ARRAY['id', 'user_created', 'user_updated', 'date_created', 'date_updated', 'deleted_at'],
  NULL,
  COALESCE(tower.date_created, now())
FROM tower_infrastruktur AS tower
WHERE tower.verification_status IN ('Submitted', 'Approved', 'REGISTERED')
  AND tower.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM tower_registration_attempts AS attempt
    WHERE attempt.tower_id = tower.id
      AND attempt.status = 'Registered'
  );

INSERT INTO tower_registration_attempts (
  user_created,
  tower_id,
  status,
  attempt_type,
  metode_pendaftaran,
  submission_data,
  validation_errors,
  date_created
)
SELECT
  tower.user_created,
  NULL,
  CASE
    WHEN tower.verification_status = 'Draft' THEN 'Draft'
    ELSE 'Rejected'
  END,
  'New Registration',
  COALESCE(tower.metode_pendaftaran, 'Input Manual'),
  to_jsonb(tower) - ARRAY['id', 'user_created', 'user_updated', 'date_created', 'date_updated', 'deleted_at'],
  CASE
    WHEN tower.verification_status = 'Draft' THEN NULL
    ELSE '[{"field":"legacy","message":"Migrated legacy rejected submission; its original validation reason was not recorded."}]'::jsonb
  END,
  COALESCE(tower.date_created, now())
FROM tower_infrastruktur AS tower
WHERE tower.verification_status IN ('Draft', 'Rejected')
  AND NOT EXISTS (
    SELECT 1
    FROM tower_registration_attempts AS attempt
    WHERE attempt.user_created IS NOT DISTINCT FROM tower.user_created
      AND attempt.status = tower.verification_status
      AND attempt.date_created IS NOT DISTINCT FROM tower.date_created
      AND attempt.submission_data->>'id_menara' = tower.id_menara
  );

COMMIT;
