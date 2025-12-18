import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react";
import { format, getDaysInMonth, differenceInDays, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function BalanceForecastWidget({ transactions = [], currentBalance = 0 }) {
  const forecast = useMemo(() => {
    const today = new Date();
    const currentMonth = format(today, 'yyyy-MM');
    const dayOfMonth = today.getDate();
    const daysInMonth = getDaysInMonth(today);
    const daysRemaining = daysInMonth - dayOfMonth;
    
    // Current month expenses
    const currentMonthExpenses = transactions
      .filter(t => t.date?.startsWith(currentMonth) && t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const currentMonthIncome = transactions
      .filter(t => t.date?.startsWith(currentMonth) && t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Daily spend rate
    const dailySpendRate = dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0;
    const projectedMonthlyExpenses = dailySpendRate * daysInMonth;
    const remainingExpenses = dailySpendRate * daysRemaining;
    
    // Projected end-of-month balance
    const projectedBalance = currentBalance - remainingExpenses;
    
    // Build chart data
    const chartData = [];
    let runningBalance = currentBalance;
    
    // Past days (actual)
    for (let day = 1; day <= dayOfMonth; day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      const dayExpenses = transactions
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const dayIncome = transactions
        .filter(t => t.date === dateStr && t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      runningBalance = runningBalance - dayExpenses + dayIncome;
      chartData.push({
        day,
        actual: currentBalance - (currentMonthExpenses - transactions
          .filter(t => t.date?.startsWith(currentMonth) && t.type === 'expense' && new Date(t.date).getDate() <= day)
          .reduce((sum, t) => sum + (t.amount || 0), 0)),
        forecast: null
      });
    }
    
    // Future days (forecast)
    let forecastBalance = currentBalance;
    for (let day = dayOfMonth + 1; day <= daysInMonth; day++) {
      forecastBalance -= dailySpendRate;
      chartData.push({
        day,
        actual: null,
        forecast: Math.round(forecastBalance)
      });
    }
    
    // Connect actual to forecast
    if (chartData[dayOfMonth - 1]) {
      chartData[dayOfMonth - 1].forecast = chartData[dayOfMonth - 1].actual;
    }
    
    // Confidence based on data
    const confidence = dayOfMonth >= 15 ? 'high' : dayOfMonth >= 7 ? 'medium' : 'low';
    
    return {
      projectedBalance: Math.round(projectedBalance),
      dailySpendRate: Math.round(dailySpendRate),
      daysRemaining,
      remainingExpenses: Math.round(remainingExpenses),
      confidence,
      chartData,
      isNegative: projectedBalance < 0
    };
  }, [transactions, currentBalance]);

  const confidenceColors = {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-gray-500 dark:text-gray-400'
  };

  const confidenceLabels = {
    high: 'דיוק גבוה',
    medium: 'דיוק בינוני',
    low: 'טרם נצברו נתונים'
  };

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-2 px-5 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            צפי לסוף החודש
          </CardTitle>
          <span className={`text-xs ${confidenceColors[forecast.confidence]}`}>
            {confidenceLabels[forecast.confidence]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">יתרה צפויה</p>
            <p className={`text-2xl font-bold ${
              forecast.isNegative 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {forecast.isNegative && '-'}₪{Math.abs(forecast.projectedBalance).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">עוד {forecast.daysRemaining} ימים</p>
            <div className="flex items-center justify-end gap-1">
              {forecast.isNegative ? (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${
                forecast.isNegative ? 'text-red-600' : 'text-green-600'
              }`}>
                ₪{forecast.dailySpendRate}/יום
              </span>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(day) => day % 5 === 0 ? day : ''}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background, rgba(255,255,255,0.95))', 
                  border: '1px solid var(--border, #e5e7eb)', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  direction: 'rtl',
                  color: 'var(--foreground, #1f2937)'
                }}
                formatter={(value) => [`₪${value?.toLocaleString()}`, '']}
                labelFormatter={(day) => `יום ${day}`}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {forecast.isNegative && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              לפי קצב ההוצאות הנוכחי, צפויה יתרה שלילית. שקול לצמצם הוצאות.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}