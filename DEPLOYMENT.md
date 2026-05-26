# Deployment

Vercel (frontend) · Render (backend) · Supabase (Postgres).

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL editor** → paste `backend/schema.sql` → **Run**. The script is
   idempotent — safe to re-run if you tweak it.
3. **Project Settings → Database → Connection string** → copy the *direct*
   URI (not pgbouncer):
   ```
   postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
   ```

That's it. No tables to create manually, no RLS policies to write — auth
isn't wired up yet, so the API is the only thing talking to the DB.

---

## 2. Render (backend)

1. Sign in at [render.com](https://render.com) with GitHub.
2. **New → Web Service →** connect this repo.
3. **Root directory:** `backend`.
4. Render auto-detects `backend/render.yaml`. Confirm:
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn backend.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
   - Health: `/health`
5. Set environment variables in the Render dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase URI from step 1 |
   | `CORS_ORIGINS` | `https://your-frontend.vercel.app` (no trailing slash) |
   | `ADMIN_KEY` | A long random string — `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
   | `ENVIRONMENT` | `production` |

6. Deploy. First boot opens the DB pool and starts a background scrape;
   `/health` is reachable immediately.

### 2b. Render Cron Service (periodic refresh)

`backend/render.yaml` also declares a second service of `type: cron`
named **competehub-refresh**. Render creates it alongside the web
service from the same blueprint.

| Setting | Value |
|---|---|
| Schedule | `0 */6 * * *` (every 6 hours) |
| Start command | `python -m backend.cron refresh` |
| Env vars | Same `DATABASE_URL` + optional `KAGGLE_*` / `CLIST_*` as the web service |

The cron job:
- Opens the asyncpg pool, runs the same `FetcherService` the API uses, closes the pool, exits.
- Honours each source's TTL (`CACHE_TTL_HOURS`, default 24) so successive runs cost nothing when nothing has changed.
- The Postgres advisory lock inside `FetcherService` means a cron run and a manual `POST /api/refresh` cannot double-scrape the same source even if they overlap exactly.

You can force a full refresh via `python -m backend.cron refresh --force` (locally) or by triggering the cron from the Render dashboard's "Run job" button.

---

## 3. Vercel (frontend)

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **New Project → import this repo**.
3. Root directory: `frontend`. Vercel auto-detects Vite.
4. Set environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | Your Render URL, e.g. `https://competehub-api.onrender.com` |

5. Deploy.

---

## 4. Wire CORS

After Vercel gives you a URL, update `CORS_ORIGINS` on Render to that exact
origin. Render auto-redeploys.

---

## Operations

- **Scheduled refresh:** The `competehub-refresh` cron service runs every 6 hours automatically. To trigger it manually, use Render's dashboard → competehub-refresh → "Run job".
- **Manual refresh (via API):**
  ```bash
  curl -X POST https://your-api.onrender.com/api/refresh \
       -H "X-Admin-Key: $ADMIN_KEY"
  ```
- **Source status:**
  ```bash
  curl https://your-api.onrender.com/api/refresh/status \
       -H "X-Admin-Key: $ADMIN_KEY"
  ```
  Per-source `last_updated`, `last_status` (ok / empty / timeout / error: …), and `competition_count`.
- **Health:** `GET /health` returns HTTP 503 when the DB is unreachable —
  Render's load balancer will route traffic away automatically.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/health` returns 503 in prod | `DATABASE_URL` wrong or DB unreachable | Re-copy from Supabase. Use the direct URL, not pgbouncer's transaction-mode URL. |
| `/api/refresh` returns 403 | Missing/wrong `X-Admin-Key` header | Match the `ADMIN_KEY` env var exactly. |
| `/api/refresh` returns 503 | `ADMIN_KEY` not set | Set it in Render env vars and redeploy. |
| Empty competitions after deploy | Initial fetch still running, or all scrapers failed | Hit `/api/refresh/status` — `last_status` will show per-source errors. |
| CORS errors in browser | `CORS_ORIGINS` doesn't match the Vercel URL | Update Render env var; no trailing slash; redeploy. |
| `relation "competitions" does not exist` | `schema.sql` not run | Run it in Supabase SQL editor. |
