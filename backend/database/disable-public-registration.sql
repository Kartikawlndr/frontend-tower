UPDATE directus_settings
SET public_registration = false
WHERE public_registration IS DISTINCT FROM false;
