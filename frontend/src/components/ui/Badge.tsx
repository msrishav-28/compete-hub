import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'lime';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white/5 text-gray-300 border border-white/10 backdrop-blur-sm',
      success: 'bg-signal-green/10 text-signal-green border border-signal-green/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]',
      warning: 'bg-signal-amber/10 text-signal-amber border border-signal-amber/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      danger: 'bg-signal-red/10 text-signal-red border border-signal-red/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
      info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      lime: 'bg-neon-limit/10 text-neon-limit border border-neon-limit/20 shadow-[0_0_10px_rgba(163,230,53,0.1)]',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
