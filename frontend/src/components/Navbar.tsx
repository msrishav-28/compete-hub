import { Link, useLocation } from 'react-router-dom';
import { MoonIcon, SunIcon, TrophyIcon, ChartBarIcon, CalendarIcon, UserIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useThemeStore } from '../store/useThemeStore';
import { motion } from 'framer-motion';
import { cn } from '../utils';

export default function Navbar() {
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();

  const navItems = [
    { path: '/explore', label: 'Explore', icon: TrophyIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/saved', label: 'Saved', icon: BookmarkIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop & Tablet Floating Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-4 md:px-0 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-5xl bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl px-6 py-3 flex justify-between items-center transition-all duration-300">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-brand-lime p-1.5 rounded-lg text-black group-hover:rotate-12 transition-transform duration-300">
              <TrophyIcon className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight uppercase font-display hidden sm:block">
              CompeteHub.
            </span>
          </Link>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 rounded-full transition-all duration-300 group flex items-center gap-2 text-sm font-medium",
                    active
                      ? "text-brand-black bg-brand-lime"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme & Extras */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </nav>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  active ? "text-brand-lime" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <motion.div
                  initial={false}
                  animate={active ? { y: -2 } : { y: 0 }}
                >
                  <Icon className={cn("h-6 w-6", active && "stroke-2")} />
                </motion.div>
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
