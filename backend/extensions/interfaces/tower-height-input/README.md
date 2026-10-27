# Tower height input

This Directus interface accepts positive integer values with at most three
digits. It blocks a fourth digit during typing and sanitizes pasted input.
The field's Directus validation remains responsible for enforcing the numeric
range of 1–999.

Build it from this directory with `npm run build`. The Docker Compose bind mount
loads the built extension into Directus; recreate the Directus container after
changing the extension.
