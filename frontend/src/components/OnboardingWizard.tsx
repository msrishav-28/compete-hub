import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  RocketLaunchIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../utils';
import MagneticButton from './ui/MagneticButton';
import TextScramble from './ui/TextScramble';
import { StepIdentity, StepSpecialization, StepMission } from './onboarding';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onClose?: () => void;
}

export interface OnboardingData {
  year: string;
  degree: string;
  specialization: string;
  goal: string;
  grindLevel: number;
}

const steps = [
  { id: 1, title: 'INITIALIZE IDENTITY', subtitle: 'Configure your profile parameters' },
  { id: 2, title: 'SELECT CLASS', subtitle: 'Choose your specialization path' },
  { id: 3, title: 'SET MISSION PARAMETERS', subtitle: 'Define your operational objectives' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function OnboardingWizard({ isOpen, onComplete, onClose }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    year: '',
    degree: '',
    specialization: '',
    goal: '',
    grindLevel: 5,
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
      navigate('/explore');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.year && data.degree;
      case 2:
        return data.specialization;
      case 3:
        return data.goal;
      default:
        return false;
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" aria-hidden="true" />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-limit/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-limit/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit"
            aria-label="Close onboarding wizard"
          >
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="relative h-1 bg-white/5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3} aria-label={`Step ${currentStep} of 3`}>
          <motion.div
            className="absolute inset-y-0 left-0 bg-neon-limit"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-neon-limit/50 blur-sm"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-white/5">
          <nav className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-4" aria-label="Wizard progress">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all',
                    currentStep >= step.id
                      ? 'border-neon-limit text-neon-limit bg-neon-limit/10'
                      : 'border-white/20 text-gray-600'
                  )}
                  aria-current={currentStep === step.id ? 'step' : undefined}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn('w-8 h-px', currentStep > step.id ? 'bg-neon-limit' : 'bg-white/10')} aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>
          <h2 id="onboarding-title">
            <TextScramble
              text={steps[currentStep - 1].title}
              className="text-2xl font-black text-white font-display tracking-tight block"
              duration={500}
              key={currentStep}
            />
          </h2>
          <p className="text-gray-500 text-sm mt-1">{steps[currentStep - 1].subtitle}</p>
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[320px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={currentStep}>
            {currentStep === 1 && (
              <StepIdentity
                data={{ year: data.year, degree: data.degree }}
                onChange={updateData}
                slideVariants={slideVariants}
              />
            )}
            {currentStep === 2 && (
              <StepSpecialization
                selected={data.specialization}
                onChange={(specialization) => updateData({ specialization })}
                slideVariants={slideVariants}
              />
            )}
            {currentStep === 3 && (
              <StepMission
                data={{ goal: data.goal, grindLevel: data.grindLevel }}
                onChange={updateData}
                slideVariants={slideVariants}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-black/20">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-limit',
              currentStep === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'
            )}
            aria-label="Go to previous step"
          >
            <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
            Back
          </button>

          <MagneticButton
            onClick={handleNext}
            disabled={!canProceed()}
            variant="primary"
            size="md"
            className="min-w-[160px]"
            aria-label={currentStep === 3 ? 'Complete onboarding and launch' : 'Continue to next step'}
          >
            {currentStep === 3 ? (
              <>
                Launch
                <RocketLaunchIcon className="w-4 h-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Continue
                <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </MagneticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
