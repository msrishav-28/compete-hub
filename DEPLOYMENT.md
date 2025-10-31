# Deployment Guide

## Overview

Deploy CompeteHub to production using:
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Railway (recommended) or Render

**Estimated time**: 30 minutes  
**Cost**: $5-10/month (or FREE with Render free tier)

---

## Local Development

### Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Run Locally
```bash
# Option 1: Use startup script (Windows)
start.bat

# Option 2: Manual (two terminals)
# Terminal 1
cd backend && python main.py

# Terminal 2
cd frontend && npm run dev
```

Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Production Deployment

### Step 1: Deploy Backend

#### Option A: Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Configure:
   - Root Directory: `backend`
   - Environment Variables:
     ```
     CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
     PORT=8000
     CACHE_TTL_HOURS=24
     ```
6. Deploy and copy your Railway URL (e.g., `https://competehub.railway.app`)

#### Option B: Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Create new "Web Service"
4. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment Variables: (same as Railway above)
5. Deploy and copy your Render URL

### Step 2: Deploy Frontend

#### Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project" → Import your repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://your-backend.railway.app
     ```
5. Deploy and copy your Vercel URL

#### Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Import repository
3. Configure:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Environment: `VITE_API_URL=https://your-backend-url`
4. Deploy

### Step 3: Update CORS

1. Return to Railway/Render dashboard
2. Update `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```
3. Redeploy backend

### Step 4: Verify Deployment

**Backend Health Check:**
```bash
curl https://your-backend-url/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "fetchers_count": 4
}
```

**Frontend Check:**
1. Visit your Vercel URL
2. Open browser DevTools
3. Verify:
   - No console errors
   - Competitions load
   - API calls succeed (Network tab)
   - All features work (search, filter, save, dark mode)

---

## Environment Variables

### Backend
Create `backend/.env`:
```bash
PORT=8000
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
CACHE_TTL_HOURS=24
```

### Frontend
Create `frontend/.env`:
```bash
VITE_API_URL=https://your-backend.railway.app
```

---

## Platform Comparison

| Platform | Best For | Free Tier | Always On | Cost |
|----------|----------|-----------|-----------|------|
| **Vercel** | Frontend (React/Vite) | Yes | Yes | FREE |
| **Railway** | Backend (Python/FastAPI) | $5 credit | Yes | $5-10/mo |
| **Render** | Backend alternative | 750hr/mo | No (sleeps) | FREE or $7/mo |
| **Netlify** | Frontend alternative | Yes | Yes | FREE |

**Recommended Stack**: Vercel (Frontend) + Railway (Backend)

---

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGINS` includes your Vercel URL
- No trailing slashes
- Redeploy backend after changing env vars

### API Calls Failing
- Check `VITE_API_URL` in Vercel settings
- Ensure backend is running (test /health endpoint)
- Check browser console for errors

### Build Failures
- **Frontend**: Verify Node.js 18+ and all dependencies installed
- **Backend**: Verify Python 3.8+ and requirements.txt complete

### Backend Sleeps (Render Free Tier)
- Upgrade to $7/month paid tier for always-on
- Or use Railway for better free tier
- Or accept 15-30 second cold starts

---

## Cost Breakdown

### Development (Free)
- Vercel: FREE
- Railway: FREE ($5 credit/month)
- **Total: FREE**

### Production (Light Traffic)
- Vercel: FREE (100GB bandwidth/month)
- Railway: $5-10/month
- **Total: $5-10/month**

### 100% Free Option
- Vercel: FREE
- Render Free Tier: FREE (with cold starts)
- **Total: FREE** (with limitations)

---

## Post-Deployment

### Custom Domain (Optional)
1. **Vercel**: Settings → Domains → Add Domain
2. **Railway**: Settings → Domains → Custom Domain
3. Update DNS records as instructed

### Monitoring
- Check platform dashboards for logs
- Monitor response times
- Review error rates
- Set up alerts (optional)

### Maintenance
- Auto-deploys on Git push (already configured)
- Update dependencies regularly
- Monitor costs
- Review logs weekly

---

## Quick Reference

**URLs After Deployment:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-api.railway.app`
- API Docs: `https://your-api.railway.app/docs`

**Essential Commands:**
```bash
# Local development
start.bat

# Health check
curl https://your-backend-url/health

# View logs
# Check platform dashboards (Vercel/Railway/Render)
```

**Support:**
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)

---

**Your app is ready for deployment!** Follow the steps above and you'll be live in ~30 minutes.
