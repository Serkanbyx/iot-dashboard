import Skeleton from "../ui/Skeleton";

function SensorCardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-glass-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-5 w-5" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Value */}
      <Skeleton className="h-10 w-28" />

      {/* Sparkline area */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton variant="circular" className="h-6 w-6" />
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Alert bar */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SensorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
