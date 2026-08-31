import React from 'react';

export const HistorySkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <div className="h-7 w-56 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-72 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
      </div>

      {/* Filters skeleton */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
        <div className="h-4 w-12 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
        <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
        <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
        <div className="h-9 flex-1 min-w-[200px] bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
      </div>

      {/* Chart skeleton */}
      <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
          <div className="h-4 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
        </div>
        <div className="h-60 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0E0E0] dark:border-[#30363D]">
          <div className="h-4 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-3 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-3 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-3 w-14 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
