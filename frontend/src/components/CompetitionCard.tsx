import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, UserGroupIcon, TrophyIcon, BookmarkIcon, ArrowTopRightOnSquareIcon, AcademicCapIcon, SignalIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { getTimeRemaining, getDaysUntil, cn } from '../utils';
import { useCompetitionStore } from '../store/useCompetitionStore';
import Card, { CardContent, CardFooter } from './ui/Card';
import RecruitSquadButton from './RecruitSquadButton';

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
  verified?: boolean;
  onClick?: () => void;
}

const timeCommitmentConfig = {
  low: { color: 'text-green-500', label: 'Low' },
  medium: { color: 'text-blue-500', label: 'Medium' },
  high: { color: 'text-red-500', label: 'High' },
};

// Status strip logic based on visual-revamp.md
const getStatusStrip = (startDate: string, recruitmentPotential?: boolean) => {
  const daysUntil = getDaysUntil(startDate);
  
  if (recruitmentPotential) {
    return {
      color: 'bg-signal-gold',
      glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      animate: false,
      label: 'Hiring',
    };
  }
  
  if (daysUntil < 1) {
    return {
      color: 'bg-signal-red',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]',
      animate: true, // Critical pulse
      label: 'Critical',
    };
  }
  
  if (daysUntil < 3) {
    return {
      color: 'bg-signal-amber',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      animate: false,
      label: 'Urgent',
    };
  }
  
  return {
    color: 'bg-neon-limit',
    glow: '',
    animate: false,
    label: 'Open',
  };
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
  verified = false,
  onClick,
}: CompetitionCardProps) {
  const { isSaved, saveCompetition, unsaveCompetition } = useCompetitionStore();
  const saved = isSaved(id);
  const timeRemaining = getTimeRemaining(startDate);
  const difficulty = (difficultyProp as DifficultyLevel) || 'intermediate';
  const statusStrip = getStatusStrip(startDate, recruitmentPotential);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      unsaveCompetition(id);
    } else {
      saveCompetition(id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      glass
      hover
      onClick={handleCardClick}
      className="group overflow-hidden border-white/5 bg-white/5 hover:border-neon-limit/50 transition-all duration-500 relative rounded-xl rounded-tr-none"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
      }}
    >
      {/* Chamfered Corner Visual - Top Right Cut */}
      <div className="absolute top-0 right-0 w-5 h-5 bg-neon-black z-10" 
        style={{ 
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
        }} 
      />
      <div className="absolute top-0 right-0 w-5 h-5 border-b border-l border-white/10 z-20"
        style={{
          transform: 'rotate(-45deg) translate(7px, -7px)',
        }}
      />

      {/* Recruitment Badge */}
      {recruitmentPotential && (
        <div className="absolute top-0 left-4 bg-signal-gold px-3 py-1 rounded-b-lg z-20 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
          <div className="flex items-center gap-1 text-black text-xs font-bold uppercase tracking-wider">
            <AcademicCapIcon className="h-3 w-3" />
            Hiring
          </div>
        </div>
      )}

      {/* Verified Badge */}
      {verified && (
        <div className="absolute top-3 left-4 z-20">
          <div className="flex items-center gap-1 text-neon-limit text-xs font-bold">
            <CheckBadgeIcon className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardContent className="pt-8 px-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <Link to={`/competitions/${id}`} onClick={(e) => onClick && e.preventDefault()}>
              <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-neon-limit transition-colors line-clamp-2 font-display tracking-tight leading-tight">
                {title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-semibold text-gray-300 bg-white/5 px-2 py-0.5 rounded">{platform}</span>
              <span className="text-gray-600">/</span>
              <span className="capitalize">{category.replace('_', ' ')}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            {saved ? (
              <BookmarkSolidIcon className="h-5 w-5 text-neon-limit drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
            ) : (
              <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-neon-limit transition-colors" />
            )}
          </motion.button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
            <CalendarIcon className="h-3.5 w-3.5 text-neon-limit flex-shrink-0" />
            <span className="truncate">{timeRemaining}</span>
          </div>
          {teamSize && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
              <UserGroupIcon className="h-3.5 w-3.5 text-neon-limit flex-shrink-0" />
              <span className="truncate capitalize">{teamSize}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
            <ClockIcon className="h-3.5 w-3.5 text-neon-limit flex-shrink-0" />
            <span>{timeCommitmentConfig[timeCommitment].label}</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-xs font-medium text-gray-300 capitalize">
            <SignalIcon className="h-3.5 w-3.5 text-neon-limit flex-shrink-0" />
            <span>{difficulty}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-0.5 text-xs font-mono text-neon-limit/70 border border-neon-limit/20 bg-neon-limit/5">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">+{tags.length - 3}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-white/5 border-t border-white/5 px-6 py-3 justify-between group-hover:bg-neon-limit/5 transition-colors duration-500 relative z-10">
        {/* Prize */}
        {prize ? (
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-neon-limit" />
            <span className="font-bold text-white text-sm">
              {prize.value} <span className="text-gray-500 text-xs font-normal">{prize.currency}</span>
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-600">No prize listed</div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <RecruitSquadButton
            competitionId={id}
            competitionTitle={title}
            prize={prize}
            size="sm"
          />
          <Link to={`/competitions/${id}`} onClick={(e) => onClick && e.preventDefault()}>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-white transition-colors px-2 py-1">
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </CardFooter>

      {/* Status Strip - Dynamic Color Based on Deadline/Hiring */}
      <motion.div 
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1',
          statusStrip.color,
          statusStrip.glow,
        )}
        animate={statusStrip.animate ? {
          opacity: [1, 0.5, 1],
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0)',
            '0 0 20px 5px rgba(239, 68, 68, 0.6)',
            '0 0 0 0 rgba(239, 68, 68, 0)',
          ]
        } : {}}
        transition={statusStrip.animate ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      />
    </Card>
  );
}
