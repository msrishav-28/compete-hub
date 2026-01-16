import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white/10 text-gray-200 border border-white/5',
      success: 'bg-green-500/10 text-green-400 border border-green-500/20',
      warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
      info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
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
