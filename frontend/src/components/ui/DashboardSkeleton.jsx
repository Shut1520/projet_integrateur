import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-48 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
          <div className="h-3 w-64 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-5 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
          <div className="h-8 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
        </div>
      </div>

      {/* Health summary bar skeleton */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
            <div>
              <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-5 w-12 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
            <div>
              <div className="h-3 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-5 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0E0E0] dark:bg-[#30363D]" />
            <div>
              <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-5 w-14 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Gauges skeleton - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="h-2.5 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                <div className="h-2 w-10 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
              </div>
              <div className="w-4 h-4 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <div className="h-7 w-14 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-3 w-6 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
            <div className="w-full h-1.5 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
          </div>
        ))}
      </div>

      {/* Chart + Alerts row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart skeleton */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B22] p-5 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-40 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            <div className="flex gap-1">
              <div className="h-6 w-10 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
              <div className="h-6 w-10 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
            </div>
          </div>
          <div className="h-72 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
        </div>

        {/* Alerts skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] border-l-4 border-l-[#E0E0E0]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-4 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#E0E0E0] dark:bg-[#30363D]/50">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#E0E0E0] dark:bg-[#30363D] rounded shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                      <div className="h-2.5 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actuators skeleton */}
          <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-4 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
                    <div>
                      <div className="h-3 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                      <div className="h-2 w-16 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
                    </div>
                  </div>
                  <div className="w-11 h-6 bg-[#E0E0E0] dark:bg-[#30363D] rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
