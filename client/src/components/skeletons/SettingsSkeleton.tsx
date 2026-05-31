import Skeleton from "../ui/Skeleton";

function ThresholdCardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-glass-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton variant="circular" className="h-9 w-9" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>

      {/* Visualizer bar */}
      <Skeleton className="h-3 w-full rounded-full" />

      {/* 2x2 inputs */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export default function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Threshold cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <ThresholdCardSkeleton key={i} />
      ))}

      {/* System status */}
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}
