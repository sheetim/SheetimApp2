import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";

export default function BudgetCard({ budget, spent, onEdit, onDelete }) {
  const percentage = (spent / budget.monthly_limit) * 100;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= budget.alert_threshold && percentage <= 100;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const remaining = budget.monthly_limit - spent;

  return (
    <Card className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all ${
      isOverBudget ? 'border-red-300 dark:border-red-700' : isNearLimit ? 'border-orange-300 dark:border-orange-700' : ''
    }`}>
      <div className={`h-1 ${getProgressColor()}`} />
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{budget.category?.replace(/_/g, ' ')}</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 rounded-lg">
              <Pencil className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 rounded-lg">
              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xl font-bold text-gray-900 dark:text-white">₪{spent.toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ ₪{budget.monthly_limit?.toLocaleString()}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
          <div 
            className={`absolute h-full rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${
            isOverBudget ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'
          }`}>
            {percentage.toFixed(0)}%
          </span>
          <span className={`text-xs font-medium ${remaining < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`} dir="ltr">
            {remaining >= 0 ? `₪${remaining.toLocaleString()} נותר` : `₪${Math.abs(remaining).toLocaleString()} חריגה`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}