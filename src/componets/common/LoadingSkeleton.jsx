import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageLoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-pulse" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="h-1 bg-gray-200 dark:bg-gray-700"></div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-0 dark:bg-gray-800 rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-4 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-0 dark:bg-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 dark:bg-gray-800 rounded-2xl">
        <CardHeader className="p-5 pb-2">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Tip */}
      <Card className="border-0 dark:bg-gray-800 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestmentsLoadingSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-4 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-indigo-200 dark:bg-indigo-800 rounded-lg"></div>
      </div>

      {/* Hero Stats */}
      <Card className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-0 rounded-2xl">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
              <div className="h-8 w-28 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
            </div>
            <div className="space-y-2 text-left">
              <div className="h-3 w-16 bg-indigo-200 dark:bg-indigo-700 rounded mr-auto"></div>
              <div className="h-8 w-24 bg-indigo-200 dark:bg-indigo-700 rounded mr-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Chips */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        ))}
      </div>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 dark:bg-gray-800 rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NetWorthLoadingSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-4 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="h-1 bg-gray-200 dark:bg-gray-700"></div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-0 dark:bg-gray-800 rounded-2xl">
        <CardHeader className="p-4 pb-2">
          <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AIInsightsLoadingSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-4 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-purple-200 dark:bg-purple-800 rounded-lg"></div>
      </div>

      {/* Collapsible Sections */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-0 dark:bg-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="mr-auto w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ListLoadingSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartLoadingSkeleton() {
  return (
    <div className="h-64 md:h-80 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">טוען נתונים...</p>
      </div>
    </div>
  );
}