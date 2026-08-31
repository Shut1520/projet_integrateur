import React from 'react';

export const CapteursSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <div className="h-7 w-52 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-72 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
      </div>

      {/* Summary bar skeleton */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
              <div>
                <div className="h-2.5 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                <div className="h-4 w-8 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-4 w-12 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
          <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
          <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
          <div className="h-9 flex-1 min-w-[200px] bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
                <div>
                  <div className="h-3.5 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-2.5 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
                </div>
              </div>
              <div className="h-4 w-14 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="h-2.5 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-2.5 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
            <div className="flex gap-2 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
              <div className="flex-1 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
              <div className="flex-1 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
              <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
