import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookmarkSlashIcon } from '@heroicons/react/24/outline';
import { fetchCompetitions } from '../api/competitions';
import { useCompetitionStore } from '../store/useCompetitionStore';
import CompetitionCard from '../components/CompetitionCard';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function SavedPage() {
  const { data: competitions } = useQuery(['competitions'], () => fetchCompetitions());
  const { savedCompetitions } = useCompetitionStore();

  const saved = competitions?.filter((comp) => savedCompetitions.includes(comp.id)) || [];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tight">
              Saved <span className="text-brand-lime">Challenges</span>
            </h1>
            <div className="px-4 py-1 rounded-full bg-white/10 border border-white/10 text-white font-bold text-lg">
              {saved.length}
            </div>
          </div>
          <p className="text-gray-400 text-lg">
            Your personal collection of hackathons and competitions.
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
            className="text-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/5"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 mb-6">
              <BookmarkSlashIcon className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 font-display uppercase tracking-wide">
              No saved items
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
              You haven't bookmarked any competitions yet. Browse the explore page to find upcoming events.
            </p>
            <Link to="/explore">
              <Button className="bg-brand-lime text-black hover:bg-brand-lime/90 font-bold px-8 py-3">
                Explore Competitions
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
