# Registration method template interface

This Directus interface replaces the `metode_pendaftaran` dropdown. It keeps
the existing choices and displays a template download link when
`Upload Document (.xlsx)` is selected.

The linked workbook is served by the signup web app at
`/templates/Template_Pendaftaran_Menara.xlsx`. Configure the field's
`template_url` option to an origin applicants can access. The local default is
`http://localhost:3000/templates/Template_Pendaftaran_Menara.xlsx`; `localhost`
only works on the computer where the web app is running.

Build the extension from this directory with `npm run build`. The
`docker-compose.yml` bind mount makes it available to Directus; restart the
Directus service after building.
