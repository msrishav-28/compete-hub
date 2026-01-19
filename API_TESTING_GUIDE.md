# API Testing Guide

Verify that the CompeteHub API and data fetchers are functioning correctly.

---

## Starting the Application

### Windows Quick Start
```bash
start.bat
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## Health Check

**Browser:**
```
http://localhost:8000/health
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-09T12:00:00",
  "version": "2.0.0",
  "environment": "development",
  "database": {
    "connected": true,
    "name": "competehub"
  },
  "fetchers": {
    "count": 4,
    "sources": ["codeforces", "kaggle", "hackerrank", "hackalist"]
  }
}
```

---

## Testing Endpoints

### List Competitions

```
GET http://localhost:8000/api/competitions?limit=10
```

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?limit=10"
$response.data | Select-Object title, platform, category | Format-Table
```

### Filter by Category

```
GET http://localhost:8000/api/competitions?category=coding_contest
```

### Filter by Platform

```
GET http://localhost:8000/api/competitions?platform=Codeforces
```

### Filter by Difficulty

```
GET http://localhost:8000/api/competitions?difficulty=intermediate
```

### Search

```
GET http://localhost:8000/api/competitions?search=machine%20learning
```

### Get Statistics

```
GET http://localhost:8000/api/stats/overview
```

### Force Refresh

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/refresh" -Method Post
```

---

## Testing Individual Fetchers

### Codeforces

```powershell
# Direct API test
$cf = Invoke-RestMethod -Uri "https://codeforces.com/api/contest.list"
Write-Host "Status: $($cf.status), Contests: $($cf.result.Count)"

# Via CompeteHub
$comps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Codeforces"
Write-Host "Codeforces in CompeteHub: $($comps.total)"
```

### Kaggle

```powershell
$comps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Kaggle"
Write-Host "Kaggle competitions: $($comps.total)"
```

### HackerRank

```powershell
$comps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=HackerRank"
Write-Host "HackerRank competitions: $($comps.total)"
```

### Hackalist

```powershell
$comps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Hackalist"
Write-Host "Hackalist competitions: $($comps.total)"
```

---

## Frontend Verification

1. **Landing Page** - http://localhost:3000
2. **Explore** - http://localhost:3000/explore - Verify competitions load
3. **Dashboard** - http://localhost:3000/dashboard - Verify charts render
4. **Calendar** - http://localhost:8000/calendar - Verify date display
5. **Browser Console (F12)** - Check for errors

---

## Troubleshooting

### No competitions displayed
1. Check backend logs for fetch errors
2. Force refresh: `POST http://localhost:8000/api/refresh`
3. Verify database connection in health check

### Fetcher returning 0 results
- Web scrapers (HackerRank, Hackalist) may fail if site structure changes
- Check backend console for specific error messages
- APIs (Codeforces, Kaggle) are more reliable

### Frontend connection errors
1. Verify backend running on port 8000
2. Check CORS_ORIGINS includes http://localhost:3000
3. Check browser Network tab for failed requests

### Database not connected
1. Verify MONGODB_URL in .env
2. Check MongoDB Atlas IP whitelist
3. Verify credentials in connection string

---

## Interactive API Documentation

Full Swagger UI available at:
```
http://localhost:8000/docs
```

Features:
- Complete endpoint reference
- Request/response schemas
- Try out endpoints directly
