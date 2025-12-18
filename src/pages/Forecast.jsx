import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Calculator } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, addMonths, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import WhatIfSimulator from "../components/scenarios/WhatIfSimulator";
import PageHeader from "../components/common/PageHeader";
import ProBadge from "../components/common/ProBadge";

export default function ForecastPage() {
  const [forecastMonths, setForecastMonths] = useState(6);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.list();
      return prefs.length > 0 ? prefs[0] : { credit_card_billing_day: 10 };
    },
    initialData: { credit_card_billing_day: 10 },
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  // Calculate average monthly income/expenses from history using billing_date for credit cards
  const calculateAverages = () => {
    const last3Months = Array.from({ length: 3 }, (_, i) => {
      const date = addMonths(new Date(), -i);
      return format(date, 'yyyy-MM');
    });

    // Use billing_date for credit card transactions, date for others
    const recentTransactions = transactions.filter(t => {
      const relevantDate = (t.payment_method === 'כרטיס_אשראי' && t.billing_date) ? t.billing_date : t.date;
      return relevantDate && last3Months.some(month => relevantDate.startsWith(month));
    });

    const avgIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 3;

    const avgExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 3;

    return { avgIncome, avgExpenses };
  };

  // Get recurring transactions
  const recurringTransactions = transactions.filter(t => t.is_recurring);
  
  const recurringIncome = recurringTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const recurringExpenses = recurringTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Add monthly debt payments
  const monthlyDebtPayments = debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  const { avgIncome, avgExpenses } = calculateAverages();

  // Generate forecast
  const forecastData = Array.from({ length: forecastMonths }, (_, i) => {
    const date = addMonths(new Date(), i + 1);
    const month = format(date, 'MMM yyyy', { locale: he });
    
    // Forecast based on averages + recurring
    const projectedIncome = avgIncome + recurringIncome;
    const projectedExpenses = avgExpenses + recurringExpenses + monthlyDebtPayments;
    const netFlow = projectedIncome - projectedExpenses;

    return {
      month,
      'הכנסות צפויות': Math.round(projectedIncome),
      'הוצאות צפויות': Math.round(projectedExpenses),
      'תזרים צפוי': Math.round(netFlow)
    };
  });

  // Calculate cumulative savings
  let cumulativeSavings = 0;
  const savingsForecast = forecastData.map(item => {
    cumulativeSavings += item['תזרים צפוי'];
    return {
      month: item.month,
      'חיסכון מצטבר': cumulativeSavings
    };
  });

  const totalProjectedIncome = forecastData.reduce((sum, item) => sum + item['הכנסות צפויות'], 0);
  const totalProjectedExpenses = forecastData.reduce((sum, item) => sum + item['הוצאות צפויות'], 0);
  const totalProjectedSavings = totalProjectedIncome - totalProjectedExpenses;

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="תחזית ותכנון" 
        icon={TrendingUp}
        pageName="Forecast"
        badge="Pro"
        badgeVariant="default"
      >
        <div className="flex gap-2">
          {[3, 6, 12].map(months => (
            <Button
              key={months}
              variant={forecastMonths === months ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setForecastMonths(months)}
              className={`h-9 px-3 rounded-full text-xs ${forecastMonths !== months ? 'text-gray-600 dark:text-gray-300' : ''}`}
            >
              {months} חודשים
            </Button>
          ))}
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">הכנסות צפויות</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalProjectedIncome.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{forecastMonths} חודשים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">הוצאות צפויות</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalProjectedExpenses.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{forecastMonths} חודשים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${totalProjectedSavings >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'}`} />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${totalProjectedSavings >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-orange-100 dark:bg-orange-900/40'} rounded-xl flex items-center justify-center`}>
                <Calendar className={`w-5 h-5 ${totalProjectedSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">חיסכון צפוי</p>
                <p className={`text-lg md:text-xl font-bold ${totalProjectedSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} dir="ltr">
                  {totalProjectedSavings >= 0 ? '+' : '-'}₪{Math.abs(totalProjectedSavings).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{forecastMonths} חודשים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 md:p-5 pb-2 md:pb-3">
            <CardTitle className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">תחזית הכנסות והוצאות</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-5 pt-0">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${(v/1000).toFixed(0)}k`} width={45} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', direction: 'rtl' }} 
                      formatter={(value, name) => [`₪${value.toLocaleString()}`, name]}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="הכנסות צפויות" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="הוצאות צפויות" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 md:p-5 pb-2 md:pb-3">
            <CardTitle className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">חיסכון מצטבר צפוי</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-5 pt-0">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={savingsForecast} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${(v/1000).toFixed(0)}k`} width={45} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', direction: 'rtl' }} 
                      formatter={(value) => [`₪${value.toLocaleString()}`, 'חיסכון מצטבר']}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="חיסכון מצטבר" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Transactions */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            עסקאות חוזרות
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">הכנסות חוזרות</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">₪{recurringIncome.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{recurringTransactions.filter(t => t.type === 'income').length} עסקאות</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">הוצאות חוזרות</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">₪{(recurringExpenses + monthlyDebtPayments).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{recurringTransactions.filter(t => t.type === 'expense').length} עסקאות + {debts.length} חובות</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What-If Simulator */}
      <WhatIfSimulator
        currentIncome={avgIncome}
        currentExpenses={avgExpenses}
        currentSavings={0}
        currentDebt={debts.reduce((sum, d) => sum + (d.current_balance || 0), 0)}
        savingsGoals={[]}
        debts={debts}
      />

      {/* Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
          💳 תזרים חכם עם כרטיסי אשראי
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          התחזית משתמשת בתאריכי חיוב בפועל לכרטיסי אשראי (יום {userPrefs.credit_card_billing_day} בחודש), ולא בתאריך ביצוע העסקה.
          ניתן לשנות את יום החיוב בהגדרות המשתמש.
        </p>
      </div>
    </div>
  );
}