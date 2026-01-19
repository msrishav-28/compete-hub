# Deployment Guide

## Overview

Deploy CompeteHub to production using:
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Render (recommended)
- **Database**: MongoDB Atlas (FREE tier available)

**Estimated time**: 30 minutes  
**Cost**: FREE (using Render free tier + MongoDB Atlas free tier)

---

## Quick Start: Render + MongoDB Atlas

### Step 1: Set Up MongoDB Atlas (FREE)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up
2. Create a **FREE** cluster (M0 Sandbox)
3. **Set up Database Access:**
   - Go to Security → Database Access
   - Add a new database user with username/password
   - Note down the credentials
4. **Set up Network Access:**
   - Go to Security → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render compatibility
5. **Get Connection String:**
   - Go to Deployment → Database → Connect
   - Choose "Connect your application"
   - Copy the connection string, it looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials

### Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `competehub-api` |
   | **Region** | Oregon (US West) or closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120` |
   | **Instance Type** | Free |

5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `MONGODB_URL` | Your MongoDB Atlas connection string |
   | `DB_NAME` | `competehub` |
   | `ENVIRONMENT` | `production` |
   | `CORS_ORIGINS` | `https://your-frontend.vercel.app` (update after frontend deploy) |

6. Click **"Create Web Service"**
7. Wait for deployment (3-5 minutes)
8. Copy your Render URL: `https://competehub-api.onrender.com`
9. Test: Visit `https://competehub-api.onrender.com/health`

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"New Project"** → Import your repository
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://competehub-api.onrender.com` |

5. Click **"Deploy"**
6. Copy your Vercel URL: `https://competehub.vercel.app`

### Step 4: Update CORS (Important!)

1. Go back to Render dashboard
2. Navigate to your `competehub-api` service → Environment
3. Update `CORS_ORIGINS`:
   ```
   https://competehub.vercel.app,https://your-custom-domain.com
   ```
4. Click "Save Changes" - Render will auto-redeploy

---

## Verification Checklist

After deployment, verify everything works:

- [ ] Backend health: `https://your-backend.onrender.com/health` → Should show `"status": "healthy"`
- [ ] API docs: `https://your-backend.onrender.com/docs` → Should load Swagger UI
- [ ] Frontend loads: `https://your-frontend.vercel.app` → Should show landing page
- [ ] Competitions load: Navigate to Explore page → Should fetch competitions
- [ ] Database connected: Health endpoint shows `"database": {"connected": true}`

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

### Set Up Local Environment
```bash
# Backend - create backend/.env
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB Atlas URL

# Frontend - create frontend/.env
cp frontend/.env.example frontend/.env
```

### Run Locally
```bash
# Option 1: Use startup script (Windows)
start.bat

# Option 2: Manual (two terminals)
# Terminal 1 - Backend
cd backend && python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Access locally:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Troubleshooting

### Backend won't start on Render
- Check Render logs for errors
- Verify `MONGODB_URL` is set correctly (no `<password>` placeholder)
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Database connection fails
- Verify MongoDB Atlas user has correct permissions
- Check if password contains special characters (URL-encode them)
- Test connection string locally first

### CORS errors on frontend
- Verify `CORS_ORIGINS` includes your frontend URL (exact match, with https://)
- Check for trailing slashes - don't include them
- Redeploy backend after updating CORS

### Render free tier sleeps
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Consider upgrading to paid tier for production

---

## Production Checklist

Before going live:

- [ ] MongoDB Atlas: IP whitelist configured
- [ ] MongoDB Atlas: Database user created with strong password
- [ ] Render: All environment variables set
- [ ] Render: Health check passing
- [ ] Vercel: `VITE_API_URL` pointing to Render backend
- [ ] CORS: Frontend URL added to `CORS_ORIGINS`
- [ ] Test: All API endpoints working
- [ ] Test: User can save competitions
- [ ] Test: Competitions load on Explore page
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
