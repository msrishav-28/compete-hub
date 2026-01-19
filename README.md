# CompeteHub

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-4.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A platform for engineering students to discover, track, and manage competitions including hackathons, coding contests, data science challenges, and corporate hiring events. Features personalized recommendations, portfolio tracking, and analytics.

---

## Features

- **Competition Discovery** - Aggregates competitions from Codeforces, Kaggle, HackerRank, and Hackalist
- **Advanced Filtering** - Filter by category, difficulty, time commitment, platform
- **Full-Text Search** - Search across titles and descriptions
- **User Profiles** - Track skills, preferences, and linked accounts
- **Saved Competitions** - Bookmark and manage competitions of interest
- **Analytics Dashboard** - Visualize participation history and statistics
- **Calendar View** - See competitions by date
- **Recommendations** - Personalized suggestions based on profile and history
- **Dark Mode** - Native dark theme

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier available)

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/competehub.git
cd competehub
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Environment Configuration

**Backend** - Copy and configure `backend/.env.example` to `backend/.env`:
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
```

**Frontend** - Copy and configure `frontend/.env.example` to `frontend/.env`:
```bash
cd frontend
cp .env.example .env
```

---

## Running Locally

### Quick Start (Windows)

```bash
start.bat
```

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## Project Structure

```
competehub/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── database.py             # MongoDB connection (Motor)
│   ├── requirements.txt
│   ├── render.yaml             # Render deployment config
│   ├── Procfile                # Heroku/Render start command
│   ├── core/
│   │   └── config.py           # Pydantic settings
│   ├── repositories/           # Data access layer
│   ├── schemas/                # Request/response models
│   └── services/               # Business logic
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API client
│   │   ├── components/         # React components
│   │   ├── pages/              # Route pages
│   │   └── store/              # Zustand state
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── fetchers/                   # Competition data fetchers
│   ├── base_fetcher.py
│   ├── coding_contests/        # Codeforces
│   ├── data_science/           # Kaggle
│   ├── corporate/              # HackerRank
│   └── hackathons/             # Hackalist
│
├── models/
│   ├── competition.py          # Competition dataclass
│   └── user_profile.py         # User profile model
│
├── docker-compose.yml          # Local development with Redis
└── Dockerfile                  # Production build
```

---

## API Endpoints

### Competitions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/competitions` | List with filters (category, difficulty, platform, search) |
| GET | `/api/competitions/{id}` | Get by ID |
| GET | `/api/competitions/upcoming/week` | Next 7 days |
| GET | `/api/stats/overview` | Statistics by category, difficulty, platform |
| POST | `/api/refresh` | Force refresh from all sources |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get profile |
| POST | `/api/users/profile` | Update profile |
| POST | `/api/users/competition/save` | Save/unsave competition |
| POST | `/api/users/competition/enter` | Mark as entered |
| POST | `/api/users/competition/win` | Record win |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Personalized recommendations |
| GET | `/api/analytics/user` | User statistics |

---

## Data Sources

| Source | Type | Endpoint |
|--------|------|----------|
| Codeforces | REST API | codeforces.com/api |
| Kaggle | REST API | kaggle.com/api/v1 |
| HackerRank | Web Scraping | hackerrank.com/contests |
| Hackalist | Web Scraping | hackalist.org |

---

## Adding a New Fetcher

1. Create fetcher in appropriate category folder:

```python
# fetchers/new_category/new_source.py
from ..base_fetcher import BaseFetcher
from models.competition import Competition, CompetitionCategory

class NewSourceFetcher(BaseFetcher):
    def __init__(self):
        super().__init__("NewSource")
        self.base_url = "https://api.newsource.com"
    
    def fetch(self):
        # Return raw data from API/scraping
        pass
    
    def parse(self, data):
        # Return list of Competition objects
        pass
```

2. Register in `backend/main.py`:

```python
FETCHERS = {
    # existing fetchers...
    "newsource": NewSourceFetcher(),
}
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

**Stack:** Vercel (frontend) + Render (backend) + MongoDB Atlas

---

## Docker Development

```bash
docker-compose up
```

Starts backend, frontend, and Redis for local development.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push branch (`git push origin feature/new-feature`)
5. Open Pull Request

---

## License

MIT License. See [LICENSE](LICENSE) for details.
