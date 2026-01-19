import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-black text-white relative overflow-hidden">
      {/* Ambient Gradient */}
      <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-brand-lime/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12"
        >
          <div className="h-12 w-64 bg-white/5 rounded-lg animate-shimmer mb-4" />
          <div className="h-6 w-96 bg-white/5 rounded animate-shimmer" />
        </motion.div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-white/5 border border-white/5 p-6 h-64"
            >
              <div className="h-4 w-20 bg-white/10 rounded animate-shimmer mb-4" />
              <div className="h-6 w-full bg-white/5 rounded animate-shimmer mb-3" />
              <div className="h-4 w-3/4 bg-white/5 rounded animate-shimmer mb-6" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-16 bg-white/10 rounded-full animate-shimmer" />
                <div className="h-6 w-20 bg-white/10 rounded-full animate-shimmer" />
              </div>
              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="h-4 w-32 bg-white/5 rounded animate-shimmer" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
