This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Portal integration setup

The portal authenticates against Directus and the `applicant-portal` and
`bulk-tower-upload` extensions. Configure these server-side environment
variables before using the real data flows:

- `DIRECTUS_URL` — Directus base URL (defaults to `http://localhost:8055`).
- `APP_URL` — portal base URL (defaults to `http://localhost:3000`); registration
  verification emails return to the portal's `/api/verify-email` route.
- `USER_REGISTER` — set to `false` to disable public registration.
- `MAX_PAYLOAD_SIZE` — maximum workbook upload size (defaults to `200mb`).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — optional public Turnstile site key.

Public registration sends only the fields accepted by Directus
(`/users/register`). Directus assigns the configured public registration role;
the browser and portal do not choose or submit a role.
Set Directus' `USER_REGISTER_URL_ALLOW_LIST` to include the portal verification
URL for the current environment.

The tower application form includes province and regency/city selections using
the static administrative-region dataset in
`src/data/indonesian-administrative-regions.json` (source: wilayah.id, updated
2025-07-04). The dependent regency/city value is validated against the selected
province by the portal extension. The Directus schema snapshot at
`../tower-komdigi/schema.yaml` defines nullable `provinsi` and `kab_kota`
fields; apply the reviewed snapshot to each Directus environment before
expecting these values to persist. No running Directus instance is changed by
the frontend application.

Do not put Directus passwords, access tokens, or refresh tokens in
`NEXT_PUBLIC_*` variables. Login stores Directus tokens in HTTP-only cookies.
The browser's role display comes from the authenticated `/applicant-portal/profile`
response; there is no client-side role switch.

Run the frontend with `npm run dev`. The Directus extensions must already be
deployed and active for login, tower submissions, workbook imports, audit logs,
and account management to work. This project does not change Directus permissions.

For end-to-end testing, use separate test accounts configured in Directus for
Applicant, Web Manager, and Administrator. Verify that Applicant sees and
archives only their own records, while Manager and Administrator can see and
archive all active records. Only Administrator can manage user roles or request
password resets for other accounts.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
