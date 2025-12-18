import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function WorthWidget({ 
  totalAssets = 0, 
  totalInvestments = 0, 
  totalSavings = 0, 
  totalDebt = 0 
}) {
  const netWorth = totalAssets + totalInvestments + totalSavings - totalDebt;
  const isPositive = netWorth >= 0;

  const data = [
    { name: 'נכסים', value: totalAssets, color: COLORS[0] },
    { name: 'השקעות', value: totalInvestments, color: COLORS[1] },
    { name: 'חסכונות', value: totalSavings, color: COLORS[2] },
  ].filter(item => item.value > 0);

  const debtData = totalDebt > 0 ? [{ name: 'חובות', value: totalDebt, color: COLORS[4] }] : [];

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">שווי נקי</span>
          </div>
          <Link to={createPageUrl("NetWorth")}>
            <Button variant="ghost" size="sm" className="text-xs h-8 px-2">
              פירוט
              <ArrowLeft className="w-3 h-3 mr-1" />
            </Button>
          </Link>
        </div>
        <p className={`text-2xl md:text-3xl font-bold mb-3 ${isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
          <span dir="ltr" className="inline-block">{!isPositive && '-'}₪{Math.abs(netWorth).toLocaleString()}</span>
        </p>

        {data.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">₪{item.value.toLocaleString()}</span>
              </div>
            ))}
            {totalDebt > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">חובות</span>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">-₪{totalDebt.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {data.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">הוסף נכסים והשקעות לחישוב השווי</p>
        )}
      </CardContent>
    </Card>
  );
}