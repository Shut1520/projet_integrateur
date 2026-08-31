import React from 'react';

export const ThresholdsSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <div className="h-7 w-56 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-80 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
      </div>

      {/* Seuil cards skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E0E0E0] dark:border-[#30363D]">
              <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
              <div>
                <div className="h-4 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                <div className="h-2.5 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2.5 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-5 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                </div>
                <div className="w-full h-1.5 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              </div>
              <div className="p-4 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2.5 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                  <div className="h-5 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                </div>
                <div className="w-full h-1.5 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
