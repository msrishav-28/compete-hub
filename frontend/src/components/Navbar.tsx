import { Link, useLocation } from 'react-router-dom';
import { MoonIcon, SunIcon, TrophyIcon, ChartBarIcon, CalendarIcon, UserIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '../store/useThemeStore';
import { motion } from 'framer-motion';
import { cn } from '../utils';

export default function Navbar() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Discover', icon: TrophyIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/saved', label: 'Saved', icon: BookmarkIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg"
              >
                <TrophyIcon className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CompeteHub
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 rounded-lg transition-colors group"
                >
                  <div
                    className={cn(
                      'flex items-center space-x-2',
                      active
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
