# Atomic tower workbook upload

The authenticated `POST /bulk-tower-upload` endpoint accepts JSON
`{ "file_id": "<Directus file UUID>" }`. Upload the `.xlsx` first through
Directus `POST /files`; the endpoint verifies that the file belongs to the
current user, parses it, and removes the staged file if the upload is rejected.
Applicant, Web Manager, and Administrator accounts may process workbooks;
ownership is recorded as the authenticated uploader.
The same endpoint serves the official workbook at
`GET /bulk-tower-upload/template`, so the template link does not depend on the
signup application's development server.

The current workbook has 12 columns and does not ask users to enter province,
regency/city, district, or village. The endpoint accepts the previous
16-column workbook for existing files, but ignores its manually entered
administrative values. After validating all rows, it resolves all tower
coordinates in one PostGIS query against `indonesian_administrative_boundaries`
using `ST_Covers`. An unmatched point (for example, one in the sea) receives
blank administrative fields. Every non-empty data row is validated before any
records are written. One invalid row rejects the whole file. A successful file
is written in a single database transaction. Each distinct
`id_menara` becomes one `tower_infrastruktur` record with status `Submitted`,
method `Upload Document (.xlsx)`, separate numeric `longitude` and `latitude`
fields, and a reference to the uploaded workbook. Each tower stores its
`kapasitas_disewakan` once in `tower_infrastruktur`; each tenant name is stored
in a separate `tower_tenant` row without a duplicated capacity. Each created
tower gets a `Registered` row in `tower_registration_attempts`. The
existing `Submitted` tower status is retained for the Directus receipt email
flow. The current workbook maps its displayed headers to the Directus fields;
the previous `penyelenggara_penyewa` heading remains supported. Multiple
tenant names in the current workbook are separated by commas and create
separate `tower_tenant` records.

The same tower ID may occur in multiple rows only when all tower attributes,
including the total `kapasitas_disewakan`, match and tenant names are unique
for that tower; differing tower attributes or duplicate tenants reject the
whole workbook. The rented capacity is a tower-level value, not a per-tenant
amount. Tower IDs must not already exist.
All validation errors reject the workbook and persist a `Rejected` attempt.
Required text fields cannot be blank; construction year must be a whole year
from 1900 through the current year. The workbook dropdown and server-side
validation both follow the current year; tower height must be an integer from 1 through 999;
coordinates must fall within Indonesia's longitude (95–141) and latitude
(-11–6) ranges. Administrative values are derived from the imported boundary
polygons rather than the bundled administrative-region dataset.
Tower IDs must be unique among active records. Soft-deleted records are excluded
from the active registry, so their IDs may be submitted again.
Files are limited to 10 MB and 1,000 data rows. The backend Compose
`boundary-importer` service loads the read-only
`../Geopackage/indoadmin2024.gpkg` source into PostGIS before Directus starts.

Build and test from this directory with `npm run build` and `npm test`. The
Directus service mounts this extension from `docker-compose.yml`.
