import Skeleton from "../ui/Skeleton";
import QuestCardSkeleton from "./QuestCardSkeleton";

const QuestBoardSkeleton = () => {
  return (
    <div className="min-h-screen relative transition-colors duration-1000 bg-dark-bg">
      {/* Top Banner Skeleton */}
      <div className="border-b bg-blue-500/10 border-blue-500/20">
        <div className="flex items-center justify-center gap-4 py-2 px-6">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 pt-8 container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8">
          <div className="w-full">
            {/* Header */}
            <div className="mb-8">
              <header className="flex justify-between items-start">
                <div>
                  {/* Title */}
                  <Skeleton className="h-10 w-64 mb-2 rounded-lg" />
                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {/* XP Label */}
                  <Skeleton className="h-3 w-24 mb-1.5 rounded" />
                  {/* XP Badge */}
                  <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
              </header>
            </div>

            {/* Daily Bounty + Private Channel Row */}
            <div className="mb-8 flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Daily Bounty Skeleton */}
              <div className="flex-1">
                <div className="p-[1px] rounded-3xl bg-gradient-to-br from-neon-purple/20 to-transparent shadow-2xl overflow-hidden">
                  <div className="bg-black rounded-[22px] p-6 relative min-h-[200px]">
                    <Skeleton className="h-8 w-48 mb-4 rounded-lg" />
                    <Skeleton className="h-4 w-full mb-2 rounded" />
                    <Skeleton className="h-4 w-3/4 mb-6 rounded" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Private Channel Skeleton */}
              <div className="p-[1px] rounded-2xl bg-gradient-to-br from-red-500/20 to-transparent shadow-2xl lg:w-80 overflow-hidden">
                <div className="bg-black rounded-xl p-5 relative min-h-[200px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="h-3 w-32 rounded" />
                    </div>
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                  <div className="mt-3 flex justify-between gap-1">
                    <Skeleton className="h-2 w-20 rounded" />
                    <Skeleton className="h-2 w-16 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Component */}
            <div className="mb-8 sticky top-20 z-40">
              <div className="bg-dark-bg/90 backdrop-blur-xl p-3 sm:p-4 rounded-full border border-white/5 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {/* Search Pill */}
                <div className="w-full sm:flex-1">
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>

                {/* Filter Tags */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 p-1">
                    <Skeleton className="h-10 w-20 rounded-full" />
                    <Skeleton className="h-10 w-20 rounded-full" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                    <Skeleton className="h-10 w-20 rounded-full" />
                    <Skeleton className="h-10 w-28 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-40">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <QuestCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestBoardSkeleton;
