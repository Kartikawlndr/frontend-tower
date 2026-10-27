BEGIN;

ALTER TABLE tower_infrastruktur
  ADD COLUMN IF NOT EXISTS kecamatan character varying(100),
  ADD COLUMN IF NOT EXISTS kelurahan character varying(100);

COMMIT;
