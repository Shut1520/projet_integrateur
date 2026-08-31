import React from 'react';

export const AlertesSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-64 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="h-8 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-9 flex-1 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
        </div>
      </div>

      {/* Alert cards skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 bg-[#E0E0E0] dark:bg-[#30363D] rounded shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-4 w-14 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
                  <div className="h-4 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
                </div>
                <div className="h-2.5 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
                <div className="flex gap-4 mt-2">
                  <div className="h-2 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-2 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-2 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
                <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
