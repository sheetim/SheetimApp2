import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Calendar, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { ListLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function InflationPage() {
  const [comparisonPeriod, setComparisonPeriod] = useState(3); // months to compare

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  // Calculate category spending by month for comparison
  const calculateMonthlyByCategory = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const monthlyByCategory = {};
    
    expenseTransactions.forEach(t => {
      if (!t.date || !t.category) return;
      const monthKey = t.date.substring(0, 7);
      const cat = t.category.replace(/_/g, ' ');
      
      if (!monthlyByCategory[cat]) monthlyByCategory[cat] = {};
      if (!monthlyByCategory[cat][monthKey]) monthlyByCategory[cat][monthKey] = 0;
      monthlyByCategory[cat][monthKey] += t.amount || 0;
    });

    return monthlyByCategory;
  };

  const monthlyByCategory = calculateMonthlyByCategory();

  // Calculate inflation comparing current period to previous period
  const calculatePeriodInflation = () => {
    const now = new Date();
    const currentPeriodMonths = Array.from({ length: comparisonPeriod }, (_, i) => 
      format(subMonths(now, i), 'yyyy-MM')
    );
    const previousPeriodMonths = Array.from({ length: comparisonPeriod }, (_, i) => 
      format(subMonths(now, comparisonPeriod + i), 'yyyy-MM')
    );

    const results = [];
    Object.entries(monthlyByCategory).forEach(([category, months]) => {
      const currentTotal = currentPeriodMonths.reduce((sum, m) => sum + (months[m] || 0), 0);
      const previousTotal = previousPeriodMonths.reduce((sum, m) => sum + (months[m] || 0), 0);
      
      if (previousTotal > 0) {
        const inflationRate = ((currentTotal - previousTotal) / previousTotal) * 100;
        results.push({
          category,
          currentTotal,
          previousTotal,
          inflationRate,
          monthlyAvgCurrent: currentTotal / comparisonPeriod,
          monthlyAvgPrevious: previousTotal / comparisonPeriod
        });
      }
    });

    return results.sort((a, b) => b.inflationRate - a.inflationRate);
  };

  // Calculate monthly trend for last 6 months
  const calculateMonthlyTrend = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthKey = format(date, 'yyyy-MM');
      
      let total = 0;
      Object.values(monthlyByCategory).forEach(catMonths => {
        total += catMonths[monthKey] || 0;
      });

      return {
        month: format(date, 'MMM yy', { locale: he }),
        monthKey,
        total
      };
    });

    return last6Months;
  };

  const periodInflation = calculatePeriodInflation();
  const monthlyTrend = calculateMonthlyTrend();
  
  const avgInflation = periodInflation.length > 0 
    ? periodInflation.reduce((sum, i) => sum + i.inflationRate, 0) / periodInflation.length 
    : 0;

  const topIncreases = periodInflation.filter(i => i.inflationRate > 0).slice(0, 3);
  const topDecreases = periodInflation.filter(i => i.inflationRate < 0).slice(-3).reverse();

  // Create chart data for category trends over time
  const createCategoryTrendData = () => {
    const categories = Object.keys(monthlyByCategory).slice(0, 5);
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return format(date, 'yyyy-MM');
    });

    return last6Months.map((monthKey, idx) => {
      const monthDate = subMonths(new Date(), 5 - idx);
      const dataPoint = { month: format(monthDate, 'MMM', { locale: he }) };
      
      categories.forEach(cat => {
        dataPoint[cat] = monthlyByCategory[cat]?.[monthKey] || 0;
      });
      
      return dataPoint;
    });
  };

  const categoryTrendData = createCategoryTrendData();
  const topCategories = Object.keys(monthlyByCategory).slice(0, 5);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
        <ListLoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="אינפלציה אישית" 
        icon={Activity}
        pageName="Inflation"
      />

      {/* Explanation Card */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-800 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">מה זה אינפלציה אישית?</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                אנחנו משווים את ההוצאות שלך לפי קטגוריה בין תקופות זמן שונות. 
                אם הוצאת יותר על מזון החודש לעומת לפני 3 חודשים - זה "עלייה". 
                ככה תוכל לראות איפה ההוצאות שלך עולות או יורדות.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selection */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">השווה:</span>
        <div className="flex gap-2">
          {[1, 3, 6].map(months => (
            <Button
              key={months}
              variant={comparisonPeriod === months ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonPeriod(months)}
              className={`h-9 px-4 rounded-full text-xs ${comparisonPeriod === months ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
            >
              {months === 1 ? 'חודש אחרון' : `${months} חודשים`}
            </Button>
          ))}
        </div>
      </div>

      {transactions.filter(t => t.type === 'expense').length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <EmptyState 
              icon={Activity} 
              title="אין פריטים במעקב" 
              description="עקוב אחרי מחירי מוצרים לאורך זמן כדי להבין איך האינפלציה משפיעה עליך." 
              actionLabel="הוסף עסקאות הוצאה" 
              illustration="financial" 
            />
          </CardContent>
        </Card>
      ) : periodInflation.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Info className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">צריך עוד קצת נתונים</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              כדי להשוות {comparisonPeriod} חודשים, צריך לפחות {comparisonPeriod * 2} חודשים של היסטוריית הוצאות.
              המשך להזין עסקאות ונראה לך את המגמות בקרוב!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Summary Card */}
          <Card className={`${avgInflation >= 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'} border-0 text-white rounded-2xl shadow-lg`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">שינוי ממוצע בהוצאות</p>
                  <p className="text-3xl font-bold" dir="ltr">
                    {avgInflation >= 0 ? '+' : ''}{avgInflation.toFixed(1)}%
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    השוואת {comparisonPeriod} חודשים אחרונים מול {comparisonPeriod} קודמים
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  {avgInflation >= 0 ? (
                    <TrendingUp className="w-8 h-8" />
                  ) : (
                    <TrendingDown className="w-8 h-8" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Changes */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-600" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">עלו 📈</p>
                </div>
                {topIncreases.length > 0 ? (
                  <div className="space-y-2">
                    {topIncreases.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{item.category}</span>
                        <span className="text-xs text-red-600 font-bold flex-shrink-0 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full" dir="ltr">
                          +{item.inflationRate.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">🎉 אין עליות משמעותיות</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowDownRight className="w-4 h-4 text-green-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">ירדו 📉</p>
                </div>
                {topDecreases.length > 0 ? (
                  <div className="space-y-2">
                    {topDecreases.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{item.category}</span>
                        <span className="text-xs text-green-600 font-bold flex-shrink-0 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full" dir="ltr">
                          {item.inflationRate.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">אין ירידות משמעותיות</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Trend Chart */}
          {topCategories.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">מגמת הוצאות לפי קטגוריה (6 חודשים)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={categoryTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₪${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl', fontSize: 11 }} 
                      formatter={(value) => `₪${value.toLocaleString()}`}
                    />
                    {topCategories.map((cat, idx) => (
                      <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[idx]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {topCategories.map((cat, idx) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{cat}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Comparison - Simplified */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-600" />
                כל הקטגוריות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {periodInflation.slice(0, 8).map((item, idx) => {
                  const isPositive = item.inflationRate >= 0;
                  
                  return (
                    <div key={idx} className={`p-3 rounded-xl flex items-center justify-between ${isPositive ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}`}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">{item.category}</span>
                        <span className="text-[10px] text-gray-500">
                          ₪{item.monthlyAvgPrevious.toLocaleString(undefined, {maximumFractionDigits: 0})} → ₪{item.monthlyAvgCurrent.toLocaleString(undefined, {maximumFractionDigits: 0})} לחודש
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />
                        )}
                        <span className={`text-sm font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                          {isPositive ? '+' : ''}{item.inflationRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Total Trend */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Activity className="w-4 h-4 text-pink-600" />
                סה״כ הוצאות חודשיות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {monthlyTrend.map((item, idx) => {
                  const prevMonth = monthlyTrend[idx - 1];
                  const change = prevMonth && prevMonth.total > 0 
                    ? ((item.total - prevMonth.total) / prevMonth.total * 100) 
                    : 0;
                  
                  return (
                    <div key={idx} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-1">{item.month}</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">₪{(item.total / 1000).toFixed(1)}k</p>
                      {idx > 0 && (
                        <p className={`text-[9px] mt-0.5 ${change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(0)}%
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}