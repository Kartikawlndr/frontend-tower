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

The current workbook has 16 columns, including the four cascading
administrative-region fields. The endpoint also accepts the prior 12-column
template for existing files. Every non-empty data row is validated before any
records are written. One invalid row rejects the whole file. A successful file
is written in a single database transaction. Each distinct
`id_menara` becomes one `tower_infrastruktur` record with status `Submitted`,
method `Upload Document (.xlsx)`, separate numeric `longitude` and `latitude`
fields, and a reference to the uploaded workbook. Each workbook row creates a
`tower_tenant` row per tenant name with its `kapasitas_disewakan`, and each
created tower gets a `Registered` row in `tower_registration_attempts`. The
existing `Submitted` tower status is retained for the Directus receipt email
flow. The current workbook maps its displayed headers to the Directus fields;
the previous `penyelenggara_penyewa` heading remains supported. Multiple
tenant names in the current workbook are separated by commas and create
separate `tower_tenant` records.

The same tower ID may occur in multiple rows only when all tower attributes,
including the total `kapasitas_disewakan`, match and tenant names are unique
for that tower; differing tower attributes or duplicate tenants reject the
whole workbook. The total rented capacity is repeated on each tenant row and
is not a per-tenant amount. Tower IDs must not already exist.
All validation errors reject the workbook and persist a `Rejected` attempt.
Required text fields cannot be blank; construction year must be a whole year
from 1900 through 2026; tower height must be an integer from 1 through 999;
coordinates must fall within Indonesia's longitude (95–141) and latitude
(-11–6) ranges. The current workbook's province, regency/city, district, and
village values are checked against the bundled administrative-region dataset,
including their parent-child relationships.
The database unique index applies only to non-archived (`deleted_at IS NULL`)
records, so a soft-deleted tower ID can be registered again.
Files are limited to 10 MB and 1,000 data rows.

Build and test from this directory with `npm run build` and `npm test`. The
Directus service mounts this extension from `docker-compose.yml`.
