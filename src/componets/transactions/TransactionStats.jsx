import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function TransactionStats({ transactions }) {
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

  const balance = totalIncome - totalExpenses;
  const transactionCount = currentMonthTransactions.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">הכנסות החודש</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">הוצאות החודש</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${balance >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'}`} />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-orange-100 dark:bg-orange-900/40'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Wallet className={`w-5 h-5 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">יתרה חודשית</p>
              <p className={`text-lg md:text-xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {balance >= 0 ? '+' : '-'}₪{Math.abs(balance).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">עסקאות החודש</p>
              <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{transactionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}