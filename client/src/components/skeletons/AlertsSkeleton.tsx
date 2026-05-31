import Skeleton from "../ui/Skeleton";

function AlertRowSkeleton() {
  return (
    <div className="glass rounded-xl p-3 flex items-start gap-3">
      <Skeleton className="h-full w-1 rounded-full self-stretch" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>

      {/* Filter bar */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Alert rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <AlertRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
