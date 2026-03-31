export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-white/5 ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-20 pb-12">
      <div className="mb-10">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-background p-5">
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export function LessonsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-12">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-48 mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}