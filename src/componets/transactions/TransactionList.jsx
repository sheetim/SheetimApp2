import React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionList({ transactions, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">אין עסקאות להצגה</p>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1">התחל על ידי הוספת עסקה חדשה</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          {/* Icon */}
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
            transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
          }`}>
            {transaction.type === 'income' ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                {transaction.description || 'ללא תיאור'}
              </h3>
              {transaction.is_recurring && (
                <Repeat className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[60px] sm:max-w-none">
                {transaction.category?.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400">•</span>
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                {transaction.date && format(new Date(transaction.date), 'dd/MM', { locale: he })}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className={`text-sm sm:text-base font-bold whitespace-nowrap ${
            transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`} dir="ltr">
            {transaction.type === 'income' ? '+' : '-'}₪{transaction.amount?.toLocaleString()}
          </div>

          {/* Actions - hidden on mobile, show on swipe or long press would be better UX */}
          <div className="hidden sm:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-8 w-8 rounded-lg"
            >
              <Pencil className="w-4 h-4 text-gray-500 hover:text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(transaction.id)}
              className="h-8 w-8 rounded-lg"
            >
              <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
            </Button>
          </div>
          
          {/* Mobile actions - smaller */}
          <div className="flex sm:hidden gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-7 w-7 rounded-lg"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(transaction.id)}
              className="h-7 w-7 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}