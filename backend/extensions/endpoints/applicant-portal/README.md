# Applicant Portal endpoint

All routes except the following require a Directus access token:

- `POST /accept-invite` collects the invitee's first name, last name, and
  password with a one-time token. `POST /complete-password-reset` uses a
  one-time token.
- `POST /request-password-reset` requests a reset link for an account email
  and is rate-limited per email. Its response does not disclose whether the
  account exists.
- `POST /login-status` requires the shared `PORTAL_LOGIN_STATUS_SECRET`; it
  reports a suspended account only after verifying the submitted password and
  is rate-limited per email.

| Route | Applicant | Web Manager | Administrator |
| --- | --- | --- | --- |
| `GET /profile` | Own profile | Own profile | Own profile |
| `GET /towers`, `GET /towers/:id`, `GET /towers/export.csv` | Own active records | All active records | All active records |
| `POST /towers` | Create | Create | Create |
| `PATCH /towers/:id` | Own records | — | — |
| `DELETE /towers/:id`, `POST /towers/delete` (soft archive) | Own records | Any active record | Any active record |
| `GET /audit` | — | Read | Read |
| `/users` routes | — | — | Manage portal users |
| `POST /password` | Request an email verification link to change own password | Request an email verification link to change own password | Request an email verification link to change own password |
| `POST /request-password-reset` | Request a password reset link without signing in | Request a password reset link without signing in | Request a password reset link without signing in |
| `/towers/drafts` routes | Own drafts | — | — |

`GET /towers` includes only a `draft_count` aggregate (Applicant-owned for
Applicants and global for managers/administrators); it never returns draft
contents. Draft details remain available only to their owning Applicant through
the `/towers/drafts` routes.

The audit view omits item identifiers and can be downloaded as CSV from the
frontend. Administrator user updates may include a unique email address.

Archive operations set `deleted_at` and `is_archived`; records remain in the
database and audit log. Listing and detail/archive operations enforce ownership
and exclude records with `deleted_at` set for Applicants. Manager and
Administrator access is limited to active records for these routes. These
endpoint rules do not modify Directus permissions or schema.

`kapasitas_disewakan` is stored once on `tower_infrastruktur`. Each
`tower_tenant` row stores only the tenant name and tower relationship.

New tower IDs are stored as `TWR-<registration year>-<numeric input ID>`.
Applicants enter the numeric ID; the registration endpoint preserves leading
zeroes and adds the registration year when the submission is saved.

Successful manual registrations send the Applicant a receipt email with a
locally generated QR code containing the tower ID, registration date,
construction year, and owner name. The email delivery status is returned
separately from the saved registration so an SMTP failure does not cause a
duplicate submission on retry. Administrators can update another user's email
without changing that account's ID or related records.

Tower submissions and edits derive province, regency/city, district, and
village from their coordinates using the shared PostGIS boundary lookup. These
administrative fields are not accepted as user-provided values; points outside
all boundary polygons are stored with blank administrative fields.
