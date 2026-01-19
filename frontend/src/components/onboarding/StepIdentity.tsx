import { motion } from 'framer-motion';
import { cn } from '../../utils';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];
const degrees = ['B.Tech / B.E.', 'B.Sc', 'M.Tech / M.S.', 'PhD', 'Other'];

interface StepIdentityProps {
  data: { year: string; degree: string };
  onChange: (updates: Partial<{ year: string; degree: string }>) => void;
  slideVariants: {
    enter: (direction: number) => { x: number; opacity: number };
    center: { x: number; opacity: number };
    exit: (direction: number) => { x: number; opacity: number };
  };
}

export default function StepIdentity({ data, onChange, slideVariants }: StepIdentityProps) {
  return (
    <motion.div
      key="step1"
      custom={1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      <div role="group" aria-labelledby="year-label">
        <label id="year-label" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Academic Year
        </label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select academic year">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onChange({ year })}
              role="radio"
              aria-checked={data.year === year}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit focus-visible:ring-offset-2 focus-visible:ring-offset-neon-black',
                data.year === year
                  ? 'border-neon-limit bg-neon-limit/10 text-neon-limit'
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-labelledby="degree-label">
        <label id="degree-label" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Degree Program
        </label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select degree program">
          {degrees.map((degree) => (
            <button
              key={degree}
              onClick={() => onChange({ degree })}
              role="radio"
              aria-checked={data.degree === degree}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit focus-visible:ring-offset-2 focus-visible:ring-offset-neon-black',
                data.degree === degree
                  ? 'border-neon-limit bg-neon-limit/10 text-neon-limit'
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
              )}
            >
              {degree}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
