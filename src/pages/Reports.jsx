import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import InteractiveChart from "../components/charts/InteractiveChart";
import CustomReportBuilder from "../components/reports/CustomReportBuilder";
import { SubscriptionGuard } from "../components/subscription/SubscriptionGuard";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";

export default function ReportsPage() {
  const [period, setPeriod] = useState(12);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
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

  // Generate monthly comparison data
  const monthlyData = Array.from({ length: period }, (_, i) => {
    const date = subMonths(new Date(), period - 1 - i);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMM yy', { locale: he });
    
    const monthTransactions = transactions.filter(t => 
      t.date && t.date.startsWith(monthKey)
    );

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const savings = income - expenses;

    return {
      month: monthLabel,
      הכנסות: income,
      הוצאות: expenses,
      חיסכון: savings
    };
  });

  // Category comparison
  const categoryComparison = () => {
    const categories = {};
    
    monthlyData.forEach((monthData, idx) => {
      const date = subMonths(new Date(), period - 1 - idx);
      const monthKey = format(date, 'yyyy-MM');
      
      const monthTransactions = transactions.filter(t => 
        t.date && t.date.startsWith(monthKey) && t.type === 'expense'
      );

      monthTransactions.forEach(t => {
        const cat = t.category || 'אחר';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(t.amount || 0);
      });
    });

    return Object.entries(categories)
      .map(([name, amounts]) => ({
        category: name.replace(/_/g, ' '),
        average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
        total: amounts.reduce((a, b) => a + b, 0),
        trend: amounts.length >= 2 ? 
          ((amounts[amounts.length - 1] - amounts[0]) / amounts[0] * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  };

  const categories = categoryComparison();

  // Budget comparison over time
  const budgetComparison = monthlyData.map((monthData, idx) => {
    const date = subMonths(new Date(), period - 1 - idx);
    const monthKey = format(date, 'yyyy-MM');
    
    const monthBudgets = budgets.filter(b => b.month === monthKey);
    const totalBudget = monthBudgets.reduce((sum, b) => sum + (b.monthly_limit || 0), 0);
    
    return {
      month: monthData.month,
      תקציב: totalBudget,
      'הוצאות בפועל': monthData.הוצאות,
      'עמידה בתקציב': totalBudget > 0 ? ((monthData.הוצאות / totalBudget) * 100).toFixed(1) : 0
    };
  });

  // Calculate statistics
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.הכנסות, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.הוצאות, 0);
  const totalSavings = totalIncome - totalExpenses;
  const avgMonthlyIncome = totalIncome / period;
  const avgMonthlyExpenses = totalExpenses / period;

  const exportToCSV = () => {
    const headers = ['חודש', 'הכנסות', 'הוצאות', 'חיסכון'];
    const csvContent = [
      headers.join(','),
      ...monthlyData.map(row => 
        [row.month, row.הכנסות, row.הוצאות, row.חיסכון].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `דוח_פיננסי_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">דוחות והשוואות</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ניתוח היסטורי ומגמות פיננסיות</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} size="sm" className="h-10 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 sm:ml-2" />
            <span className="hidden sm:inline">ייצא לאקסל</span>
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {[6, 12, 24].map(months => (
          <Button
            key={months}
            variant={period === months ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod(months)}
            className={`h-9 px-3 rounded-full ${period !== months ? 'text-gray-600 dark:text-gray-300' : ''}`}
          >
            {months} חודשים
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">סה״כ הכנסות</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalIncome.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{period} חודשים</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">סה״כ הוצאות</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{period} חודשים</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">ממוצע הכנסות</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{avgMonthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-gray-400">לחודש</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">ממוצע הוצאות</p>
            <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{avgMonthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-gray-400">לחודש</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-4 md:p-5 pb-2 md:pb-3">
          <CardTitle className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">מגמת הכנסות והוצאות</CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">השוואה של {period} החודשים האחרונים</p>
        </CardHeader>
        <CardContent className="p-4 md:p-5 pt-0">
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#6b7280" 
                  tick={{ fontSize: 10 }} 
                  tickFormatter={(v) => `₪${(v/1000).toFixed(0)}K`}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    direction: 'rtl'
                  }} 
                  formatter={(value) => `₪${value.toLocaleString()}`} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="הכנסות" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="הכנסות" />
                <Line type="monotone" dataKey="הוצאות" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="הוצאות" />
                <Line type="monotone" dataKey="חיסכון" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="חיסכון" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Comparison */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">השוואת קטגוריות הוצאות</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="space-y-2">
            {categories.slice(0, 8).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{cat.category}</span>
                    <span className="font-bold text-gray-900 dark:text-white">₪{cat.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">ממוצע: ₪{cat.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className={`text-xs font-medium ${cat.trend > 0 ? 'text-red-600' : cat.trend < 0 ? 'text-green-600' : 'text-gray-500'}`} dir="ltr">
                      {cat.trend > 0 ? '+' : cat.trend < 0 ? '-' : ''}{Math.abs(cat.trend).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SubscriptionGuard feature="advanced_reports">
        <CustomReportBuilder transactions={transactions} budgets={budgets} savingsGoals={savingsGoals} debts={debts} investments={investments} />
      </SubscriptionGuard>
    </div>
  );
}