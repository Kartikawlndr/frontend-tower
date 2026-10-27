ALTER TABLE tower_registration_attempts
  ADD COLUMN IF NOT EXISTS registration_code varchar(16);

CREATE UNIQUE INDEX IF NOT EXISTS tower_registration_attempts_registration_code_unique
  ON tower_registration_attempts (registration_code)
  WHERE registration_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS tower_registration_code_counter (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  last_value integer NOT NULL CHECK (last_value >= 0 AND last_value <= 999999)
);

WITH numbered_successes AS (
  SELECT
    id,
    row_number() OVER (ORDER BY date_created, id) AS sequence_number
  FROM tower_registration_attempts
  WHERE status = 'Registered'
)
UPDATE tower_registration_attempts AS attempts
SET registration_code = 'REG-' || lpad(numbered_successes.sequence_number::text, 6, '0')
FROM numbered_successes
WHERE attempts.id = numbered_successes.id
  AND attempts.registration_code IS NULL;

INSERT INTO tower_registration_code_counter (singleton, last_value)
SELECT true, count(*)::integer
FROM tower_registration_attempts
WHERE status = 'Registered'
ON CONFLICT (singleton) DO NOTHING;

INSERT INTO directus_fields (
  collection,
  field,
  interface,
  readonly,
  hidden,
  sort,
  width,
  required,
  searchable
)
SELECT
  'tower_registration_attempts',
  'registration_code',
  'input',
  true,
  true,
  11,
  'half',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM directus_fields
  WHERE collection = 'tower_registration_attempts'
    AND field = 'registration_code'
);
