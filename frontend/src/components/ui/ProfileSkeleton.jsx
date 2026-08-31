import React from 'react';

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div className="h-7 w-56 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
        <div className="h-3 w-72 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identity form skeleton */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-[#E0E0E0] dark:border-[#30363D]">
            <div className="w-16 h-16 rounded-full bg-[#E0E0E0] dark:bg-[#30363D]" />
            <div>
              <div className="h-5 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-4 w-20 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-40 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            <div className="space-y-2">
              <div className="h-2.5 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-10 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-10 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
            </div>
            <div className="h-9 w-40 bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
          </div>
        </div>

        {/* Security + API keys skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-4">
            <div className="h-4 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
            <div className="h-9 w-full bg-[#E0E0E0] dark:bg-[#30363D] rounded-xl" />
          </div>
          <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
              <div className="h-7 w-7 bg-[#E0E0E0] dark:bg-[#30363D] rounded-lg" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <div className="h-3 w-28 bg-[#E0E0E0] dark:bg-[#30363D] rounded" />
                <div className="h-2.5 w-36 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-2" />
                <div className="h-2.5 w-32 bg-[#E0E0E0] dark:bg-[#30363D] rounded mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
