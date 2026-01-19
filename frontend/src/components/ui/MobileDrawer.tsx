import { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
}

export default function MobileDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  footer,
}: MobileDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-[70]',
            'bg-neon-grey/95 backdrop-blur-2xl',
            'rounded-t-[20px] border-t border-white/10',
            'flex flex-col max-h-[90vh]',
            'outline-none'
          )}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          {(title || description) && (
            <div className="px-6 pb-4 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <Drawer.Title className="text-lg font-bold text-white font-display uppercase tracking-tight">
                      {title}
                    </Drawer.Title>
                  )}
                  {description && (
                    <Drawer.Description className="text-sm text-gray-500 mt-1">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>

          {/* Sticky Footer */}
          {footer && (
            <div className="sticky bottom-0 px-6 py-4 border-t border-white/5 bg-neon-grey/95 backdrop-blur-xl pb-safe">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
