# V&B — Reservation Management

A local web application developed in-store to manage **beer tap and equipment reservations**.

The project was built to solve a concrete operational problem: centralise reservations, equipment availability and stock information instead of relying on a manual workflow.

> **Project type:** Professional / real-world internal tool  
> **Environment:** Local network / XAMPP  
> **Status:** Archived / portfolio version

## The problem

Reservation management involved several pieces of information: dates, beer quantities, available taps and additional equipment.

The goal was to bring this information together in one interface that could be used directly in the store.

## What I built

The application provides a central interface for:

- creating and editing reservations
- viewing reservations by date
- managing beer stock
- managing equipment availability
- archiving completed reservations
- deleting reservations and archives
- handling multiple taps and beer quantities
- managing additional equipment such as marquees and a photo booth

The interface is written in French because the application was designed for actual in-store use.

## Tech stack

**Frontend**

- HTML
- CSS
- JavaScript
- Bootstrap

**Backend / data**

- PHP
- MySQL
- REST-style HTTP endpoints

**Local environment**

- XAMPP
- Apache
- MySQL

## Architecture

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

The frontend communicates with `api.php` using HTTP requests. The API handles operations for reservations, inventory and archives.

## API

The backend exposes operations including:

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

## Security considerations

This project was built as a local internal tool rather than as a public SaaS application.

If it were deployed publicly, it would require additional hardening, including authentication and authorisation, stronger input validation, safer credential management, CSRF protection where relevant, HTTPS and a review of destructive endpoints.

These limitations reflect the project's original context and are not presented as production-ready security.

## Why this project matters

This project is valuable in my portfolio because it was built for a **real operational need in a working store**, rather than as a tutorial or isolated school exercise.

The development process was straightforward and practical:

**identify a workflow problem → build a usable tool → connect it to a database → iterate from real usage.**

It demonstrates experience with backend development, database-backed applications, API design and building software around an actual user's workflow.

## Privacy

This public repository contains code only.

Customer data and historical database exports have intentionally been excluded from the public project.
