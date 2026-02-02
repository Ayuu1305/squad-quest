import Skeleton from "../ui/Skeleton";

const QuestCardSkeleton = () => {
  return (
    <div className="glassmorphism-dark rounded-[24px] p-1 relative group overflow-hidden border border-white/10">
      {/* Inner Container - Exact match to QuestCard */}
      <div className="backdrop-blur-xl rounded-[20px] p-5 h-full relative z-10 flex flex-col justify-between bg-black/80">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-3/4 mb-2 rounded-md" />

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>

          {/* Host Badge Skeleton (sometimes present) */}
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>

        {/* Squad Capacity Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-1.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
            <Skeleton className="h-full w-2/3" />
          </div>
        </div>

        {/* Info Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Timing Box */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>

          {/* Loot Box */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <Skeleton className="h-4 w-14 rounded" />
          </div>
        </div>

        {/* Footer: Avatar Stack and Member Count */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          {/* Avatar Stack */}
          <div className="flex -space-x-2">
            <Skeleton className="w-8 h-8 rounded-full border-2 border-black" />
            <Skeleton className="w-8 h-8 rounded-full border-2 border-black" />
            <Skeleton className="w-8 h-8 rounded-full border-2 border-black" />
          </div>

          {/* Member Count */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestCardSkeleton;
