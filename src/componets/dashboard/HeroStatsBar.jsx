import React from "react";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function HeroStatsBar({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  savingsRate = 0,
  netWorth = 0
}) {
  const stats = [
    {
      label: "הכנסות",
      value: totalIncome,
      icon: TrendingUp,
      trend: ArrowUpRight,
      color: "bg-gradient-to-br from-emerald-500 to-green-600",
      textColor: "text-white"
    },
    {
      label: "הוצאות",
      value: totalExpenses,
      icon: TrendingDown,
      trend: ArrowDownRight,
      color: "bg-gradient-to-br from-rose-500 to-red-600",
      textColor: "text-white"
    },
    {
      label: "שיעור חיסכון",
      value: savingsRate,
      isPercentage: true,
      icon: PiggyBank,
      color: savingsRate >= 20 
        ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
        : "bg-gradient-to-br from-amber-500 to-orange-600",
      textColor: "text-white"
    },
    {
      label: "שווי נקי",
      value: netWorth,
      icon: Target,
      color: netWorth >= 0 
        ? "bg-gradient-to-br from-teal-500 to-cyan-600" 
        : "bg-gradient-to-br from-red-500 to-rose-600",
      textColor: "text-white"
    }
  ];

  const formatValue = (value, isPercentage) => {
    if (isPercentage) return `${value.toFixed(0)}%`;
    const absValue = Math.abs(value);
    const prefix = value < 0 ? '-' : '';
    // Shorten large numbers for mobile
    if (absValue >= 1000000) {
      return `${prefix}₪${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 10000) {
      return `${prefix}₪${(absValue / 1000).toFixed(0)}K`;
    }
    return `${prefix}₪${absValue.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className={`${stat.color} rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg`}
        >
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className={`text-[10px] md:text-sm font-medium ${stat.textColor} opacity-90`}>
              {stat.label}
            </span>
            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <stat.icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
          </div>
          <p className={`text-base md:text-2xl lg:text-3xl font-bold ${stat.textColor} truncate`} dir="ltr">
            {formatValue(stat.value, stat.isPercentage)}
          </p>
        </div>
      ))}
    </div>
  );
}