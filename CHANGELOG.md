# Changelog

All notable changes to CompeteHub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] - 2024-11-09

### Added

- FastAPI backend with async MongoDB (Motor driver)
- React 18 frontend with TypeScript
- Pydantic settings for configuration management
- Clean architecture with repositories and services layers
- User profile system with skill tracking
- Competition save/bookmark functionality
- Entry and win recording
- Personalized recommendation engine
- Analytics dashboard with Recharts
- Calendar view for upcoming competitions
- Full-text search on competitions
- Zustand state management with persistence
- TanStack Query for data fetching
- Framer Motion animations
- Heroicons icon set
- Dark mode (default)
- Docker Compose for local development
- Render deployment configuration
- Vercel deployment configuration

### Technical Stack

- Backend: FastAPI, Motor (async MongoDB), Pydantic, Uvicorn/Gunicorn
- Frontend: React, TypeScript, Vite, Tailwind CSS, Axios
- Database: MongoDB Atlas
- State: Zustand with localStorage persistence
- Data fetching: TanStack Query with caching

---

## [1.0.0] - 2024-10-01

### Added

- Initial release with Streamlit interface
- Four competition sources:
  - Codeforces API
  - Kaggle API
  - HackerRank web scraper
  - Hackalist web scraper
- Basic category filtering
- JSON file caching
