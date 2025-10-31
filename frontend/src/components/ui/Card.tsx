import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
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
        whileHover={hover ? { y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
        className={cn(
          'rounded-xl border transition-all duration-300',
          glass
            ? 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-white/20'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          hover && 'hover:shadow-xl cursor-pointer',
          'shadow-md',
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
