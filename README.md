# CompeteHub

A platform for engineering students to discover, track, and manage competitions —
hackathons, coding contests, data-science challenges, and corporate hiring events.

**Stack:** FastAPI + Supabase Postgres (backend) · React + Vite + Tailwind (frontend) ·
Render (API hosting) · Vercel (frontend hosting).

---

## Repository layout

```
competehub/
├── backend/
│   ├── main.py                  FastAPI app + routes
│   ├── database.py              asyncpg pool
│   ├── schema.sql               Run once in Supabase SQL editor
│   ├── core/                    Settings + dependencies
│   ├── repositories/            SQL access (competitions, users)
│   ├── schemas/                 Pydantic request/response models
│   ├── services/                Business logic
│   ├── render.yaml              Render deploy config
│   ├── Procfile                 Heroku-style start command
│   └── requirements.txt
├── fetchers/
│   ├── base_fetcher.py
│   ├── coding_contests/codeforces.py     Codeforces public API
│   ├── coding_contests/clist.py           clist.by aggregator (80+ sites, needs key)
│   ├── data_science/kaggle.py             Kaggle official API (needs creds)
│   ├── hackathons/devpost.py              Devpost public JSON API
│   ├── hackathons/unstop.py               Unstop public JSON API (Indian students)
│   └── hackathons/mlh.py                  MLH season schedule (HTML)
├── models/competition.py        Dataclass shared with fetchers
├── frontend/                    React + Vite app (not modified in this pass)
└── start.bat                    Windows convenience launcher
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+ (frontend only)
- A Supabase project (free tier is fine)

---

## One-time setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL editor** → paste the contents of `backend/schema.sql` → **Run**.
3. **Project Settings → Database → Connection string** → copy the *URI* (direct
   connection, NOT the pgbouncer "transaction mode" URL).

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env: paste the Supabase URI into DATABASE_URL and set an ADMIN_KEY.
```

Generate an admin key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000 for local dev.
```

---

## Running locally

**Windows quick start:** `start.bat`

**Manual:**

```bash
# Terminal 1
cd backend
python -m backend.main

# Terminal 2
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

On first run the API serves an empty list while a background task scrapes
the sources (~10–30s). Subsequent requests are instant.

---

## API surface

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/api/competitions` | Filtered + paginated list. Query params: `category`, `difficulty`, `time_commitment`, `platform`, `recruitment_only`, `search`, `limit`, `offset`. |
| GET | `/api/competitions/{id}` | Single competition. |
| GET | `/api/competitions/upcoming/week` | Starting in the next 7 days. |
| GET | `/api/stats/overview` | Counts by category / difficulty / platform. |
| GET | `/api/users/profile?user_id=…` | Profile + saved IDs. |
| POST | `/api/users/profile?user_id=…` | Partial profile update. |
| POST | `/api/users/competition/save?user_id=…` | Body: `{comp_id, save}`. Idempotent. |
| POST | `/api/users/competition/enter?user_id=…` | Body: `{comp_id}` or a bare JSON string. |
| POST | `/api/users/competition/win?user_id=…` | Body: `{comp_id, placement}`. |
| GET | `/api/recommendations?user_id=…` | Scored recommendations. |
| GET | `/api/analytics/user?user_id=…` | Aggregated stats for the user. |
| GET | `/health` | Returns `503` when DB is unreachable. |

Rate limit: 60 requests/minute per IP on mutating endpoints (configurable
via `RATE_LIMIT_PER_MINUTE`).

### Admin (requires `X-Admin-Key` header)

| Method | Path | Description |
|---|---|---|
| POST | `/api/refresh` | Force-refresh all sources. Rate-limited to 5/hour per IP. |
| GET | `/api/refresh/status` | Last-updated + count per source. |

`user_id` defaults to `"default_user"` — when real auth lands, the
`get_current_user_id` dependency in `backend/core/dependencies.py` is the
only file that changes.

---

## Data sources

| Source | Method | Auth | Typical results |
|---|---|---|---|
| **Codeforces** | Public API | none | 1–5 upcoming Codeforces Rounds |
| **clist.by** | Aggregator API | `CLIST_USERNAME` + `CLIST_API_KEY` (optional) | 100+ upcoming contests across CodeChef, AtCoder, LeetCode, TopCoder, ICPC, etc. — skipped cleanly if keys absent |
| **Kaggle** | Official API | `KAGGLE_USERNAME` + `KAGGLE_KEY` (optional) | ~10–30 active competitions; skipped cleanly if keys absent |
| **Devpost** | Public JSON API | none | 50+ active hackathons including XPRIZE, Google Cloud, Reddit, etc. |
| **Unstop** | Public JSON API | none | 100+ Indian student hackathons + competitions (placement leagues, ideathons, coding challenges) |
| **MLH** | HTML scrape | none | ~10–30 student hackathons per season (current + next season pages) |

- Kaggle tokens: [kaggle.com/settings/account](https://www.kaggle.com/settings/account) → "Create New Token".
- clist.by keys: [clist.by/api/v4/doc/](https://clist.by/api/v4/doc/) → sign in → API key. Rate limit 10/min (we use 1/refresh).

---

## Concurrency model

- **DB:** single asyncpg pool (default `min=2`, `max=10`). Tune via
  `DB_POOL_MIN_SIZE` / `DB_POOL_MAX_SIZE`.
- **Save / unsave** is atomic via the composite primary key on
  `saved_competitions(user_id, competition_id)`.
- **Win recording** runs in a single transaction.
- **Concurrent refreshes** of the same source are serialized via
  `pg_try_advisory_lock` — the second caller returns "already in progress"
  immediately instead of double-scraping.
- **Cold starts** never block on scraping. Lifespan opens the DB pool
  and yields. If the table is empty, a background task starts the
  initial fetch; it can be observed via `/api/refresh/status`.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## License

MIT.
