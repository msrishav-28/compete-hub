import { useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import { useCompetitionStore } from './store/useCompetitionStore';
import { fetchUserProfile } from './api/competitions';
import './App.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage')); // Heavy - includes recharts
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CompetitionDetailPage = lazy(() => import('./pages/CompetitionDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});


function App() {
  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Sync saved competitions from backend
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const profile = await fetchUserProfile();
        if (profile.saved_competitions) {
          useCompetitionStore.getState().syncSavedCompetitions(profile.saved_competitions);
        }
      } catch (error) {
        console.error('Failed to sync profile:', error);
      }
    };
    syncProfile();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen transition-colors duration-200 text-neon-white selection:bg-neon-limit selection:text-black font-sans">
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
              </Suspense>
            </ErrorBoundary>
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: '!bg-neon-grey !text-white !border !border-white/10 !backdrop-blur-xl',
              duration: 3000,
              style: {
                borderRadius: '8px',
                background: '#1A1A1A',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              }
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
