# API Testing Guide - CompeteHub

## Quick API Verification

This guide will help you verify that all APIs and web scrapers are working correctly and fetching live data.

---

## 🚀 Step 1: Start the Application

Run the setup script:
```bash
start.bat
```

Wait for both services to start:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

---

## 🔍 Step 2: Test Backend Health

### Option A: Browser
Open in browser: `http://localhost:8000/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-09T12:00:00.000000",
  "version": "2.0.0",
  "fetchers_count": 4,
  "fetchers": [
    "codeforces",
    "kaggle",
    "hackerrank",
    "hackalist"
  ]
}
```

### Option B: PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

### Option C: curl
```bash
curl http://localhost:8000/health
```

---

## 📊 Step 3: Test Data Fetching

### Test All Competitions Endpoint

**Browser:**
```
http://localhost:8000/api/competitions?limit=10
```

**PowerShell:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?limit=10"
Write-Host "Total competitions:" $response.total
Write-Host "Returned:" $response.data.Count
$response.data | Select-Object title, platform, category | Format-Table
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "codeforces_1234",
      "title": "Codeforces Round #XXX",
      "platform": "Codeforces",
      "category": "coding_contest",
      "start_date": "2024-11-15T12:00:00",
      "difficulty": "intermediate",
      ...
    },
    ...
  ],
  "total": 150,
  "limit": 10,
  "offset": 0,
  "page": 1,
  "total_pages": 15
}
```

---

## 🎯 Step 4: Test Individual Fetchers

### Test Statistics Endpoint
This will show how many competitions were fetched from each source:

**Browser:**
```
http://localhost:8000/api/stats/overview
```

**PowerShell:**
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:8000/api/stats/overview"
Write-Host "Total Competitions:" $stats.data.total_competitions
Write-Host "`nBy Platform:"
$stats.data.by_platform | Format-List
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_competitions": 150,
    "by_category": {
      "coding_contest": 45,
      "kaggle": 30,
      "hackathon": 50,
      "corporate_challenge": 25
    },
    "by_difficulty": {
      "beginner": 40,
      "intermediate": 70,
      "advanced": 30,
      "expert": 10
    },
    "by_platform": {
      "Codeforces": 45,
      "Kaggle": 30,
      "HackerRank": 25,
      "Hackalist": 50
    },
    "last_updated": "2024-11-09T12:00:00"
  }
}
```

---

## 🔄 Step 5: Manual Data Refresh

Force a fresh fetch from all sources:

**PowerShell:**
```powershell
$refresh = Invoke-RestMethod -Uri "http://localhost:8000/api/refresh" -Method Post
$refresh.results | Format-List
```

**curl:**
```bash
curl -X POST http://localhost:8000/api/refresh
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "codeforces": {
      "success": true,
      "count": 45
    },
    "kaggle": {
      "success": true,
      "count": 30
    },
    "hackerrank": {
      "success": true,
      "count": 25
    },
    "hackalist": {
      "success": true,
      "count": 50
    }
  }
}
```

---

## 🎨 Step 6: Test Filtering

### Filter by Category

**Browser:**
```
http://localhost:8000/api/competitions?category=coding_contest
```

**PowerShell:**
```powershell
$coding = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?category=coding_contest&limit=5"
Write-Host "Coding Contests:" $coding.total
$coding.data | Select-Object title, platform, difficulty | Format-Table
```

### Filter by Difficulty

```
http://localhost:8000/api/competitions?difficulty=beginner&limit=5
```

### Filter by Platform

```
http://localhost:8000/api/competitions?platform=Codeforces&limit=5
```

### Search

```
http://localhost:8000/api/competitions?search=machine%20learning&limit=5
```

### Combined Filters

```
http://localhost:8000/api/competitions?category=kaggle&difficulty=intermediate&limit=5
```

---

## 🧪 Step 7: Verify Each Fetcher

### 1. Codeforces Fetcher ✅

**Direct API Test:**
```powershell
# Test Codeforces API directly
$cf = Invoke-RestMethod -Uri "https://codeforces.com/api/contest.list"
Write-Host "Codeforces API Status:" $cf.status
Write-Host "Total Contests:" $cf.result.Count
```

**CompeteHub API Test:**
```powershell
$cfComps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Codeforces"
Write-Host "Codeforces competitions in CompeteHub:" $cfComps.total
```

**What to Check:**
- ✅ Should return upcoming Codeforces contests
- ✅ All contests should have start_date
- ✅ Difficulty should be set based on Division
- ✅ Duration should be in hours

---

### 2. Kaggle Fetcher ✅

**Direct API Test:**
```powershell
# Test Kaggle API directly
$headers = @{
    'User-Agent' = 'Mozilla/5.0'
    'Accept' = 'application/json'
}
$kaggle = Invoke-RestMethod -Uri "https://www.kaggle.com/api/v1/competitions/list?sortBy=latestDeadline" -Headers $headers
Write-Host "Kaggle Competitions:" $kaggle.Count
```

**CompeteHub API Test:**
```powershell
$kaggleComps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Kaggle"
Write-Host "Kaggle competitions in CompeteHub:" $kaggleComps.total
```

**What to Check:**
- ✅ Should return active/upcoming Kaggle competitions
- ✅ Prize information should be included
- ✅ Tags should include ML/DS related terms
- ✅ Portfolio value should be high (70-80)

---

### 3. HackerRank Fetcher ⚠️ (Web Scraping)

**CompeteHub API Test:**
```powershell
$hrComps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=HackerRank"
Write-Host "HackerRank competitions in CompeteHub:" $hrComps.total
```

**What to Check:**
- ⚠️ May return 0 if website structure changed
- ⚠️ Check backend logs for scraping errors
- ✅ If working, should show contests and hackathons

**If No Results:**
```
Check backend console for errors like:
"Error parsing HackerRank contest card"
"Error fetching from HackerRank"
```

---

### 4. Hackalist Fetcher ⚠️ (Web Scraping)

**CompeteHub API Test:**
```powershell
$hackComps = Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?platform=Hackalist"
Write-Host "Hackalist competitions in CompeteHub:" $hackComps.total
```

**What to Check:**
- ⚠️ May return 0 if website structure changed
- ⚠️ Date parsing might fail for some formats
- ✅ If working, should show hackathons

**If No Results:**
```
Check backend console for errors like:
"Error parsing Hackalist data"
"Error parsing hackathon"
```

---

## 📱 Step 8: Test Frontend Integration

### 1. Open Frontend
Navigate to: `http://localhost:3000`

