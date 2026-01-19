# Deployment Guide

Deploy CompeteHub using Vercel (frontend) and Render (backend) with MongoDB Atlas.

---

## Prerequisites

- GitHub repository with CompeteHub code
- MongoDB Atlas account
- Vercel account
- Render account

---

## Step 1: MongoDB Atlas Setup

1. Sign in at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Configure database access:
   - Security > Database Access > Add New Database User
   - Create user with password (save credentials)
4. Configure network access:
   - Security > Network Access > Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Get connection string:
   - Deployment > Database > Connect > Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password

---

## Step 2: Backend Deployment (Render)

1. Sign in at [render.com](https://render.com) with GitHub
2. New > Web Service > Connect your repository
3. Set Root Directory to `backend`
4. Configuration is auto-detected from `backend/render.yaml`:

| Setting | Value |
|---------|-------|
| Name | competehub-api |
| Root Directory | backend |
| Runtime | Python |
| Build Command | pip install -r requirements.txt |
| Start Command | gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 |

4. Set environment variables:

| Variable | Value |
|----------|-------|
| MONGODB_URL | Your MongoDB Atlas connection string |
| DB_NAME | competehub |
| ENVIRONMENT | production |
| CORS_ORIGINS | https://your-app.vercel.app |

5. Deploy and copy your Render URL

---

## Step 3: Frontend Deployment (Vercel)

1. Sign in at [vercel.com](https://vercel.com) with GitHub
2. New Project > Import your repository
3. Configuration is auto-detected from `vercel.json`:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | frontend |
| Build Command | npm run build |
| Output Directory | dist |

4. Set environment variable:

| Variable | Value |
|----------|-------|
| VITE_API_URL | Your Render backend URL (e.g., https://competehub-api.onrender.com) |

5. Deploy and copy your Vercel URL

---

## Step 4: Update CORS

1. Return to Render dashboard
2. Update CORS_ORIGINS with your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
3. Render will auto-redeploy

---

## Verification

| Check | URL | Expected |
|-------|-----|----------|
| Backend health | https://your-backend.onrender.com/health | JSON with status: healthy |
| API docs | https://your-backend.onrender.com/docs | Swagger UI |
| Frontend | https://your-app.vercel.app | Landing page |
| Data loading | Navigate to Explore | Competitions list |

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URL | Yes | MongoDB Atlas connection string |
| DB_NAME | Yes | Database name (competehub) |
| ENVIRONMENT | No | production or development |
| CORS_ORIGINS | Yes | Comma-separated allowed origins |
| CACHE_TTL_HOURS | No | Cache duration (default: 24) |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend API URL |

---

## Troubleshooting

### CORS Errors
- Verify CORS_ORIGINS matches your Vercel URL exactly (no trailing slash)
- Redeploy backend after changing environment variables

### Database Connection Errors
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string has correct password (no `<password>` placeholder)
- Ensure password special characters are URL-encoded

### API Not Loading
- Test backend health endpoint directly
- Check Render logs for startup errors
- Verify VITE_API_URL in Vercel settings

### Build Failures
- Backend: Verify Python 3.10+ and all requirements.txt dependencies
- Frontend: Verify Node.js 18+ and run `npm run build` locally to check

---

## Custom Domain

**Vercel:**
1. Settings > Domains > Add Domain
2. Configure DNS as instructed

**Render:**
1. Settings > Custom Domains > Add Custom Domain
2. Configure DNS records

After adding custom domain, update CORS_ORIGINS on Render.
