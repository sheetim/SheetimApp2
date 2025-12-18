import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MonthlyOverview({ 
  totalIncome = 0, 
  totalExpenses = 0,
  budgetLimit = 0,
  previousMonthExpenses = 0
}) {
  const balance = totalIncome - totalExpenses;
  const budgetUsed = budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0;
  const expenseChange = previousMonthExpenses > 0 
    ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
    : 0;
  
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: he });

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-600 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">סיכום חודשי</p>
              <h3 className="text-lg md:text-xl font-bold text-white">{currentMonth}</h3>
            </div>
            <Link 
              to={createPageUrl("Reports")} 
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              דוח מלא
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 md:p-5 space-y-4">
          {/* Income & Expense */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">הכנסות</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400" dir="ltr">
                +₪{totalIncome.toLocaleString()}
              </p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">הוצאות</span>
              </div>
              <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400" dir="ltr">
                -₪{totalExpenses.toLocaleString()}
              </p>
              {expenseChange !== 0 && (
                <p className={`text-[10px] mt-1 ${expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {expenseChange > 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(0)}% מהחודש שעבר
                </p>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className={`rounded-xl p-4 ${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">יתרה חודשית</p>
                <p className={`text-2xl md:text-3xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} dir="ltr">
                  {balance >= 0 ? '+' : '-'}₪{Math.abs(balance).toLocaleString()}
                </p>
              </div>
              {balance >= 0 && (
                <div className="flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  מצוין!
                </div>
              )}
            </div>
          </div>

          {/* Budget Progress */}
          {budgetLimit > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">ניצול תקציב</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {budgetUsed.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={Math.min(budgetUsed, 100)} 
                className={`h-2 ${budgetUsed > 90 ? '[&>div]:bg-red-500' : budgetUsed > 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                ₪{totalExpenses.toLocaleString()} מתוך ₪{budgetLimit.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}