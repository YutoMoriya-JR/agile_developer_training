# Copilot Instructions

## Project

- This repository contains a Japanese daily-report application built with Laravel 13, PHP 8.3+, MySQL, and Vite. The Laravel application is in `src/`; Docker Compose is used for local development.
- Read the relevant implementation and tests before changing behavior. Follow existing Laravel conventions and keep changes focused.
- Respond to the user in Japanese unless they ask for another language.

## Implementation

- Preserve the documented product behavior in the root `README.md`, especially authentication, team membership, draft ownership, submitted-report visibility, and reporting rules.
- Validate input on the server and enforce authorization for every operation that reads or changes user-owned reports or comments.
- Add or update tests for behavior changes, including authorization and validation cases where applicable.
- Use Laravel migrations for schema changes. Do not edit generated or dependency-managed files under `src/vendor/` or `src/node_modules/`.
- Never overwrite local environment files, credentials, or unrelated user changes. Do not commit secrets.
- Update relevant documentation when behavior or setup instructions change.

## Validation

- Run focused tests when available. The project test command is `docker compose exec app php artisan test`.
- For frontend asset changes, build assets with `docker compose exec app npm run build`.
- Report commands that could not be run and why; do not claim a check passed unless it was run successfully.
