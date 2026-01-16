import { cn } from '../../utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/5", className)}
            {...props}
        />
    );
}

export function CompetitionCardSkeleton() {
    return (
        <div className="rounded-3xl border border-white/5 bg-black/40 p-8 h-full">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-2 w-full">
                    <Skeleton className="h-8 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            <div className="flex gap-3 mb-6">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="space-y-2 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
            </div>
        </div>
    );
}
