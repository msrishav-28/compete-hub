import { motion } from 'framer-motion';
import {
  CommandLineIcon,
  CpuChipIcon,
  CodeBracketIcon,
  BeakerIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils';

const specializations = [
  { id: 'fullstack', label: 'Full Stack', icon: CodeBracketIcon, desc: 'Web & Mobile Development' },
  { id: 'ai_ml', label: 'AI / ML', icon: CpuChipIcon, desc: 'Machine Learning & Data Science' },
  { id: 'competitive', label: 'Comp. Programming', icon: CommandLineIcon, desc: 'Algorithms & Problem Solving' },
  { id: 'security', label: 'Cybersecurity', icon: ShieldCheckIcon, desc: 'Security & Ethical Hacking' },
  { id: 'research', label: 'Research', icon: BeakerIcon, desc: 'Academic & R&D Focus' },
  { id: 'product', label: 'Product / Design', icon: SparklesIcon, desc: 'UI/UX & Product Management' },
];

interface StepSpecializationProps {
  selected: string;
  onChange: (specialization: string) => void;
  slideVariants: {
    enter: (direction: number) => { x: number; opacity: number };
    center: { x: number; opacity: number };
    exit: (direction: number) => { x: number; opacity: number };
  };
}

export default function StepSpecialization({ selected, onChange, slideVariants }: StepSpecializationProps) {
  return (
    <motion.div
      key="step2"
      custom={1}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="grid grid-cols-2 gap-4"
      role="radiogroup"
      aria-label="Select your specialization"
    >
      {specializations.map((spec) => {
        const Icon = spec.icon;
        const isSelected = selected === spec.id;
        return (
          <motion.button
            key={spec.id}
            onClick={() => onChange(spec.id)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${spec.label}: ${spec.desc}`}
            className={cn(
              'p-4 rounded-xl border text-left transition-all relative overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit focus-visible:ring-offset-2 focus-visible:ring-offset-neon-black',
              isSelected
                ? 'border-neon-limit bg-neon-limit/10'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="selectedSpec"
                className="absolute inset-0 bg-neon-limit/5"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <div className="relative z-10">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors',
                  isSelected ? 'bg-neon-limit text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <h4 className={cn('font-bold', isSelected ? 'text-neon-limit' : 'text-white')}>{spec.label}</h4>
              <p className="text-xs text-gray-500 mt-1">{spec.desc}</p>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
