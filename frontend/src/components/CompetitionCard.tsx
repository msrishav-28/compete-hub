import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, UserGroupIcon, TrophyIcon, BookmarkIcon, ArrowTopRightOnSquareIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { getTimeRemaining } from '../utils';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Card, { CardContent, CardFooter } from './ui/Card';
import { cn } from '../utils';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'mixed';

interface CompetitionCardProps {
  id: string;
  title: string;
  platform: string;
  category: string;
  startDate: string;
  endDate?: string;
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

const difficultyVariants: Record<DifficultyLevel, 'success' | 'info' | 'warning' | 'danger' | 'purple'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
  expert: 'danger',
  mixed: 'purple',
};

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
    <Card hover className="group overflow-hidden">
      {/* Gradient overlay for recruitment potential */}
      {recruitmentPotential && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-500 px-3 py-1 rounded-bl-lg">
          <div className="flex items-center gap-1 text-white text-xs font-semibold">
            <AcademicCapIcon className="h-3 w-3" />
            Hiring
          </div>
        </div>
      )}

      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Link to={`/competitions/${id}`}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">{platform}</span>
              <span>•</span>
              <span className="capitalize">{category.replace('_', ' ')}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? (
              <BookmarkSolidIcon className="h-4 w-4 text-blue-600" />
            ) : (
              <BookmarkIcon className="h-4 w-4 text-gray-400" />
            )}
          </motion.button>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <span>{timeRemaining}</span>
          </div>
          {teamSize && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <UserGroupIcon className="h-4 w-4 text-green-500" />
              <span className="capitalize">{teamSize}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <ClockIcon className={cn('h-4 w-4', timeCommitmentConfig[timeCommitment].color)} />
            <span>{timeCommitmentConfig[timeCommitment].label}</span>
          </div>
          <Badge variant={difficultyVariants[difficulty]} size="sm">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag, index) => (
            <Badge key={index} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="default" size="sm">
              +{tags.length - 4}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 justify-between">
        {/* Prize */}
        {prize ? (
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {prize.value} {prize.currency}
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/competitions/${id}`}>
            <Button size="sm" variant="primary">
              <span>View Details</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
