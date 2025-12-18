import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, TrendingUp, Target, CreditCard, BarChart3, Sparkles } from "lucide-react";

export default function QuickActions({ onAddTransaction }) {
  const actions = [
    {
      icon: Plus,
      label: "הוסף עסקה",
      description: "רשום הכנסה או הוצאה",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      onClick: onAddTransaction
    },
    {
      icon: TrendingUp,
      label: "השקעות",
      description: "נהל את התיק",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      link: createPageUrl("Investments")
    },
    {
      icon: Target,
      label: "יעדי חיסכון",
      description: "הגדר יעדים",
      color: "bg-gradient-to-br from-orange-500 to-amber-600",
      link: createPageUrl("Savings")
    },
    {
      icon: BarChart3,
      label: "דוחות",
      description: "ניתוח מעמיק",
      color: "bg-gradient-to-br from-purple-500 to-violet-600",
      link: createPageUrl("Reports")
    },
    {
      icon: CreditCard,
      label: "חובות",
      description: "ניהול הלוואות",
      color: "bg-gradient-to-br from-red-500 to-rose-600",
      link: createPageUrl("Debts")
    },
    {
      icon: Sparkles,
      label: "יועץ AI",
      description: "קבל המלצות",
      color: "bg-gradient-to-br from-pink-500 to-fuchsia-600",
      link: createPageUrl("FinancialAdvisor")
    }
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
      {actions.map((action, idx) => {
        const content = (
          <div 
            className="flex flex-col items-center text-center p-3 md:p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-full"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg mb-2 md:mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
              {action.label}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden md:block">
              {action.description}
            </span>
          </div>
        );

        if (action.onClick) {
          return (
            <button key={idx} onClick={action.onClick} className="text-right">
              {content}
            </button>
          );
        }

        return (
          <Link key={idx} to={action.link}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}