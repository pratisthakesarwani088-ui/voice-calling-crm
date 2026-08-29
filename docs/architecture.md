# Architecture — Module 1 (Project Setup & Foundation)

## Overview

The project is a two-service application:

- **frontend/** — React 19 + Vite + Tailwind CSS single-page app
- **backend/** — FastAPI + SQLAlchemy + Alembic REST API

They communicate over HTTP; the frontend never talks to the database
directly. This is the standard decoupled-frontend / API-backend pattern,
which is what lets each service be built, scaled, and deployed on Render
independently.

## Clean architecture layers (backend)

```
routes/     -> HTTP layer only: parses requests, calls services, returns responses
services/   -> business logic (no FastAPI/HTTP concerns)
models/     -> SQLAlchemy ORM entities (database shape)
schemas/    -> Pydantic request/response contracts (API shape)
database/   -> engine/session wiring
config/     -> environment-driven settings
middleware/ -> cross-cutting concerns (CORS, future auth/logging)
```

Keeping `models` (DB shape) and `schemas` (API shape) separate means the
database can evolve without breaking the API contract, and vice versa.

## Frontend structure

```
pages/      -> one component per route/screen
layouts/    -> shared page shells (header/footer/sidebar)
components/ -> small reusable UI pieces
services/   -> all backend HTTP calls (never call axios from a component)
hooks/      -> reusable stateful logic
context/    -> global state (e.g. auth) — added in a later module
utils/      -> stateless helpers
```

## Database schema (added in Module 2)

Six tables now exist, defined in `backend/app/models/`:

- **users** — internal CRM users (admin/manager/agent), soft-delete enabled
- **customers** — the core entity; `customer_code` and `phone` are unique
  so the same customer can't be entered twice
- **knowledge_base** — reference content for the future AI calling engine
- **calls** — one row per voice call, owned by a customer
- **follow_ups** — scheduled follow-up actions, owned by a customer
- **reports** — metadata for a generated report, optionally tied to the
  user who generated it

See `docs/database.md` for the full column list, relationships, ER
diagram, and migration commands. No routes, schemas, or services use
these models yet — only the database layer exists so far.

## What Module 1 deliberately does NOT include

No authentication, dashboard, customer management, AI integration, voice
calling, or reporting — only the folder structure, tooling configuration,
a health-check endpoint, and a placeholder page proving the two services
can talk to each other. These are built in later modules on top of this
foundation.

## Configuration

Every setting (database URL, secret key, CORS origins, API base URL) is
read from environment variables — see `backend/.env.example` and
`frontend/.env.example`. Nothing is hardcoded, so the same code runs
unmodified in local development and on Render.
