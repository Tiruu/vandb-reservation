# Security notes

## Project context

This repository is the public portfolio version of a tool originally developed for local, internal use in a V&B store.

It is **not presented as a production-ready public web service**.

## Public repository rules

- Do not commit customer names, phone numbers, reservations or database exports.
- Do not commit local database credentials or production configuration.
- Keep development/test data synthetic.

Historical customer data and database exports were removed before this repository was made public.

## If the application were deployed publicly

The following hardening would be required before exposing it to the internet:

- authentication and authorization
- environment-based database configuration
- production-safe PHP error handling
- restricted CORS policy
- generic client-facing database errors with server-side logging
- stronger request validation
- review of destructive endpoints
- HTTPS
- CSRF protection where applicable

These notes document the original scope of the project rather than claiming that the historical internal application implemented all of these controls.