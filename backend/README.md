# Directus backend

This folder contains the Directus configuration, schema snapshot, database
migrations, and extensions used by the frontend.

## Local setup

Prerequisites: Docker Desktop with Compose, Node.js/npm, and Python 3 with
`openpyxl` only if you want to regenerate the Excel template. Install it with
`python -m pip install openpyxl` when needed.

1. Copy `.env.example` to `.env`. Replace every placeholder with local values;
   use strong, unique values for `KEY`, `SECRET`, database/admin passwords, and
   SMTP credentials. Set `PUBLIC_URL=http://localhost:8055` for local use and
   set `USER_REGISTER_ROLE` to the Directus Applicant role UUID.
2. From this directory, start the services:

   ```powershell
   docker compose up -d
   ```

   The one-shot `boundary-importer` service loads
   `..\Geopackage\indoadmin2024.gpkg` into PostGIS before Directus starts. Keep
   that file at this path. It reads the GeoPackage without modifying it and
   skips the import when the destination layer already has the same number of
   features as the source.

3. When upgrading an existing database, back it up and run the tenant
   normalization migration before applying the updated schema snapshot. It
   moves any remaining tower provider value into `tower_tenant`, verifies
   tenant capacities match the tower-level value, and then removes the
   duplicated columns:

   ```powershell
   Get-Content -Raw .\database\tower-tenant-normalization.sql | docker compose exec -T database psql -v ON_ERROR_STOP=1 -U directus -d directus
   ```

   This migration is idempotent and can also be run after schema creation on a
   fresh database.

4. Apply the Directus schema snapshot to initialize or reconcile collections
   and fields:

   ```powershell
   docker compose exec directus node /directus/cli.js schema apply /directus/schema.yaml --yes
   ```

5. Apply the SQL files in `database/` to the configured PostgreSQL database.
   Run them from this directory, in this order, after the schema has created
   the collections:

   ```powershell
   Get-Content -Raw .\database\tower-administrative-fields.sql | docker compose exec -T database psql -U directus -d directus
   Get-Content -Raw .\database\tower-registration-separation.sql | docker compose exec -T database psql -U directus -d directus
   Get-Content -Raw .\database\tower-tenant-normalization.sql | docker compose exec -T database psql -v ON_ERROR_STOP=1 -U directus -d directus
   Get-Content -Raw .\database\tower-registration-update-attempts.sql | docker compose exec -T database psql -U directus -d directus
   Get-Content -Raw .\database\successful-registration-codes.sql | docker compose exec -T database psql -U directus -d directus
   Get-Content -Raw .\database\active-tower-id-uniqueness.sql | docker compose exec -T database psql -U directus -d directus
   ```

   These examples use the `DB_USER` and `DB_DATABASE` defaults in `.env.example`;
   replace `directus` if you configured different names.
6. From each extension directory that contains a `package.json`, run
   `npm ci` followed by `npm run build`. For the bulk-upload endpoint, also run
   `npm test`. Directus loads the built extension files from the mounted
   directories; restart Directus after building.
7. In a separate terminal, configure the frontend using the repository-root
   `.env.example`, then run `npm ci` and `npm run dev` from the repository root.

Configure Directus roles/permissions, public registration, email verification,
SMTP, and the registration email Flow for the local instance. These settings
are not all portable through the schema snapshot. Do not copy production
credentials or data into a local environment.

## Bulk registration workbook

The official 12-column template is
`extensions/endpoints/bulk-tower-upload/templates/Template_Registrasi_Menara.xlsx`.
The endpoint also serves this file at `/bulk-tower-upload/template`. To
regenerate it, run `python scripts/generate_registration_template.py` from this
directory; the generated file replaces the endpoint template. Copy the
generated workbook to the frontend's `public/Template_Registrasi_Menara.xlsx`
as well so the download link and Directus endpoint serve the same version.
Province, regency/city, district, and village are filled from the longitude and
latitude using the imported PostGIS boundaries; points outside every village
polygon retain blank administrative fields. The previous 16-column workbook
remains accepted, but its manually entered administrative values are ignored.

`docker-compose.yml` mounts source extensions, the schema snapshot, email
templates, and a local uploads directory. PostgreSQL data is kept in a named
Docker volume; do not remove that volume unless you intend to delete the local
database.
