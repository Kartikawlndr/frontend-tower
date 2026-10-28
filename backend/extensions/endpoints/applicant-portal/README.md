# Applicant Portal endpoint

All routes are authenticated with a Directus access token, except the public
`POST /accept-invite` and `POST /complete-password-reset` token-completion
routes.

| Route | Applicant | Web Manager | Administrator |
| --- | --- | --- | --- |
| `GET /profile` | Own profile | Own profile | Own profile |
| `GET /towers`, `GET /towers/:id`, `GET /towers/export.csv` | Own active records | All active records | All active records |
| `POST /towers` | Create | Create | Create |
| `PATCH /towers/:id` | Own records | — | — |
| `DELETE /towers/:id`, `POST /towers/delete` | Own records | Any active record | Any active record |
| `GET /audit` | — | Read | Read |
| `/users` routes | — | — | Manage portal users |
| `POST /password` | Change own password | Change own password | Change own password |
| `/towers/drafts` routes | Own drafts | — | — |

Record listing and detail/archive operations enforce ownership and exclude
records with `deleted_at` set for Applicants. Manager and Administrator access
is limited to active records for these routes. These endpoint rules do not
modify Directus permissions or schema.

Every tenant row for a tower must repeat the same total `kapasitas_disewakan`;
it is a tower-level capacity, not a tenant-specific value.

Tower submissions and edits derive province, regency/city, district, and
village from their coordinates using the shared PostGIS boundary lookup. These
administrative fields are not accepted as user-provided values; points outside
all boundary polygons are stored with blank administrative fields.
