BEGIN;

DROP INDEX IF EXISTS tower_infrastruktur_id_menara_unique;

CREATE UNIQUE INDEX IF NOT EXISTS tower_infrastruktur_active_id_menara_unique
  ON tower_infrastruktur (id_menara)
  WHERE deleted_at IS NULL;

COMMIT;