### 2. Check Home Page
- ✅ Competitions should load
- ✅ Filters should work
- ✅ Search should work
- ✅ Platform badges should show

### 3. Test Dashboard
Navigate to: `http://localhost:3000/dashboard`
- ✅ Statistics should display
- ✅ Charts should render

### 4. Test Calendar
Navigate to: `http://localhost:3000/calendar`
- ✅ Competitions should appear on calendar
- ✅ Dates should be clickable

---

## 🔍 Step 9: Check Backend Logs

In the "CompeteHub Backend" window, you should see:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000

# When fetching data:
INFO:fetchers.base_fetcher:Fetching from Codeforces...
INFO:fetchers.base_fetcher:Successfully fetched 45 competitions from Codeforces
INFO:fetchers.base_fetcher:Fetching from Kaggle...
INFO:fetchers.base_fetcher:Successfully fetched 30 competitions from Kaggle
INFO:fetchers.base_fetcher:Fetching from HackerRank...
INFO:fetchers.base_fetcher:Successfully fetched 25 competitions from HackerRank
INFO:fetchers.base_fetcher:Fetching from Hackalist...
INFO:fetchers.base_fetcher:Successfully fetched 50 competitions from Hackalist
```

**If you see errors:**
```
ERROR:fetchers.base_fetcher:Error fetching from [source]: [error message]
```

This indicates:
- Network issues
- API changes
- Website structure changes (for scrapers)

---

## 🎯 Step 10: Interactive API Documentation

### Access Swagger UI
Open: `http://localhost:8000/docs`

**Features:**
- ✅ Interactive API testing
- ✅ Request/response examples
- ✅ Schema documentation
- ✅ Try out all endpoints

