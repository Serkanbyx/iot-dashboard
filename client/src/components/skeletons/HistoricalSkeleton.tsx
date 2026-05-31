import Skeleton from "../ui/Skeleton";

export default function HistoricalSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Filter bar */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Chart area */}
      <Skeleton className="h-80 w-full rounded-xl" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
