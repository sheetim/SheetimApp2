import React from "react";

export function SkeletonCard() {
  return (
    <div className="md-card md-elevation-2 border-0 dark:bg-gray-800 overflow-hidden">
      <div className="mobile-card-padding space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="md-card md-elevation-2 border-0 dark:bg-gray-800 overflow-hidden">
      <div className="mobile-card-padding space-y-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const Component = {
    card: SkeletonCard,
    chart: SkeletonChart,
    list: SkeletonList,
  }[type] || SkeletonCard;

  if (type === 'list') {
    return <Component />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}