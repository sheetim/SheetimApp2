import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Target, Shield } from "lucide-react";
import { AIService } from "../ai/AIService";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function FinancialHealthScore() {
  const [healthScore, setHealthScore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  useEffect(() => {
    const calculateScore = async () => {
      setIsLoading(true);
      
      const currentMonth = format(new Date(), 'yyyy-MM');
      const currentMonthTransactions = transactions.filter(t => 
        t.date && t.date.startsWith(currentMonth)
      );

      const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
      const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
      const portfolioValue = investments.reduce((sum, inv) => 
        sum + ((inv.quantity || 0) * (inv.current_price || 0)), 0
      );

      const score = await AIService.calculateHealthScore({
        totalIncome,
        totalExpenses,
        totalDebt,
        totalSavings,
        portfolioValue,
        savingsGoals,
        debts
      });

      setHealthScore(score);
      setIsLoading(false);
    };

    if (transactions.length > 0) {
      calculateScore();
    }
  }, [transactions, savingsGoals, debts, investments]);

  if (isLoading) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ציון בריאות פיננסית
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20';
    if (score >= 80) return 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20';
    if (score >= 70) return 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20';
    if (score >= 60) return 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20';
    return 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20';
  };

  return (
    <Card className={`md-card md-elevation-2 dark:bg-gray-800 bg-gradient-to-br ${getScoreBg(healthScore.score)}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between dark:text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ציון בריאות פיננסית
          </div>
          <Badge className={getScoreColor(healthScore.score)}>
            {healthScore.grade}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - healthScore.score / 100)}`}
                className={getScoreColor(healthScore.score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(healthScore.score)}`}>
                {healthScore.score}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">חיסכון</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{healthScore.savingsRate}%</div>
          </div>
          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">חובות</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{healthScore.debtToIncomeRatio}%</div>
          </div>
          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">חירום</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">{healthScore.emergencyFundMonths}M</div>
          </div>
        </div>

        <div className="space-y-2">
          {healthScore.factors.slice(0, 3).map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {factor.impact >= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : factor.impact > -15 ? (
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 dark:text-white">{factor.factor}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{factor.recommendation}</div>
              </div>
              <Badge variant="outline" className="text-xs" dir="ltr">
                {factor.impact >= 0 ? '+' : '-'}{Math.abs(factor.impact)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}