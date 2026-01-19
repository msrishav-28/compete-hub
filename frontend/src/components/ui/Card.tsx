import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  glass?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glass = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { y: -4, boxShadow: '0 0 20px rgba(163, 230, 53, 0.1)' } : {}}
        className={cn(
          'rounded-xl border transition-all duration-300 relative overflow-hidden',
          glass
            ? 'glass-panel text-white' // Assuming glass-panel utility or manual classes
            : 'bg-neon-black border-white/10 text-white',
          // Explicit Dataglass overrides if 'glass' is true, or default to nice dark mode
          'backdrop-blur-xl bg-white/5 border-white/10',
          hover && 'hover:border-neon-limit/50 cursor-pointer',
          'shadow-2xl shadow-black/50',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pb-0', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 flex items-center', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
