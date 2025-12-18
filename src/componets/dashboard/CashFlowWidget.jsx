import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subMonths } from "date-fns";
import { he } from "date-fns/locale";

export default function CashFlowWidget({ transactions = [] }) {
  // Calculate last 6 months data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthKey = format(date, 'yyyy-MM');
    const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(monthKey));
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const net = income - expenses;
    
    return {
      month: format(date, 'MMM', { locale: he }),
      הכנסות: income,
      הוצאות: expenses,
      נטו: net,
      isPositive: net >= 0
    };
  });

  const currentMonthData = last6Months[last6Months.length - 1];
  const lastMonthData = last6Months[last6Months.length - 2];
  
  const incomeChange = lastMonthData?.הכנסות > 0 
    ? ((currentMonthData.הכנסות - lastMonthData.הכנסות) / lastMonthData.הכנסות * 100) 
    : 0;
  const expenseChange = lastMonthData?.הוצאות > 0 
    ? ((currentMonthData.הוצאות - lastMonthData.הוצאות) / lastMonthData.הוצאות * 100) 
    : 0;

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-slate-800 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            תזרים מזומנים
          </CardTitle>
          <Link to={createPageUrl("Forecast")}>
            <Button variant="ghost" size="sm" className="text-xs">
              צפי מלא
              <ArrowLeft className="w-3 h-3 mr-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">הכנסות</span>
              {incomeChange !== 0 && (
                <span className={`text-[10px] flex items-center ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {incomeChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span dir="ltr">{incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(0)}%</span>
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">₪{currentMonthData.הכנסות.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">הוצאות</span>
              {expenseChange !== 0 && (
                <span className={`text-[10px] flex items-center ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {expenseChange <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  <span dir="ltr">{expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(0)}%</span>
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">₪{currentMonthData.הוצאות.toLocaleString()}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last6Months} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#6b7280' }}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  direction: 'rtl'
                }}
                formatter={(value, name) => [`₪${value.toLocaleString()}`, name]}
              />
              <Bar dataKey="הכנסות" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="הוצאות" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}