# V&B — Reservation Management

A local web application developed in-store to manage **beer tap and equipment reservations**.

The application was created to solve a concrete operational problem: centralise reservations, equipment availability and stock information instead of relying on a manual workflow.

> **Project type:** Professional / real-world internal tool  
> **Environment:** Local network / XAMPP  
> **Status:** Archived / portfolio version

## What it does

The application provides a central interface for:

- creating reservations
- editing reservations
- viewing reservations by date
- managing beer stock
- managing equipment availability
- archiving completed reservations
- deleting reservations and archives
- handling multiple taps and beer quantities
- managing additional equipment such as marquees and a photo booth

The interface is written in French because it was designed for actual use in-store.

## Stack

### Frontend

- HTML
- CSS
- JavaScript
- Bootstrap

### Backend

- PHP
- MySQL
- REST-style HTTP endpoints

### Local environment

- XAMPP
- Apache
- MySQL

## Architecture

The application follows a simple client/API/database architecture:

```text
Browser
   │
   ├── HTML / CSS
   └── JavaScript
          │
          ▼
      api.php
          │
          ▼
        MySQL
```

The frontend communicates with `api.php` using HTTP requests.

The API exposes operations for reservations, inventory and archives.

## API

The backend handles operations including:

```text
GET    ?type=reservations
GET    ?type=inventory
GET    ?type=archives

POST   ?type=reservations
POST   ?type=beerStock
POST   ?type=archiveAndDelete

DELETE ?type=reservations&id=...
DELETE ?type=deleteArchive&id=...
DELETE ?type=inventory&beerId=...
```

The reservation API also maintains backward compatibility with an older tap data format.

## Database

The application expects a local MySQL database named:

```text
location_tireuse
```

The original production/customer data is **not included in this repository**.

Historical database exports were deliberately removed from Git history before making this repository public. Do not add real customer data, database dumps, phone numbers or reservation exports to this repository.

For a local development installation, create a database matching the application's expected tables and configure the local PHP/MySQL environment accordingly.

## Local configuration

The original application was designed around a local XAMPP installation.

The database connection expects:

```text
host:     localhost
user:     root
database: location_tireuse
```

A local development environment should use its own credentials rather than relying on production data.

## Security considerations

This project was built as a local internal tool rather than as a public SaaS application.

If it were deployed publicly, several areas would need hardening:

- move database credentials out of application code
- disable PHP error display in production
- restrict CORS to trusted origins or remove it when frontend/API share the same origin
- avoid returning raw SQL errors to clients
- add authentication and authorisation
- add stronger input validation
- review all destructive endpoints
- use HTTPS
- add CSRF protection where relevant

These limitations are part of the project's original context and are not presented as production-ready security.

## Why this project matters

This is one of the strongest projects in my portfolio because it was not built as a tutorial or a school exercise.

It was developed to answer a real operational need in a working store.

The interesting part is less the visual interface than the engineering process:

**identify a workflow problem → build a usable tool → connect it to a database → iterate from real usage.**

## Privacy

This public repository contains code only.

Customer data and historical database exports have intentionally been excluded from the public project.
