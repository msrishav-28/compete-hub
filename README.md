# CompeteHub

A comprehensive platform for engineering students to discover, track, and strategically navigate 100+ types of competitions including hackathons, coding contests, bug bounties, and research competitions. Features intelligent portfolio tracking, outcome analytics, and personalized career-path recommendations.

## Features

### Core Capabilities
- **Competition Discovery** - Browse competitions from multiple platforms (Codeforces, Kaggle, HackerRank, Hackalist)
- **Advanced Filtering** - Filter by category, difficulty, time commitment, platform, and search
- **Analytics Dashboard** - Track your competition history and performance
- **Modern UI** - Beautiful React frontend with dark mode, animations, and responsive design
- **Save & Track** - Bookmark competitions and track your participation
- **Calendar View** - Visualize competitions by date
- **User Profiles** - Create and manage your competition profile
- **Smart Recommendations** - Get personalized competition suggestions based on your profile
- **Portfolio Tracking** - Build and showcase your competition portfolio
- **Career Insights** - See which competitions lead to job opportunities

### Technical Stack
- **FastAPI Backend** - High-performance REST API
- **React Frontend** - Modern SPA with TypeScript
- **Tailwind CSS** - Beautiful, customizable styling
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Efficient state management
- **Recharts** - Interactive data visualizations
- **React Query** - Smart data fetching and caching
- **Dark Mode** - Full theme support

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Data Models**: Pydantic
- **HTTP Client**: Requests, HTTPX
- **Web Scraping**: BeautifulSoup4
- **Data Processing**: Pandas

### Data Sources
- Codeforces API
- Kaggle API
- HackerRank (Web Scraping)
- Hackalist API
- More coming soon...

## Quick Start

### Prerequisites
- **Python 3.8+** and pip
- **Node.js 18+** and npm
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/competehub.git
   cd competehub
   ```

2. **Set up Backend**:
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up Frontend**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Run Both Services Simultaneously

**Terminal 1 - Backend**:
```bash
cd backend
python main.py
```
Backend will run on `http://localhost:8000`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

#### Option 2: Quick Start Script (Windows)

Create `start.bat`:
```bat
@echo off
start cmd /k "cd backend && python main.py"
start cmd /k "cd frontend && npm run dev"
```

Then run: `start.bat`

### Access the Application

1. **Frontend**: Open `http://localhost:3000` in your browser
2. **Backend API**: `http://localhost:8000`
3. **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)

## Project Structure

```
competehub/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── api/                # API client and types
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Base UI components
│   │   │   ├── CompetitionCard.tsx
│   │   │   └── Navbar.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── SavedPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── store/             # Zustand stores
│   │   ├── utils.ts           # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
│
├── backend/                    # FastAPI backend
│   ├── main.py                # API server
│   └── requirements.txt       # Backend dependencies
│
├── fetchers/                   # Competition data fetchers
│   ├── base_fetcher.py        # Base fetcher class
│   ├── coding_contests/       # Codeforces, etc.
│   ├── data_science/          # Kaggle, etc.
│   ├── corporate/             # HackerRank, etc.
│   ├── hackathons/            # Hackalist, etc.
│   ├── security/              # CTF, Bug Bounties
│   ├── open_source/           # GSoC, etc.
│   └── ... (more categories)
│
├── models/                     # Data models
│   ├── competition.py         # Competition model
│   └── user_profile.py        # User profile model
│
├── utils/                      # Utility functions
│   ├── cache.py               # Caching system
│   └── filters.py             # Filtering utilities
│
├── data/                       # Cached data
│   ├── competitions.json      # Cached competitions
│   ├── cache_metadata.json    # Cache metadata
│   └── users/                 # User profiles
│
└── README.md                   # This file
```

## API Documentation

### Competition Endpoints
- `GET /api/competitions` - Get all competitions (with filters)
- `GET /api/competitions/{id}` - Get single competition
- `GET /api/competitions/upcoming/week` - Get competitions starting this week
- `GET /api/stats/overview` - Get statistics overview

### User Profile Endpoints
- `GET /api/users/profile` - Get user profile
- `POST /api/users/profile` - Create/update user profile
- `POST /api/users/competition/enter` - Mark competition as entered
- `POST /api/users/competition/win` - Record a win

### Recommendation & Analytics
- `GET /api/recommendations` - Get personalized recommendations
- `GET /api/analytics/user` - Get user analytics

### Utility Endpoints
- `POST /api/refresh` - Refresh competition data
- `GET /health` - Health check
- `GET /` - API information

Full interactive documentation available at: `http://localhost:8000/docs`

## Usage Guide

1. **Browse Competitions**: Visit the home page to see all available competitions
2. **Filter & Search**: Use the search bar and filters to find relevant competitions
3. **Save Competitions**: Click the bookmark icon to save competitions
4. **View Calendar**: Switch to calendar view to see competitions by date
5. **Check Dashboard**: View analytics and statistics on your dashboard
6. **Get Recommendations**: Complete your profile to receive personalized recommendations
7. **Track Progress**: Record your participation and wins to track your portfolio

## Configuration

### Backend Configuration
- API runs on port 8000 by default
- Cache TTL: 24 hours (configurable in `backend/main.py`)
- User data stored in `data/users/`

### Frontend Configuration
- Frontend runs on port 3000
- API URL configured in `frontend/src/api/competitions.ts`
- Theme preference persists in localStorage

## Deployment

**The project is deployment-ready!** See complete guides:

- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Quick deployment overview
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step instructions  
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Verification checklist

### Recommended Stack
- **Frontend**: Vercel (FREE)
- **Backend**: Railway ($5-10/month) or Render (FREE with limitations)

### Quick Deploy
1. Deploy backend to Railway/Render
2. Deploy frontend to Vercel
3. Configure environment variables
4. Update CORS settings

**Total setup time: ~30 minutes**

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- Competition platforms: Codeforces, Kaggle, HackerRank, Hackalist

## Support

For issues and questions:
- Open an issue on GitHub
- Refer to API documentation at http://localhost:8000/docs

---

Made for engineering students worldwide
