import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface HolographicChipProps {
  children: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'fire' | 'trophy' | 'code' | 'warning';
}

const variantStyles = {
  default: {
    base: 'border-white/10 text-gray-300',
    active: 'border-neon-limit/50 text-neon-limit bg-neon-limit/10',
    glow: 'rgba(163, 230, 53, 0.3)',
  },
  fire: {
    base: 'border-orange-500/20 text-orange-400/70',
    active: 'border-orange-500/50 text-orange-400 bg-orange-500/10',
    glow: 'rgba(249, 115, 22, 0.3)',
  },
  trophy: {
    base: 'border-yellow-500/20 text-yellow-400/70',
    active: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
    glow: 'rgba(234, 179, 8, 0.3)',
  },
  code: {
    base: 'border-blue-500/20 text-blue-400/70',
    active: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  warning: {
    base: 'border-signal-red/20 text-signal-red/70',
    active: 'border-signal-red/50 text-signal-red bg-signal-red/10',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
};

export default function HolographicChip({
  children,
  icon,
  active = false,
  onClick,
  className,
  variant = 'default',
}: HolographicChipProps) {
  const styles = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: active ? `0 0 20px ${styles.glow}` : '0 0 0px transparent',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-colors duration-300 text-sm font-medium whitespace-nowrap',
        'bg-white/5 hover:bg-white/10',
        active ? styles.active : styles.base,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
