import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, UserGroupIcon, TrophyIcon, BookmarkIcon, ArrowTopRightOnSquareIcon, AcademicCapIcon, SignalIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { getTimeRemaining } from '../utils';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Card, { CardContent, CardFooter } from './ui/Card';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';

interface CompetitionCardProps {
  id: string;
  title: string;
  platform: string;
  category: string;
  startDate: string;
  difficulty: string;
  timeCommitment: 'low' | 'medium' | 'high';
  prize?: {
    value: string;
    currency: string;
  };
  description: string;
  tags: string[];
  teamSize?: string;
  recruitmentPotential?: boolean;
}

const timeCommitmentConfig = {
  low: { color: 'text-green-500', label: 'Low' },
  medium: { color: 'text-blue-500', label: 'Medium' },
  high: { color: 'text-red-500', label: 'High' },
};

export default function CompetitionCard({
  id,
  title,
  platform,
  category,
  startDate,
  difficulty: difficultyProp,
  timeCommitment,
  prize,
  description,
  tags = [],
  teamSize,
  recruitmentPotential,
}: CompetitionCardProps) {
  const { isSaved, saveCompetition, unsaveCompetition } = useCompetitionStore();
  const saved = isSaved(id);
  const timeRemaining = getTimeRemaining(startDate);
  const difficulty = (difficultyProp as DifficultyLevel) || 'intermediate';

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (saved) {
      unsaveCompetition(id);
    } else {
      saveCompetition(id);
    }
  };

  return (
    <Card
      glass
      hover
      className="group overflow-hidden border-white/5 bg-black/40 hover:border-brand-lime/50 transition-colors duration-500"
    >
      {/* Gradient overlay for recruitment potential */}
      {recruitmentPotential && (
        <div className="absolute top-0 right-0 bg-brand-lime px-3 py-1 rounded-bl-xl z-20">
          <div className="flex items-center gap-1 text-black text-xs font-bold uppercase tracking-wider">
            <AcademicCapIcon className="h-3 w-3" />
            Hiring
          </div>
        </div>
      )}

      <CardContent className="pt-8 px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <Link to={`/competitions/${id}`}>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-lime transition-colors line-clamp-1 font-display tracking-tight">
                {title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-semibold text-gray-300">{platform}</span>
              <span className="text-gray-600">•</span>
              <span className="capitalize text-gray-400">{category.replace('_', ' ')}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="ml-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? (
              <BookmarkSolidIcon className="h-5 w-5 text-brand-lime" />
            ) : (
              <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-brand-lime" />
            )}
          </motion.button>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
            <CalendarIcon className="h-3.5 w-3.5 text-brand-lime" />
            <span>{timeRemaining}</span>
          </div>
          {teamSize && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
              <UserGroupIcon className="h-3.5 w-3.5 text-brand-lime" />
              <span className="capitalize">{teamSize}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
            <ClockIcon className="h-3.5 w-3.5 text-brand-lime" />
            <span>{timeCommitmentConfig[timeCommitment].label}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-300 capitalize">
            <SignalIcon className="h-3.5 w-3.5 text-brand-lime" />
            <span>{difficulty}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2.5 py-1 text-xs font-medium text-gray-400 border border-white/5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="bg-white/5 border-t border-white/5 px-8 py-4 justify-between group-hover:bg-brand-lime/5 transition-colors duration-500">
        {/* Prize */}
        {prize ? (
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-brand-lime" />
            <span className="font-bold text-white text-sm">
              {prize.value} <span className="text-gray-500 text-xs font-normal">{prize.currency}</span>
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/competitions/${id}`}>
            <div className="flex items-center gap-1 text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
              View Details
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
