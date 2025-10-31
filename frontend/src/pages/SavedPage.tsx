import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookmarkSlashIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { fetchCompetitions } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import CompetitionCard from '../components/CompetitionCard';

export default function SavedPage() {
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { savedCompetitions } = useCompetitionStore();

  const saved = competitions?.filter((comp) => savedCompetitions.includes(comp.id)) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookmarkSolidIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Saved Competitions</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            You have saved {saved.length} competition{saved.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {saved.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {saved.map((comp, index) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <CompetitionCard {...comp} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <BookmarkSlashIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No saved competitions yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start exploring and save competitions you're interested in
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
