import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Target, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function NotificationSummary({ transactions, budgets, savingsGoals, debts, investments, period = 'daily' }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getSummaryData = () => {
    const now = new Date();
    const startDate = period === 'daily' 
      ? startOfDay(now)
      : startOfWeek(now, { locale: he });
    const endDate = period === 'daily'
      ? endOfDay(now)
      : endOfWeek(now, { locale: he });

    const periodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netFlow = income - expenses;

    // בדיקת תקציבים
    const currentMonth = format(now, 'yyyy-MM');
    const budgetAlerts = budgets.filter(budget => {
      if (budget.month !== currentMonth) return false;
      
      const spent = transactions
        .filter(t => t.date?.startsWith(currentMonth) && t.category === budget.category && t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const percentage = (spent / budget.monthly_limit) * 100;
      return percentage >= budget.alert_threshold;
    }).length;

    // יעדי חיסכון בסיכון
    const riskyGoals = savingsGoals.filter(goal => {
      if (!goal.target_date) return false;
      const daysLeft = Math.floor((new Date(goal.target_date) - now) / (1000 * 60 * 60 * 24));
      const percentage = (goal.current_amount / goal.target_amount) * 100;
      return daysLeft <= 30 && percentage < 80;
    }).length;

    // שינוי בתיק השקעות
    let portfolioChange = 0;
    if (investments && investments.length > 0) {
      const currentValue = investments.reduce((sum, inv) => 
        sum + ((inv.quantity || 0) * (inv.current_price || 0)), 0
      );
      const costBasis = investments.reduce((sum, inv) => 
        sum + ((inv.quantity || 0) * (inv.purchase_price || 0)), 0
      );
      portfolioChange = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
    }

    return {
      income,
      expenses,
      netFlow,
      transactionCount: periodTransactions.length,
      budgetAlerts,
      riskyGoals,
      portfolioChange,
      startDate,
      endDate
    };
  };

  const summary = getSummaryData();
  const alertCount = summary.budgetAlerts + summary.riskyGoals;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Calendar className="w-5 h-5" />
          {alertCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {alertCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[85vh]" dir="rtl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            {period === 'daily' ? 'סיכום יומי' : 'סיכום שבועי'}
          </SheetTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(summary.startDate, 'd MMMM', { locale: he })} - {format(summary.endDate, 'd MMMM', { locale: he })}
          </p>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* תזרים כספי - Hero Style */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl text-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">הכנסות</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                ₪{summary.income.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-2xl text-center">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">הוצאות</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                ₪{summary.expenses.toLocaleString()}
              </p>
            </div>

            <div className={`p-4 rounded-2xl text-center ${
              summary.netFlow >= 0 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30'
            }`}>
              <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${
                summary.netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
              }`} />
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">נטו</p>
              <p className={`text-lg font-bold ${
                summary.netFlow >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'
              }`}>
                {summary.netFlow >= 0 ? '+' : ''}₪{summary.netFlow.toLocaleString()}
              </p>
            </div>
          </div>

          {/* סטטיסטיקות */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-sm text-gray-700 dark:text-gray-300">סה״כ עסקאות</span>
              <Badge variant="secondary" className="text-sm px-3">{summary.transactionCount}</Badge>
            </div>

            {summary.budgetAlerts > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">התראות תקציב</span>
                </div>
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-3">
                  {summary.budgetAlerts}
                </Badge>
              </div>
            )}

            {summary.riskyGoals > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">יעדים בסיכון</span>
                </div>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-3">
                  {summary.riskyGoals}
                </Badge>
              </div>
            )}

            {investments && investments.length > 0 && (
              <div className={`flex items-center justify-between p-3 rounded-xl ${
                summary.portfolioChange >= 0 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                <span className="text-sm text-gray-700 dark:text-gray-300">ביצועי תיק השקעות</span>
                <Badge className={`px-3 ${
                  summary.portfolioChange >= 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {summary.portfolioChange >= 0 ? '+' : ''}{summary.portfolioChange.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}