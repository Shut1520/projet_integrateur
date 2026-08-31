import React from 'react';

export const UsersSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <div className="h-7 w-52 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-72 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="h-9 w-40 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
            <div>
              <div className="h-2.5 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-6 w-8 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] overflow-hidden">
        <div className="p-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex gap-3">
          <div className="h-9 flex-1 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
          <div className="h-9 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
        </div>
        <div className="p-5 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-[#30363D]" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                <div className="h-2.5 w-48 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
              </div>
              <div className="h-4 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              <div className="h-4 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              <div className="h-4 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              <div className="flex gap-1">
                <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
                <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
                <div className="w-7 h-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
