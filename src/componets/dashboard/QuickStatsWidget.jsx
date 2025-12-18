import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickStatsWidget({ 
  totalIncome = 0, 
  totalExpenses = 0, 
  totalSavings = 0, 
  totalDebt = 0,
  portfolioValue = 0,
  savingsGoalsCount = 0
}) {
  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netFlow) / totalIncome * 100) : 0;

  const stats = [
    {
      label: "הכנסות החודש",
      value: totalIncome,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      link: createPageUrl("Transactions")
    },
    {
      label: "הוצאות החודש",
      value: totalExpenses,
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/30",
      link: createPageUrl("Transactions")
    },
    {
      label: "תזרים נטו",
      value: netFlow,
      icon: Wallet,
      color: netFlow >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      bgColor: netFlow >= 0 ? "bg-blue-50 dark:bg-blue-900/30" : "bg-red-50 dark:bg-red-900/30",
      link: createPageUrl("Forecast")
    },
    {
      label: "שיעור חיסכון",
      value: savingsRate,
      isPercentage: true,
      icon: PiggyBank,
      color: savingsRate >= 20 ? "text-green-600 dark:text-green-400" : savingsRate >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400",
      bgColor: savingsRate >= 20 ? "bg-green-50 dark:bg-green-900/30" : savingsRate >= 10 ? "bg-yellow-50 dark:bg-yellow-900/30" : "bg-red-50 dark:bg-red-900/30",
      link: createPageUrl("Savings")
    },
    {
      label: "תיק השקעות",
      value: portfolioValue,
      icon: TrendingUp,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
      link: createPageUrl("Investments")
    },
    {
      label: "סה״כ חובות",
      value: totalDebt,
      icon: CreditCard,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/30",
      link: createPageUrl("Debts")
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
      {stats.map((stat, idx) => (
        <Link key={idx} to={stat.link}>
          <Card className={`${stat.bgColor} border-0 hover:shadow-md transition-all cursor-pointer h-full`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">{stat.label}</span>
              </div>
              <p className={`text-sm md:text-lg font-bold ${stat.color}`} dir="ltr">
                {stat.isPercentage 
                  ? `${stat.value.toFixed(1)}%`
                  : `${stat.value < 0 ? '-' : ''}₪${Math.abs(stat.value).toLocaleString()}`
                }
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}