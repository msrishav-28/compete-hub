import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border transition-all duration-200',
            'bg-white/5 backdrop-blur-md',
            'border-white/10 hover:border-white/20',
            'text-white placeholder:text-gray-600',
            'focus:outline-none focus:ring-1 focus:ring-neon-limit/50 focus:border-neon-limit/50 focus:bg-white/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-signal-red focus:ring-signal-red',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
