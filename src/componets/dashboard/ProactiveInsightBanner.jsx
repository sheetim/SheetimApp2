import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProactiveInsightBanner() {
  const [dismissed, setDismissed] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load dismissed insights from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissed_insights');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep dismissals from last 24 hours
        const recent = parsed.filter(d => Date.now() - d.time < 24 * 60 * 60 * 1000);
        setDismissed(recent);
      } catch (e) {}
    }
  }, []);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const insights = useMemo(() => {
    const result = [];
    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');
    const lastMonth = format(subMonths(today, 1), 'yyyy-MM');
    
    // Current month transactions
    const currentMonthTx = transactions.filter(t => t.date?.startsWith(currentMonth));
    const lastMonthTx = transactions.filter(t => t.date?.startsWith(lastMonth));
    
    // Weekly comparison
    const last7Days = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= subDays(today, 7) && t.type === 'expense';
    });
    const prev7Days = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= subDays(today, 14) && txDate < subDays(today, 7) && t.type === 'expense';
    });
    
    const weeklyExpenses = last7Days.reduce((s, t) => s + (t.amount || 0), 0);
    const prevWeeklyExpenses = prev7Days.reduce((s, t) => s + (t.amount || 0), 0);
    
    // Insight 1: Weekly spending spike
    if (prevWeeklyExpenses > 0 && weeklyExpenses > prevWeeklyExpenses * 1.2) {
      const increase = Math.round(((weeklyExpenses - prevWeeklyExpenses) / prevWeeklyExpenses) * 100);
      result.push({
        id: 'weekly_spike',
        type: 'warning',
        icon: TrendingUp,
        emoji: '📈',
        title: `הוצאת ${increase}% יותר השבוע`,
        message: `השבוע הוצאת ₪${weeklyExpenses.toLocaleString()} לעומת ₪${prevWeeklyExpenses.toLocaleString()} בשבוע שעבר`,
        action: { label: 'צפה בפירוט', url: createPageUrl('Transactions') },
        bgColor: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
      });
    }

    // Insight 2: Savings goal progress
    const activeGoals = savingsGoals.filter(g => g.target_amount > 0);
    const closeToGoal = activeGoals.find(g => {
      const progress = (g.current_amount || 0) / g.target_amount;
      return progress >= 0.8 && progress < 1;
    });
    
    if (closeToGoal) {
      const progress = Math.round(((closeToGoal.current_amount || 0) / closeToGoal.target_amount) * 100);
      const remaining = closeToGoal.target_amount - (closeToGoal.current_amount || 0);
      result.push({
        id: 'goal_close',
        type: 'success',
        icon: Target,
        emoji: '🎯',
        title: `${progress}% מהיעד "${closeToGoal.name}"!`,
        message: `נשארו רק ₪${remaining.toLocaleString()} - אתה כמעט שם!`,
        action: { label: 'צפה ביעד', url: createPageUrl('Savings') },
        bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      });
    }

    // Insight 3: Category spike
    const currentMonthExpenses = currentMonthTx.filter(t => t.type === 'expense');
    const lastMonthExpenses = lastMonthTx.filter(t => t.type === 'expense');
    
    const categoryTotals = {};
    const lastCategoryTotals = {};
    
    currentMonthExpenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (t.amount || 0);
    });
    lastMonthExpenses.forEach(t => {
      lastCategoryTotals[t.category] = (lastCategoryTotals[t.category] || 0) + (t.amount || 0);
    });
    
    const categoryNames = {
      'מזון_ומשקאות': 'אוכל ומסעדות',
      'קניות': 'קניות',
      'תחבורה': 'תחבורה',
      'בילויים': 'בילויים'
    };
    
    for (const [cat, total] of Object.entries(categoryTotals)) {
      const lastTotal = lastCategoryTotals[cat] || 0;
      if (lastTotal > 0 && total > lastTotal * 1.3 && total > 500) {
        const increase = Math.round(((total - lastTotal) / lastTotal) * 100);
        result.push({
          id: `category_${cat}`,
          type: 'info',
          icon: Lightbulb,
          emoji: '💡',
          title: `${categoryNames[cat] || cat} עלה ב-${increase}%`,
          message: `הוצאת ₪${total.toLocaleString()} על ${categoryNames[cat] || cat} החודש, לעומת ₪${lastTotal.toLocaleString()} בחודש שעבר`,
          action: { label: 'נתח הוצאות', url: createPageUrl('Transactions') },
          bgColor: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        });
        break; // Only show one category insight
      }
    }

    // Insight 4: Budget warning
    const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);
    const budgetWarning = currentMonthBudgets.find(b => {
      const spent = categoryTotals[b.category] || 0;
      const percentage = (spent / b.monthly_limit) * 100;
      return percentage >= 80 && percentage < 100;
    });
    
    if (budgetWarning) {
      const spent = categoryTotals[budgetWarning.category] || 0;
      const percentage = Math.round((spent / budgetWarning.monthly_limit) * 100);
      result.push({
        id: `budget_${budgetWarning.category}`,
        type: 'warning',
        icon: AlertTriangle,
        emoji: '⚠️',
        title: `${percentage}% מתקציב ${categoryNames[budgetWarning.category] || budgetWarning.category}`,
        message: `נשארו ₪${(budgetWarning.monthly_limit - spent).toLocaleString()} מתוך ₪${budgetWarning.monthly_limit.toLocaleString()}`,
        action: { label: 'צפה בתקציבים', url: createPageUrl('Budgets') },
        bgColor: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      });
    }

    // Insight 5: Positive - spending down
    const currentTotal = currentMonthExpenses.reduce((s, t) => s + (t.amount || 0), 0);
    const lastTotal = lastMonthExpenses.reduce((s, t) => s + (t.amount || 0), 0);
    const dayOfMonth = today.getDate();
    const daysInLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const projectedLastMonth = (lastTotal / daysInLastMonth) * dayOfMonth;
    
    if (projectedLastMonth > 0 && currentTotal < projectedLastMonth * 0.85) {
      const savings = Math.round(projectedLastMonth - currentTotal);
      result.push({
        id: 'spending_down',
        type: 'success',
        icon: TrendingDown,
        emoji: '🎉',
        title: 'מצוין! אתה חוסך יותר החודש',
        message: `עד עכשיו חסכת כ-₪${savings.toLocaleString()} לעומת אותה תקופה בחודש שעבר`,
        action: { label: 'צפה בדוח', url: createPageUrl('Reports') },
        bgColor: 'from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      });
    }

    // Filter out dismissed insights
    const dismissedIds = dismissed.map(d => d.id);
    return result.filter(insight => !dismissedIds.includes(insight.id));
  }, [transactions, savingsGoals, budgets, dismissed]);

  const handleDismiss = (insightId) => {
    const newDismissed = [...dismissed, { id: insightId, time: Date.now() }];
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_insights', JSON.stringify(newDismissed));
  };

  if (insights.length === 0) return null;

  const currentInsight = insights[currentIndex % insights.length];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentInsight.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`bg-gradient-to-r ${currentInsight.bgColor} border ${currentInsight.borderColor} rounded-2xl overflow-hidden`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{currentInsight.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {currentInsight.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {currentInsight.message}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismiss(currentInsight.id)}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {currentInsight.action && (
                  <Link to={currentInsight.action.url}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-3 mt-2 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    >
                      {currentInsight.action.label} →
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Dots indicator for multiple insights */}
            {insights.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {insights.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentIndex % insights.length
                        ? 'w-4 bg-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}