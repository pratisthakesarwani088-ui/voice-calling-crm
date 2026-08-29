# AI Voice Calling CRM

A responsive AI-powered CRM for managing customers, products, and a
Knowledge Base, running AI outbound voice calls (Demo simulation or
Real via Vapi + ElevenLabs), and storing transcripts, recordings,
summaries, and reports.

> **Final build.** All planned modules are complete and verified:
> Authentication (single Admin account) · Dashboard (real-time stats,
> live Call Status, system status, recent activity, global search,
> notifications) · Customer Management · Product Management ·
> Knowledge Base Management · CSV/Excel Import (+ Export for
> Customers) · AI Assistant (Gemini, grounded only in this CRM's own
> database — no RAG/embeddings) · Hybrid Voice Calling (Demo + Real,
> with a Twilio/Exotel telephony provider abstraction, Vapi webhook +
> polling for live status, a real 60-second call duration cap, and
> recording capture/download) · Call History · Reports (charts +
> statistics, all computed live from the database) · Settings
> (company/AI/voice/telephony configuration, connectivity tests,
> change password). See
> [`docs/architecture.md`](docs/architecture.md),
> [`docs/database.md`](docs/database.md),
> [`docs/authentication.md`](docs/authentication.md),
> [`docs/customers.md`](docs/customers.md),
> [`docs/products-knowledge-base.md`](docs/products-knowledge-base.md),
> [`docs/data-import.md`](docs/data-import.md),
> [`docs/ai-assistant.md`](docs/ai-assistant.md),
> [`docs/voice-calling.md`](docs/voice-calling.md), and
> [`docs/call-history-reports.md`](docs/call-history-reports.md) for
> per-feature detail. Settings and the Reports charts don't have their
> own doc file — see their route/service source comments instead.

---

## Tech Stack

| Layer          | Technology                                              |
|----------------|-----------------------------------------------------------|
| Frontend       | React 19, Vite, Tailwind CSS, React Router DOM, Axios   |
| Backend        | FastAPI, Python 3.12+, SQLAlchemy, Alembic, Pydantic, Uvicorn |
| Database       | MySQL                                                    |
| Auth           | JWT (structure only — implemented in a later module)    |
| Deployment     | Render                                                   |

---

## Project Structure

```
ai-voice-crm/
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── components/      # Reusable UI (customers/, products/, knowledge/,
│   │   │                    #   calls/, imports/, charts/, + shared pieces)
│   │   ├── layouts/         # Shared page shells (MainLayout, DashboardLayout)
│   │   ├── pages/           # Route-level components (one per sidebar section)
│   │   ├── services/        # Axios API client + one file per backend resource
│   │   ├── hooks/           # useAuth, useToast
│   │   ├── context/         # AuthContext, ToastContext
│   │   └── utils/           # Per-domain constants/validators/options
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── routes/          # One router per resource (auth, customers, products,
│   │   │                    #   knowledge_base, imports, ai, calls, reports,
│   │   │                    #   settings, dashboard, health)
│   │   ├── models/          # SQLAlchemy ORM models (base, enums, user, customer,
│   │   │                    #   product, knowledge_base, call, follow_up, report,
│   │   │                    #   app_settings)
│   │   ├── schemas/         # Pydantic request/response schemas, one per resource
│   │   ├── services/        # Business logic, one per resource, plus
│   │   │                    #   telephony/ (Twilio/Exotel provider abstraction)
│   │   ├── database/        # Engine/session setup
│   │   ├── middleware/      # CORS, JWT auth dependency, request logging
│   │   ├── config/          # Environment-driven settings
│   │   ├── utils/           # Validators, code generation, logging config,
│   │   │                    #   custom exceptions
│   │   └── main.py          # FastAPI app entrypoint
│   ├── alembic/              # Database migrations (versions/ has the full history)
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
│
├── docs/                      # Per-feature design notes (see links above)
├── uploads/                    # Local file storage
├── render.yaml                # Render Blueprint (both services)
├── .gitignore
├── .env.example
└── README.md
```

See [`docs/architecture.md`](docs/architecture.md) for a deeper
explanation of each layer.

---

## Prerequisites

- Node.js 20+
- Python 3.12+
- MySQL 8+ (running locally, or a connection string to a hosted instance)

---

## 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# then edit .env with your real MySQL credentials and secret key

# Create the database (one time, in MySQL)
# mysql -u root -p -e "CREATE DATABASE ai_voice_crm;"

# Run the API (auto-reloads on file changes)
uvicorn app.main:app --reload
```

- API available at: `http://localhost:8000`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### Alembic (database migrations)

Migrations already exist and are applied in order automatically the
first time you run `alembic upgrade head`:

```bash
cd backend
alembic upgrade head
```

If you change a model, generate a new migration the same way:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# then edit .env if your backend runs somewhere other than localhost:8000

# Run the dev server
npm run dev
```

- App available at: `http://localhost:5173`
- It calls the backend's `/api/v1/health` endpoint on load and shows a
  connection status badge — a quick way to confirm both services are
  wired together correctly.

---

## 3. Running Both Together

Open two terminals:

```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Then visit `http://localhost:5173` — you should see a green
**"Backend connected"** badge.

---

## Environment Variables

| File                     | Purpose                                             |
|--------------------------|------------------------------------------------------|
| `backend/.env.example`   | Database URL, secret key, CORS origins, app settings |
| `frontend/.env.example`  | `VITE_API_BASE_URL` — where the frontend finds the API |

Copy each `.env.example` to `.env` in its own folder for local
development. **Never commit real `.env` files** — they're already
excluded in `.gitignore`.

---

## Deploying to Render

This repo includes a [`render.yaml`](render.yaml) Blueprint that defines
both services (backend web service + frontend static site).

1. Push this repo to GitHub.
2. In Render, choose **New → Blueprint** and point it at the repo.
3. Render will create both services automatically from `render.yaml`.
4. Fill in the environment variables marked `sync: false` in the
   Render dashboard for each service:
   - Backend: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
   - Frontend: `VITE_API_BASE_URL` (set this to the backend service's
     Render URL once it's created)
5. Set `CORS_ORIGINS` on the backend to the frontend's Render URL so
   the browser is allowed to call the API.

No code changes are needed between local and Render — every setting is
read from environment variables.

---

## Optional Integrations

The app runs fully with just a database and a single Admin account —
Gemini, Vapi, ElevenLabs, and Twilio/Exotel are all optional:

- **Demo Call** and **Ask AI** need `GEMINI_API_KEY` (backend `.env`).
- **Real Call** additionally needs `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`,
  `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`. Set `PUBLIC_BASE_URL`
  (your deployed backend URL) so Vapi can deliver webhook events;
  without it, Real Call still works via polling alone.
- **Settings → Telephony**'s connectivity test needs a Twilio or
  Exotel account ID/auth token — entered in the Settings UI itself,
  not an env var.

Every one of these fails gracefully with a clear "not configured"
message if left unset — nothing crashes on startup.
