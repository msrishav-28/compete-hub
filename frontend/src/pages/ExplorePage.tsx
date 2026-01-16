import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import CompetitionCard from '../components/CompetitionCard';
import { fetchCompetitions } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CompetitionCardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../utils';

export default function ExplorePage() {
  const { data: competitions, isLoading, error } = useQuery(['competitions'], () => fetchCompetitions());
  const { filters, setFilters, resetFilters, viewMode, setViewMode } = useCompetitionStore();
  const [showFilters, setShowFilters] = useState(false);

  // Filter competitions (Memoized)
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

  // Unique Filter Values
  const categories = useMemo(() => Array.from(new Set(competitions?.map(c => c.category) || [])), [competitions]);
  const difficulties = useMemo(() => Array.from(new Set(competitions?.map(c => c.difficulty) || [])), [competitions]);
  const timeCommitments = useMemo(() => Array.from(new Set(competitions?.map(c => c.timeCommitment) || [])), [competitions]);

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    const current = filters[type] as string[];
    const newValue = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setFilters({ [type]: newValue });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CompetitionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-red-500">
        <p className="text-lg font-bold mb-2">System Error</p>
        <p className="text-sm opacity-80">Failed to load competition protocols.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-brand-lime/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase font-display">
            Explore <span className="text-brand-lime">Challenges</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-light leading-relaxed">
            Access a curated database of {competitions?.length || 0}+ hackathons and engineering competitions. Filter by difficulty, platform, and rewards.
          </p>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-8 border-t border-white/10 pt-8 max-w-xl">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">{filteredCompetitions.length}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Active</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">{categories.length}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Categories</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand-lime">Live</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Status</div>
            </div>
          </div>
        </motion.div>

        {/* Search & Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-24 z-30 bg-black/80 backdrop-blur-xl p-4 -mx-4 md:mx-0 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by keywords..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="pl-12 bg-white/5 border-transparent focus:bg-white/10 h-12"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filters
            </Button>
            <div className="bg-white/5 rounded-xl p-1 flex border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  viewMode === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel (Collapsible) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-8 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Categories */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={filters.category.includes(cat) ? 'success' : 'default'}
                          className="cursor-pointer hover:border-brand-lime/30 transition-colors py-2 px-3"
                          onClick={() => toggleFilter('category', cat)}
                        >
                          {cat.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Difficulty */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Difficulty</h3>
                    <div className="flex flex-wrap gap-2">
                      {difficulties.map((diff) => (
                        <Badge
                          key={diff}
                          variant={filters.difficulty.includes(diff) ? 'warning' : 'default'}
                          className="cursor-pointer hover:border-brand-lime/30 transition-colors py-2 px-3"
                          onClick={() => toggleFilter('difficulty', diff)}
                        >
                          {diff}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Time */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Time Commitment</h3>
                    <div className="flex flex-wrap gap-2">
                      {timeCommitments.map((time) => (
                        <Badge
                          key={time}
                          variant={filters.timeCommitment.includes(time) ? 'info' : 'default'}
                          className="cursor-pointer hover:border-brand-lime/30 transition-colors py-2 px-3"
                          onClick={() => toggleFilter('timeCommitment', time)}
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <div
                    onClick={resetFilters}
                    className="text-sm text-gray-400 hover:text-white cursor-pointer underline underline-offset-4 decoration-gray-700 hover:decoration-white transition-all"
                  >
                    Reset all filters
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
            className="text-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/5">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-6">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              No results found
            </h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8">
              We couldn't find any competitions matching your current filters.
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
