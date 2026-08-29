# Database Design — Module 2

## Overview

Six tables, defined as SQLAlchemy models in `backend/app/models/`, one
file per entity, sharing common building blocks from `base.py` (id,
timestamps, soft delete) and `enums.py` (status/type fields + the
`sa_enum()` helper). All timestamps are stored in UTC.

No CRUD APIs, business logic, or authentication exist yet — this module
only defines storage and the migration that creates it.

---

## Tables

### 1. `users`
| Column          | Type               | Constraints                          |
|-----------------|--------------------|----------------------------------------|
| id              | BIGINT             | PK, autoincrement                     |
| full_name       | VARCHAR(150)       | NOT NULL                              |
| email           | VARCHAR(255)       | UNIQUE, indexed, NOT NULL             |
| password_hash   | VARCHAR(255)       | NOT NULL                              |
| role            | ENUM               | admin / manager / agent, indexed      |
| status          | ENUM               | active / inactive / suspended, indexed|
| created_at      | DATETIME (UTC)     | NOT NULL                              |
| updated_at      | DATETIME (UTC)     | NOT NULL, auto-updates                |
| is_deleted      | BOOLEAN            | soft delete flag                      |
| deleted_at      | DATETIME (UTC)     | nullable                              |

### 2. `customers`
| Column          | Type               | Constraints                          |
|-----------------|--------------------|----------------------------------------|
| id              | BIGINT             | PK, autoincrement                     |
| customer_code   | VARCHAR(50)        | UNIQUE, indexed, NOT NULL             |
| full_name       | VARCHAR(150)       | NOT NULL, indexed                     |
| phone           | VARCHAR(20)        | UNIQUE, indexed, NOT NULL             |
| email           | VARCHAR(255)       | nullable                              |
| company         | VARCHAR(150)       | nullable                              |
| city            | VARCHAR(100)       | nullable, composite-indexed with state|
| state           | VARCHAR(100)       | nullable, composite-indexed with city |
| notes           | TEXT               | nullable                              |
| status          | ENUM               | active / inactive / blocked, indexed  |
| created_at      | DATETIME (UTC)     | NOT NULL                              |
| updated_at      | DATETIME (UTC)     | NOT NULL, auto-updates                |
| is_deleted      | BOOLEAN            | soft delete flag                      |
| deleted_at      | DATETIME (UTC)     | nullable                              |

`customer_code` and `phone` are both unique — this is what enforces
"no duplicate customers" and "phone must be unique" at the database
level, not just in application code.

### 3. `knowledge_base`
| Column     | Type           | Constraints                              |
|------------|----------------|--------------------------------------------|
| id         | BIGINT         | PK, autoincrement                         |
| title      | VARCHAR(200)   | NOT NULL, indexed                         |
| category   | VARCHAR(100)   | NOT NULL, indexed (+ composite w/ status) |
| content    | TEXT           | NOT NULL                                  |
| status     | ENUM           | draft / published / archived, indexed     |
| created_at | DATETIME (UTC) | NOT NULL                                  |
| updated_at | DATETIME (UTC) | NOT NULL, auto-updates                    |
| is_deleted | BOOLEAN        | soft delete flag                          |
| deleted_at | DATETIME (UTC) | nullable                                  |

### 4. `calls`
| Column         | Type            | Constraints                                    |
|-----------------|----------------|--------------------------------------------------|
| id              | BIGINT         | PK, autoincrement                                |
| customer_id     | BIGINT         | FK → customers.id, ON DELETE CASCADE, indexed    |
| call_type       | ENUM           | outbound / inbound, indexed                      |
| status          | ENUM           | queued / in_progress / completed / failed / missed / cancelled, indexed |
| duration        | INTEGER        | seconds, nullable until call completes           |
| recording_url   | VARCHAR(500)   | nullable                                         |
| transcript      | TEXT           | nullable                                         |
| ai_summary      | TEXT           | nullable                                         |
| sentiment       | ENUM           | positive / neutral / negative / unknown, indexed |
| started_at      | DATETIME (UTC) | NOT NULL                                         |
| ended_at        | DATETIME (UTC) | nullable                                         |

No soft delete on `calls` — recordings/transcripts are an audit trail
that reporting depends on, so rows aren't expected to be deleted through
normal app usage.

