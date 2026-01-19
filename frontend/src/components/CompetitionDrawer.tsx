import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import MobileDrawer from './ui/MobileDrawer';
import MagneticButton from './ui/MagneticButton';
import Badge from './ui/Badge';
import { useCompetitionStore } from '../store/useCompetitionStore';
import { getTimeRemaining, getDaysUntil } from '../utils';
import { Competition } from '../api/competitions';

interface CompetitionDrawerProps {
  competition: Competition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompetitionDrawer({ competition, open, onOpenChange }: CompetitionDrawerProps) {
  const { isSaved, saveCompetition, unsaveCompetition } = useCompetitionStore();

  if (!competition) return null;

  const saved = isSaved(competition.id);
  const daysLeft = getDaysUntil(competition.startDate);
  const isUrgent = daysLeft < 3;
  const isCritical = daysLeft < 1;

  const handleSave = () => {
    if (saved) {
      unsaveCompetition(competition.id);
    } else {
      saveCompetition(competition.id);
    }
  };

  const handleRecruit = () => {
    const message = encodeURIComponent(
      `Found a high-value competition: "${competition.title}"${competition.prize ? ` - ${competition.prize.value} ${competition.prize.currency} Prize Pool` : ''}. Looking for teammates. Check it out: ${window.location.origin}/competitions/${competition.id}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleApply = () => {
    window.open(competition.link, '_blank');
  };

  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={competition.title}
      description={competition.platform}
      footer={
        <div className="flex gap-3">
          <MagneticButton
            onClick={handleApply}
            variant="primary"
            className="flex-1"
          >
            Apply Now
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </MagneticButton>
          <MagneticButton
            onClick={handleRecruit}
            variant="secondary"
            className="flex-1"
          >
            Recruit Squad
            <UsersIcon className="w-4 h-4" />
          </MagneticButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Prize Section */}
        {competition.prize && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-neon-limit/10 border border-neon-limit/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-neon-limit flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Prize Pool</p>
                <p className="text-2xl font-black text-white font-display">
                  {competition.prize.value} <span className="text-gray-400 text-sm">{competition.prize.currency}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <CalendarIcon className="w-4 h-4 text-neon-limit" />
              <span className="text-xs uppercase tracking-wider font-bold">Deadline</span>
            </div>
            <p className={`font-bold ${isCritical ? 'text-signal-red' : isUrgent ? 'text-signal-amber' : 'text-white'}`}>
              {getTimeRemaining(competition.startDate)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <ClockIcon className="w-4 h-4 text-neon-limit" />
              <span className="text-xs uppercase tracking-wider font-bold">Commitment</span>
            </div>
            <p className="font-bold text-white capitalize">{competition.timeCommitment}</p>
          </div>

          {competition.teamSize && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <UserGroupIcon className="w-4 h-4 text-neon-limit" />
                <span className="text-xs uppercase tracking-wider font-bold">Team Size</span>
              </div>
              <p className="font-bold text-white capitalize">{competition.teamSize}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TagIcon className="w-4 h-4 text-neon-limit" />
              <span className="text-xs uppercase tracking-wider font-bold">Difficulty</span>
            </div>
            <p className="font-bold text-white capitalize">{competition.difficulty}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3">About</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{competition.description}</p>
        </div>

        {/* Tags */}
        {competition.tags && competition.tags.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {competition.tags.map((tag, index) => (
                <Badge key={index} variant="default" className="text-xs font-mono">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            {saved ? (
              <BookmarkSolidIcon className="w-4 h-4 text-neon-limit" />
            ) : (
              <BookmarkIcon className="w-4 h-4" />
            )}
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/competitions/${competition.id}`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
            Copy Link
          </button>
        </div>
      </div>
    </MobileDrawer>
  );
}
