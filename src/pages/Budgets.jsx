import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Download, BarChart3, PieChart as PieChartIcon, Lightbulb, Wallet } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import BudgetForm from "../components/budgets/BudgetForm";
import BudgetCard from "../components/budgets/BudgetCard";
import { useToast } from "@/components/ui/use-toast";
import { exportBudgetsToCSV } from "../components/utils/exportHelpers";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import { PageLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function BudgetsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentMonth = format(new Date(), 'yyyy-MM');

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    initialData: [],
  });

  const isLoading = budgetsLoading || transactionsLoading;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setEditingBudget(null);
      toast({
        title: "✅ תקציב נוסף בהצלחה",
        description: "התקציב החדש נשמר במערכת",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "❌ שגיאה",
        description: "לא הצלחנו להוסיף את התקציב",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setEditingBudget(null);
      toast({
        title: "✅ תקציב עודכן",
        description: "השינויים נשמרו בהצלחה",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "❌ שגיאה",
        description: "לא הצלחנו לעדכן את התקציב",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "🗑️ תקציב נמחק",
        description: "התקציב הוסר מהמערכת",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "❌ שגיאה",
        description: "לא הצלחנו למחוק את התקציב",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  // Get spending per category for current month
  const currentMonthExpenses = transactions.filter(
    t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth)
  );

  const spendingByCategory = currentMonthExpenses.reduce((acc, t) => {
    const cat = t.category || 'אחר';
    acc[cat] = (acc[cat] || 0) + (t.amount || 0);
    return acc;
  }, {});

  const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);

  // Calculate summary statistics
  const totalBudget = currentMonthBudgets.reduce((sum, b) => sum + (b.monthly_limit || 0), 0);
  const totalSpent = currentMonthBudgets.reduce((sum, b) => sum + (spendingByCategory[b.category] || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
  
  const budgetsOverLimit = currentMonthBudgets.filter(b => {
    const spent = spendingByCategory[b.category] || 0;
    return (spent / b.monthly_limit) > 1;
  }).length;

  const budgetsNearLimit = currentMonthBudgets.filter(b => {
    const spent = spendingByCategory[b.category] || 0;
    const percentage = (spent / b.monthly_limit) * 100;
    return percentage >= b.alert_threshold && percentage <= 100;
  }).length;

  // Prepare chart data
  const chartData = currentMonthBudgets.map(b => ({
    category: b.category.replace(/_/g, ' '),
    תקציב: b.monthly_limit,
    הוצאות: spendingByCategory[b.category] || 0,
    נותר: Math.max(0, b.monthly_limit - (spendingByCategory[b.category] || 0))
  }));

  const pieData = currentMonthBudgets
    .filter(b => (spendingByCategory[b.category] || 0) > 0)
    .map(b => ({
      name: b.category.replace(/_/g, ' '),
      value: spendingByCategory[b.category] || 0
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const handleExport = () => {
    exportBudgetsToCSV(budgets, transactions);
    toast({
      title: "📥 קובץ יוצא",
      description: "התקציבים יוצאו בהצלחה",
      variant: "success",
    });
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="תקציבים" 
        icon={PieChartIcon}
        pageName="Budgets"
      >
        <div className="flex gap-2">
          {budgets.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm" className="h-10">
              <Download className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">ייצא</span>
            </Button>
          )}
          <Button
            onClick={() => { setEditingBudget(null); setShowForm(!showForm); }}
            size="sm"
            className="h-10 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            תקציב חדש
          </Button>
        </div>
      </PageHeader>

      {/* Explanation for new users */}
      {currentMonthBudgets.length === 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">מה זה תקציב חודשי?</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  הגדר כמה אתה רוצה להוציא לכל קטגוריה בחודש (למשל: 2,000₪ למזון, 500₪ לבילויים). 
                  המערכת תראה לך כמה הוצאת מתוך התקציב ותתריע אם אתה מתקרב לגבול.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Summary Card */}
      {currentMonthBudgets.length > 0 && (
        <Card className={`${totalRemaining >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-orange-500'} border-0 text-white rounded-2xl shadow-lg`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/80 mb-1">{format(new Date(), 'MMMM yyyy', { locale: he })}</p>
                <p className="text-xs text-white/60">סה״כ תקציב: ₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/80">הוצאות עד עכשיו</span>
                <span className="font-bold">₪{totalSpent.toLocaleString()} ({overallPercentage.toFixed(0)}%)</span>
              </div>
              <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${overallPercentage > 100 ? 'bg-red-300' : 'bg-white'}`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <span className="text-sm text-white/80">נשאר להוציא:</span>
              <span className="text-xl font-bold">
                {totalRemaining >= 0 ? '' : '-'}₪{Math.abs(totalRemaining).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingBudget ? 'עריכת תקציב' : 'תקציב חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <BudgetForm budget={editingBudget} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingBudget(null); }} />
          </CardContent>
        </Card>
      )}

      {/* Quick Overview - Simple Pie */}
      {currentMonthBudgets.length > 0 && pieData.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              לאן הלך הכסף החודש?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={35}
                    outerRadius={60} 
                    fill="#8884d8" 
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    formatter={(value) => `₪${value.toLocaleString()}`} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[50%] space-y-2">
                {pieData.slice(0, 5).map((entry, index) => {
                  const percentage = totalSpent > 0 ? ((entry.value / totalSpent) * 100).toFixed(0) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{entry.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white flex-shrink-0">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">
          תקציב {format(new Date(), 'MMMM yyyy', { locale: he })}
        </h2>
        {currentMonthBudgets.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <CardContent className="p-5">
              <EmptyState 
                icon={BarChart3} 
                title="אין תקציבים מוגדרים" 
                description="הגדר תקציב חודשי לכל קטגוריה כדי לשלוט בהוצאות." 
                actionLabel="הגדר תקציב ראשון" 
                onAction={() => setShowForm(true)} 
                illustration="financial" 
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentMonthBudgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} spent={spendingByCategory[budget.category] || 0} onEdit={() => handleEdit(budget)} onDelete={() => deleteMutation.mutate(budget.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}