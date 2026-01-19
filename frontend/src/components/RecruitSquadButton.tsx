import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils';

interface RecruitSquadButtonProps {
  competitionId: string;
  competitionTitle: string;
  prize?: { value: string; currency: string };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RecruitSquadButton({
  competitionId,
  competitionTitle,
  prize,
  className,
  size = 'md',
}: RecruitSquadButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRecruit = () => {
    setIsAnimating(true);
    
    // Construct the share message
    const prizeText = prize ? ` - ${prize.value} ${prize.currency} Prize Pool` : '';
    const message = encodeURIComponent(
      `Found a high-value opportunity: "${competitionTitle}"${prizeText}. Looking for teammates to compete. Check it out: ${window.location.origin}/competitions/${competitionId}`
    );
    
    // Open WhatsApp share
    setTimeout(() => {
      window.open(`https://wa.me/?text=${message}`, '_blank');
      setIsAnimating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 600);
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <motion.button
      onClick={handleRecruit}
      disabled={isAnimating}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center font-bold rounded-lg overflow-hidden transition-colors',
        'bg-white/5 border border-white/10 text-white hover:border-white/30 hover:bg-white/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        className
      )}
    >
      {/* Radar Pulse Animation */}
      <AnimatePresence>
        {isAnimating && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full border-2 border-neon-limit pointer-events-none"
                style={{ transformOrigin: 'center' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.span
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-neon-limit"
            >
              <CheckIcon className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ scale: 1 }}
              animate={isAnimating ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <UsersIcon className={cn('w-4 h-4', isAnimating && 'text-neon-limit')} />
            </motion.span>
          )}
        </AnimatePresence>
        
        <span className={cn(isAnimating && 'text-neon-limit', showSuccess && 'text-neon-limit')}>
          {showSuccess ? 'Shared' : 'Recruit Squad'}
        </span>
      </span>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        whileHover={{
          boxShadow: '0 0 20px rgba(163, 230, 53, 0.2), inset 0 0 20px rgba(163, 230, 53, 0.05)',
        }}
      />
    </motion.button>
  );
}
