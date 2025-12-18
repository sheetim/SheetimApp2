import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MonthComparisonBadge({ 
  current, 
  previous, 
  type = 'expense', // 'expense' or 'income'
  showAmount = false,
  size = 'sm' // 'sm' or 'md'
}) {
  if (!previous || previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  const isUp = change > 0;
  const isNeutral = absChange < 2;

  // For expenses: down is good, up is bad
  // For income: up is good, down is bad
  const isPositive = type === 'expense' ? !isUp : isUp;

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <Minus className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>ללא שינוי</span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
        isPositive 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {isUp ? (
        <TrendingUp className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      ) : (
        <TrendingDown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      <span>{isUp ? '+' : '-'}{absChange.toFixed(0)}%</span>
      {showAmount && (
        <span className="opacity-70">
          (₪{Math.abs(current - previous).toLocaleString()})
        </span>
      )}
    </span>
  );
}