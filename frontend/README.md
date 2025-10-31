# CompeteHub Frontend

An ultra-modern, feature-rich frontend for CompeteHub - your one-stop platform for discovering and tracking coding competitions, hackathons, and challenges.

## 🎨 Features

### Core Features
- **🏠 Discover Page**: Browse all competitions with advanced filtering and search
- **📊 Dashboard**: Analytics and insights about your competition journey
- **📅 Calendar View**: Visualize competitions by date
- **🔖 Saved Competitions**: Track competitions you're interested in
- **👤 Profile**: Manage your preferences and view your stats

### Modern UI/UX
- **🌓 Dark Mode**: Seamless dark/light theme switching with persistent preferences
- **✨ Animations**: Smooth Framer Motion animations and micro-interactions
- **📱 Responsive**: Fully responsive design for all screen sizes
- **🎯 Advanced Filters**: Filter by category, difficulty, time commitment
- **🔍 Smart Search**: Real-time search across titles, platforms, and tags
- **📈 Data Visualization**: Beautiful charts with Recharts
- **💾 Persistent State**: Zustand state management with localStorage persistence

### UI Components
- Modern card-based layouts with hover effects
- Glass-morphism design elements
- Gradient accents and smooth transitions
- Lucide icons for consistent iconography
- Custom-designed button, badge, input components

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎯 Project Structure

```
frontend/
├── src/
│   ├── api/                # API client and endpoints
│   │   └── competitions.ts
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Input.tsx
│   │   ├── CompetitionCard.tsx
│   │   └── Navbar.tsx
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── SavedPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── CompetitionDetailPage.tsx
│   ├── store/             # Zustand stores
│   │   ├── useThemeStore.ts
│   │   └── useCompetitionStore.ts
│   ├── utils.ts           # Utility functions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎨 Key Features Breakdown

### Home Page
- Hero section with animated gradients
- Real-time search across all competitions
- Advanced filtering panel (category, difficulty, time commitment)
- Grid/List view toggle
- Staggered entrance animations for competition cards

### Dashboard
- Overview statistics (total, saved, upcoming)
- Category distribution pie chart
- Difficulty level bar chart
- Upcoming this week widget
- Saved competitions quick access

### Calendar
- Interactive monthly calendar view
- Visual indicators for days with competitions
- Side panel showing competitions for selected date
- Month navigation controls

### Competition Cards
- Modern card design with hover effects
- Save/bookmark functionality
- Visual badges for difficulty, tags, and categories
- Time remaining indicator
- Prize information display
- Recruitment potential badge

### Dark Mode
- Automatic class-based theme switching
- Persistent theme preference in localStorage
- Smooth color transitions
- Optimized for accessibility

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:8000/api
```

### API Proxy
The Vite dev server is configured to proxy API requests:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API calls to `/api/*` are automatically proxied

## 🎯 Usage Guide

### Browsing Competitions
1. Visit the home page to see all competitions
2. Use the search bar to find specific competitions
3. Click "Filters" to narrow down by category, difficulty, or time
4. Toggle between grid and list views
5. Click any competition card to view details

### Saving Competitions
- Click the bookmark icon on any competition card
- Access saved competitions from the "Saved" page
- View saved count in your profile

### Dashboard Insights
- Navigate to Dashboard to see analytics
- View category and difficulty distributions
- Check upcoming competitions for the week
- Quick access to saved competitions

### Calendar View
- Switch to Calendar view to see competitions by date
- Click any date to see competitions starting that day
- Navigate between months using arrow buttons
- Click "Today" to jump to current month

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize colors:
```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Animations
Modify Framer Motion settings in components for custom animations.

## 🐛 Troubleshooting

### Dependencies Not Installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
Ensure TypeScript and all dev dependencies are installed:
```bash
npm install --save-dev typescript @types/react @types/react-dom
```

### API Connection Issues
1. Verify backend is running on port 8000
2. Check CORS settings in backend
3. Verify proxy configuration in `vite.config.ts`

## 📝 Notes

- **Lint Errors**: TypeScript errors about missing modules will resolve after running `npm install`
- **Dark Mode**: Uses `class` strategy with Tailwind CSS
- **State Persistence**: Theme and saved competitions persist across sessions
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Netlify/Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables if needed

## 📄 License

This project is part of CompeteHub - see main repository for license details.
