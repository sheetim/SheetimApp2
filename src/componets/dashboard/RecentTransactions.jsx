import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, ArrowLeft, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const categoryIcons = {
  'משכורת': '💰',
  'עסק_עצמאי': '💼',
  'השקעות': '📈',
  'אחר_הכנסה': '💵',
  'מזון_ומשקאות': '🍕',
  'קניות': '🛒',
  'תחבורה': '🚗',
  'בילויים': '🎉',
  'שירותים': '📱',
  'בריאות': '🏥',
  'חינוך': '📚',
  'דיור': '🏠',
  'חובות': '💳',
  'חיסכון': '🏦',
  'אחר_הוצאה': '📦'
};

export default function RecentTransactions({ transactions = [], onAddTransaction }) {
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            עסקאות אחרונות
          </CardTitle>
          <Link to={createPageUrl("Transactions")}>
            <Button variant="ghost" size="sm" className="text-xs h-8">
              הכל
              <ArrowLeft className="w-3 h-3 mr-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recentTransactions.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              אין עסקאות עדיין
            </p>
            {onAddTransaction && (
              <Button size="sm" onClick={onAddTransaction} className="bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 ml-1" />
                הוסף עסקה
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction, idx) => {
              const isIncome = transaction.type === 'income';
              const icon = categoryIcons[transaction.category] || (isIncome ? '💰' : '📦');
              
              return (
                <div 
                  key={transaction.id || idx} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description || transaction.category?.replace(/_/g, ' ') || 'עסקה'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.date ? format(new Date(transaction.date), 'd בMMM', { locale: he }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                      {isIncome ? '+' : '-'}₪{(transaction.amount || 0).toLocaleString()}
                    </span>
                    {isIncome ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
            
            <Link to={createPageUrl("Transactions")}>
              <Button variant="ghost" size="sm" className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 mt-2">
                צפה בכל העסקאות
                <ArrowLeft className="w-3 h-3 mr-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}