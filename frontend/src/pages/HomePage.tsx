import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, ListBulletIcon, XMarkIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import CompetitionCard from '../components/CompetitionCard';
import { fetchCompetitions } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { cn } from '../utils';

export default function HomePage() {
  const { data: competitions, isLoading, error } = useQuery(['competitions'], () => fetchCompetitions());
  const { filters, setFilters, resetFilters, viewMode, setViewMode } = useCompetitionStore();
  const [showFilters, setShowFilters] = useState(false);

  // Filter competitions
  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    
    return competitions.filter((comp) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          comp.title.toLowerCase().includes(searchLower) ||
          comp.description.toLowerCase().includes(searchLower) ||
          comp.platform.toLowerCase().includes(searchLower) ||
          comp.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category.length > 0 && !filters.category.includes(comp.category)) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(comp.difficulty)) {
        return false;
      }

      // Time commitment filter
      if (filters.timeCommitment.length > 0 && !filters.timeCommitment.includes(comp.timeCommitment)) {
        return false;
      }

      return true;
    });
  }, [competitions, filters]);

  // Get unique values for filters
  const categories = useMemo(() => 
    Array.from(new Set(competitions?.map(c => c.category) || [])),
    [competitions]
  );
  const difficulties = useMemo(() => 
    Array.from(new Set(competitions?.map(c => c.difficulty) || [])),
    [competitions]
  );
  const timeCommitments = useMemo(() => 
    Array.from(new Set(competitions?.map(c => c.timeCommitment) || [])),
    [competitions]
  );

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    const current = filters[type] as string[];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ [type]: newValue });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <XMarkIcon className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading competitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <div className="text-red-500 text-center p-4">
          <p className="text-lg font-semibold mb-2">Error loading competitions</p>
          <p className="text-sm">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discover Your Next Challenge
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore {competitions?.length || 0} competitions, hackathons, and challenges from top platforms worldwide
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                <ArrowTrendingUpIcon className="h-5 w-5" />
                {filteredCompetitions.length}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Competitions</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                {categories.length}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-pink-600 dark:text-pink-400">
                <XMarkIcon className="h-5 w-5" />
                24/7
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Live Updates</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search competitions, platforms, or tags..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Filters
            </Button>
            <div className="flex gap-2 border-l pl-4">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <ListBulletIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Category Filters */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={filters.category.includes(cat) ? 'info' : 'default'}
                          className="cursor-pointer"
                          onClick={() => toggleFilter('category', cat)}
                        >
                          {cat.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filters */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Difficulty</h3>
                    <div className="flex flex-wrap gap-2">
                      {difficulties.map((diff) => (
                        <Badge
                          key={diff}
                          variant={filters.difficulty.includes(diff) ? 'info' : 'default'}
                          className="cursor-pointer"
                          onClick={() => toggleFilter('difficulty', diff)}
                        >
                          {diff}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Time Commitment Filters */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Time Commitment</h3>
                    <div className="flex flex-wrap gap-2">
                      {timeCommitments.map((time) => (
                        <Badge
                          key={time}
                          variant={filters.timeCommitment.includes(time) ? 'info' : 'default'}
                          className="cursor-pointer"
                          onClick={() => toggleFilter('timeCommitment', time)}
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredCompetitions.length}</span> competitions
          </p>
        </div>

        {/* Competitions Grid */}
        <motion.div
          layout
          className={cn(
            'grid gap-6',
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredCompetitions.map((comp, index) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <CompetitionCard {...comp} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredCompetitions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No competitions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your filters or search query
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
