import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const investmentTypeColors = {
  'מניות': 'from-blue-400 to-blue-600',
  'אג״ח': 'from-green-400 to-green-600',
  'קרנות_נאמנות': 'from-purple-400 to-purple-600',
  'קריפטו': 'from-orange-400 to-orange-600',
  'נדל״ן': 'from-teal-400 to-teal-600',
  'פיקדונות': 'from-indigo-400 to-indigo-600',
  'אחר': 'from-gray-400 to-gray-600'
};

export default function InvestmentCard({ investment, onEdit, onDelete }) {
  const currency = investment.currency || 'ILS';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₪';
  
  // Calculate values in the investment's currency
  const totalInvested = (investment.quantity || 0) * (investment.purchase_price || 0);
  const currentValue = (investment.quantity || 0) * (investment.current_price || 0);
  const gainLoss = currentValue - totalInvested;
  const gainLossPercent = totalInvested !== 0 ? (gainLoss / totalInvested) * 100 : 0;
  const isProfit = gainLoss >= 0;
  const change24h = investment.change_24h || 0;
  const is24hProfit = change24h >= 0;
  
  // Calculate dividend yield
  const annualDividend = investment.annual_dividend_per_share ? investment.annual_dividend_per_share * investment.quantity : 0;
  const dividendYield = totalInvested > 0 && annualDividend > 0 ? (annualDividend / totalInvested) * 100 : 0;

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99]">
      <div className={`h-1 sm:h-1.5 bg-gradient-to-r ${investmentTypeColors[investment.type] || investmentTypeColors['אחר']}`} />
      <CardContent className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">{investment.name}</h3>
              {investment.symbol && (
                <span className="text-[9px] sm:text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1 sm:px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {investment.symbol}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{investment.type?.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex gap-0.5 sm:gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>

        {/* Main Value + Gain/Loss */}
        <div className="flex items-end justify-between mb-2 sm:mb-3">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" dir="ltr">{currencySymbol}{currentValue.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr">{investment.quantity} × {currencySymbol}{investment.current_price?.toLocaleString()}</p>
          </div>
          <div className={`text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl ${isProfit ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
            <p className={`text-sm sm:text-base font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
              {isProfit ? '+' : ''}{gainLossPercent.toFixed(1)}%
            </p>
            <p className={`text-[10px] sm:text-xs ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
              {isProfit ? '+' : ''}{currencySymbol}{gainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl text-[10px] sm:text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">הושקע</span>
            <p className="font-semibold text-gray-900 dark:text-white">{currencySymbol}{totalInvested.toLocaleString()}</p>
          </div>
          <div className="text-left">
            <span className="text-gray-500 dark:text-gray-400">24 שעות</span>
            <p className={`font-semibold ${is24hProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
              {is24hProfit ? '+' : ''}{change24h.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Dividends Section */}
        {(investment.dividends > 0 || dividendYield > 0) && (
          <div className="flex items-center justify-between text-[10px] sm:text-xs mt-2 p-2 sm:p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl">
            <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {investment.dividends > 0 ? (
                <>דיבידנדים: {currencySymbol}{investment.dividends?.toLocaleString()}</>
              ) : (
                <>תשואה: {dividendYield.toFixed(1)}%</>
              )}
            </span>
            {annualDividend > 0 && (
              <span className="text-green-700 dark:text-green-400 font-medium">~{currencySymbol}{annualDividend.toLocaleString(undefined, {maximumFractionDigits: 0})}/שנה</span>
            )}
          </div>
        )}

        {/* Link to Dividends page */}
        {investment.type === 'מניות' && (
          <Link to={createPageUrl("Dividends")}>
            <Button variant="ghost" size="sm" className="w-full h-8 sm:h-9 text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg sm:rounded-xl">
              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />
              {investment.dividends > 0 ? 'צפה בדיבידנדים' : 'רשום דיבידנד'}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}