**Try This:**
1. Expand `/api/competitions` endpoint
2. Click "Try it out"
3. Add parameters (e.g., `limit=5`)
4. Click "Execute"
5. View the response

---

## 📊 Success Indicators

### ✅ Everything is Working:
- Health endpoint returns "healthy"
- All 4 fetchers in the list
- Total competitions > 50
- Each platform has competitions
- No errors in backend logs
- Frontend loads and displays data

### ⚠️ Partial Success:
- Some fetchers work (Codeforces, Kaggle likely work)
- Web scrapers (HackerRank, Hackalist) may fail
- Still usable with limited data sources

### ❌ Issues to Fix:
- Health endpoint not accessible → Backend not running
- No competitions → Check backend logs for errors
- Frontend shows errors → Check console (F12)
- Fetcher errors → API changes or network issues

---

## 🛠️ Troubleshooting

### Problem: No competitions showing

**Solution:**
```powershell
# Force refresh
Invoke-RestMethod -Uri "http://localhost:8000/api/refresh" -Method Post

# Check cache
Get-Content "data\competitions.json" | ConvertFrom-Json
```

### Problem: Specific fetcher not working

**Check logs:**
```
# Look for error messages in backend console
# Common issues:
- Network timeout
- HTML structure changed (for scrapers)
- Rate limiting
```

**Test fetcher independently:**
```powershell
# For Codeforces
Invoke-RestMethod -Uri "https://codeforces.com/api/contest.list"

# For Kaggle
Invoke-RestMethod -Uri "https://www.kaggle.com/api/v1/competitions/list"
```

### Problem: Frontend can't connect to backend

**Check:**
1. Backend is running on port 8000
2. No firewall blocking
3. CORS is enabled (should be by default)

**Test connection:**
```powershell
# Should return API info
Invoke-RestMethod -Uri "http://localhost:8000/"
```

---

## 📈 Performance Testing

### Load Test (Optional)

**Test 100 requests:**
```powershell
$times = @()
1..100 | ForEach-Object {
    $start = Get-Date
    Invoke-RestMethod -Uri "http://localhost:8000/api/competitions?limit=10" | Out-Null
    $end = Get-Date
    $times += ($end - $start).TotalMilliseconds
}

Write-Host "Average response time:" ([math]::Round(($times | Measure-Object -Average).Average, 2)) "ms"
Write-Host "Min:" ([math]::Round(($times | Measure-Object -Minimum).Minimum, 2)) "ms"
Write-Host "Max:" ([math]::Round(($times | Measure-Object -Maximum).Maximum, 2)) "ms"
```

**Expected Results:**
- Average: < 100ms (with cache)
- First request: < 500ms (cache miss)

---

## ✅ Final Verification Checklist

Run through this checklist:

- [ ] Backend health check passes
- [ ] All 4 fetchers registered
- [ ] Competitions endpoint returns data
- [ ] Statistics show counts for all platforms
- [ ] Manual refresh works
- [ ] Filters work (category, difficulty, platform)
- [ ] Search works
- [ ] Frontend loads successfully
- [ ] Frontend displays competitions
- [ ] No errors in backend logs (except expected scraping issues)
- [ ] No errors in browser console
- [ ] Dashboard shows statistics
- [ ] Calendar displays events

---

## 📞 Support

If you encounter issues:

1. **Check backend logs** in the "CompeteHub Backend" window
2. **Check browser console** (F12) for frontend errors
3. **Verify prerequisites**: Python 3.8+, Node.js 18+
4. **Review PROJECT_ANALYSIS.md** for detailed information
5. **Test APIs individually** using the methods above

---

## 🎓 Summary

**Live APIs (Highly Reliable):**
- ✅ Codeforces API
- ✅ Kaggle API

**Web Scrapers (May Need Maintenance):**
- ⚠️ HackerRank Scraper
- ⚠️ Hackalist Scraper

**Overall:**
The system is designed to be resilient. Even if some fetchers fail, the application continues to work with data from successful sources.

---

**Generated:** November 9, 2024  
**Last Updated:** November 9, 2024