### 5. `follow_ups`
| Column        | Type            | Constraints                                  |
|---------------|-----------------|------------------------------------------------|
| id            | BIGINT          | PK, autoincrement                              |
| customer_id   | BIGINT          | FK → customers.id, ON DELETE CASCADE, indexed  |
| followup_date | DATE            | NOT NULL, indexed                              |
| status        | ENUM            | pending / completed / cancelled, indexed       |
| notes         | TEXT            | nullable                                       |
| created_at    | DATETIME (UTC)  | NOT NULL                                       |

### 6. `reports`
| Column        | Type            | Constraints                                        |
|---------------|-----------------|-------------------------------------------------------|
| id            | BIGINT          | PK, autoincrement                                     |
| report_type   | ENUM            | call_summary / customer_summary / agent_performance / custom, indexed |
| generated_at  | DATETIME (UTC)  | NOT NULL, indexed                                     |
| generated_by  | BIGINT          | FK → users.id, ON DELETE SET NULL, nullable, indexed  |

---

## Relationships

```
users (1) ────────────< (0..N) reports
   generates              generated_by (nullable, ON DELETE SET NULL)

customers (1) ─────────< (0..N) calls
   places/receives         customer_id (ON DELETE CASCADE)

customers (1) ─────────< (0..N) follow_ups
   scheduled for            customer_id (ON DELETE CASCADE)
```

- **Customer → Calls / Follow-ups**: one customer has many calls and
  many follow-ups. Cascade delete is set at the database level as a
  safety net — but the normal deletion path for a customer is
  *soft*-delete (`is_deleted = true`), which does not touch child rows
  at all. The cascade only fires if a customer is ever hard-deleted
  directly.
- **User → Reports**: a report optionally records which user generated
  it. If that user is later removed, `generated_by` is set to `NULL`
  instead of deleting the report — reports are an audit record and
  must survive user deletion.
- **Knowledge Base** has no foreign keys yet — it isn't linked to Calls
  until a future module wires up the AI calling engine.

---

## ER Diagram (text format)

```
┌─────────────────────┐
│        users         │
├─────────────────────┤
│ PK id                │
│ UQ email              │
│    full_name          │
│    password_hash      │
│    role               │
│    status              │
│    created_at         │
│    updated_at         │
│    is_deleted          │
│    deleted_at          │
└──────────┬───────────┘
           │ 1
           │
           │ 0..N  (generated_by, ON DELETE SET NULL)
┌──────────▼───────────┐
│       reports         │
├─────────────────────┤
│ PK id                 │
│ FK generated_by ──────┘
│    report_type        │
│    generated_at       │
└─────────────────────┘

┌─────────────────────┐
│      customers        │
├─────────────────────┤
│ PK id                 │
│ UQ customer_code      │
│ UQ phone               │
│    full_name           │
│    email               │
│    company             │
│    city / state        │
│    notes               │
│    status              │
│    created_at / updated_at │
│    is_deleted / deleted_at │
└──────────┬───────────┘
      1     │      1
   ┌────────┴────────┐
   │ 0..N             │ 0..N   (both ON DELETE CASCADE)
┌──▼──────────────┐ ┌─▼───────────────┐
│      calls        │ │   follow_ups      │
├──────────────────┤ ├──────────────────┤
│ PK id             │ │ PK id             │
│ FK customer_id ───┘ │ FK customer_id ───┘
│    call_type       │ │    followup_date   │
│    status           │ │    status           │
│    duration         │ │    notes            │
│    recording_url    │ │    created_at        │
│    transcript        │ └──────────────────┘
│    ai_summary        │
│    sentiment          │
│    started_at         │
│    ended_at            │
└──────────────────┘

┌─────────────────────┐
│    knowledge_base     │   (no foreign keys yet — reserved for the
├─────────────────────┤    future AI calling engine)
│ PK id                 │
│    title               │
│    category             │
│    content               │
│    status                │
│    created_at / updated_at │
│    is_deleted / deleted_at │
└─────────────────────┘
```

---

## Migration commands

```bash
cd backend

# Apply the Module 2 migration (creates all six tables)
alembic upgrade head

# Roll it back if needed
alembic downgrade -1

# After adding/changing models in a future module, generate the next migration:
alembic revision --autogenerate -m "description of the change"
alembic upgrade head
```

The migration file is:
`backend/alembic/versions/20260816_1247_ee1f2eff4471_create_core_crm_tables.py`

It was written to match exactly what `alembic revision --autogenerate`
would produce from the models in `app/models/` (verified by
cross-checking every column, type, and constraint against each model
file), since no live MySQL instance is available in this environment to
run autogenerate directly. Before running it against a real database,
it's worth running `alembic check` (Alembic ≥ 1.13) once a MySQL
instance is reachable, to confirm the migration and models agree.
