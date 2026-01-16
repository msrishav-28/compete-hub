import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ExplorePage from './pages/ExplorePage'; // Renamed from HomePage
import CompetitionDetailPage from './pages/CompetitionDetailPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import SavedPage from './pages/SavedPage';
import ProfilePage from './pages/ProfilePage';
import { useThemeStore } from './store/useThemeStore';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Sync saved competitions from backend
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const { fetchUserProfile } = await import('./api/competitions');
        const { useCompetitionStore } = await import('./store/useCompetitionStore');
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
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 3000,
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
