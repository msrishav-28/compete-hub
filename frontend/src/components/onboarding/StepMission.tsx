import { motion } from 'framer-motion';
import {
  RocketLaunchIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils';

const goals = [
  { id: 'internship', label: 'Internship', icon: BriefcaseIcon, desc: 'Land a top-tier internship' },
  { id: 'research', label: 'Research', icon: AcademicCapIcon, desc: 'Publish papers & contribute' },
  { id: 'skills', label: 'Pure Skills', icon: RocketLaunchIcon, desc: 'Level up & build portfolio' },
];

interface StepMissionProps {
  data: { goal: string; grindLevel: number };
  onChange: (updates: Partial<{ goal: string; grindLevel: number }>) => void;
  slideVariants: {
    enter: (direction: number) => { x: number; opacity: number };
    center: { x: number; opacity: number };
    exit: (direction: number) => { x: number; opacity: number };
  };
}

export default function StepMission({ data, onChange, slideVariants }: StepMissionProps) {
  return (
    <motion.div
      key="step3"
      custom={1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-8"
    >
      <div role="group" aria-labelledby="objective-label">
        <label id="objective-label" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          Primary Objective
        </label>
        <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Select your primary objective">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = data.goal === goal.id;
            return (
              <motion.button
                key={goal.id}
                onClick={() => onChange({ goal: goal.id })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${goal.label}: ${goal.desc}`}
                className={cn(
                  'p-4 rounded-xl border text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit focus-visible:ring-offset-2 focus-visible:ring-offset-neon-black',
                  isSelected
                    ? 'border-neon-limit bg-neon-limit/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 transition-colors',
                    isSelected ? 'bg-neon-limit text-black' : 'bg-white/10 text-gray-400'
                  )}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h4 className={cn('font-bold text-sm', isSelected ? 'text-neon-limit' : 'text-white')}>
                  {goal.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{goal.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-labelledby="grind-label">
        <div className="flex justify-between items-center mb-4">
          <label id="grind-label" className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
            Weekly Grind Level
          </label>
          <span className="text-neon-limit font-bold" aria-live="polite">{data.grindLevel}h / week</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="2"
            max="20"
            value={data.grindLevel}
            onChange={(e) => onChange({ grindLevel: parseInt(e.target.value) })}
            aria-label="Weekly hours commitment"
            aria-valuemin={2}
            aria-valuemax={20}
            aria-valuenow={data.grindLevel}
            aria-valuetext={`${data.grindLevel} hours per week`}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit focus-visible:ring-offset-2 focus-visible:ring-offset-neon-black [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-limit [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(163,230,53,0.5)]"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-2" aria-hidden="true">
            <span>Casual</span>
            <span>Balanced</span>
            <span>Hardcore</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
