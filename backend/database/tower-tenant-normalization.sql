BEGIN;

DO $$
DECLARE
  has_legacy_provider boolean;
  has_tenant_capacity boolean;
  has_tower_capacity boolean;
  remaining_legacy_providers bigint;
  inconsistent_capacities bigint;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tower_infrastruktur'
      AND column_name = 'penyelenggara'
  ) INTO has_legacy_provider;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tower_tenant'
      AND column_name = 'kapasitas_disewakan'
  ) INTO has_tenant_capacity;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tower_infrastruktur'
      AND column_name = 'kapasitas_disewakan'
  ) INTO has_tower_capacity;

  IF has_tenant_capacity AND NOT has_tower_capacity THEN
    RAISE EXCEPTION
      'Cannot remove tenant capacity: tower-level capacity column is missing.';
  END IF;

  IF has_tenant_capacity AND has_tower_capacity THEN
    EXECUTE '
      SELECT count(*)
      FROM tower_tenant AS tenant
      JOIN tower_infrastruktur AS tower ON tower.id = tenant.tower_id
      WHERE tenant.kapasitas_disewakan IS DISTINCT FROM tower.kapasitas_disewakan
    ' INTO inconsistent_capacities;
    IF inconsistent_capacities > 0 THEN
      RAISE EXCEPTION
        'Cannot remove tenant capacity: % tenant rows differ from their tower capacity.',
        inconsistent_capacities;
    END IF;
  END IF;

  IF has_legacy_provider THEN
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
      WHERE NULLIF(btrim(tower.penyelenggara), '''') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM tower_tenant AS tenant
          WHERE tenant.tower_id = tower.id
            AND lower(btrim(tenant.penyelenggara)) =
                lower(btrim(tower.penyelenggara))
        )
    ';

    EXECUTE '
      SELECT count(*)
      FROM tower_infrastruktur AS tower
      WHERE NULLIF(btrim(tower.penyelenggara), '''') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM tower_tenant AS tenant
          WHERE tenant.tower_id = tower.id
            AND lower(btrim(tenant.penyelenggara)) =
                lower(btrim(tower.penyelenggara))
        )
    ' INTO remaining_legacy_providers;
    IF remaining_legacy_providers > 0 THEN
      RAISE EXCEPTION
        'Cannot remove tower provider field: % provider values were not migrated.',
        remaining_legacy_providers;
    END IF;
  END IF;

  IF has_tenant_capacity THEN
    ALTER TABLE tower_tenant DROP COLUMN kapasitas_disewakan;
  END IF;

  IF has_legacy_provider THEN
    ALTER TABLE tower_infrastruktur DROP COLUMN penyelenggara;
  END IF;
END $$;

DELETE FROM directus_fields
WHERE (collection = 'tower_infrastruktur' AND field = 'penyelenggara')
   OR (collection = 'tower_tenant' AND field = 'kapasitas_disewakan');

COMMIT;
