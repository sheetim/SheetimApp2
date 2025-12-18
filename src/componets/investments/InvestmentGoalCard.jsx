import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, TrendingUp, Edit2, Trash2, DollarSign } from "lucide-react";
import { format, differenceInMonths } from "date-fns";

export default function InvestmentGoalCard({ goal, onEdit, onDelete }) {
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const remaining = goal.target_amount - goal.current_amount;
  const monthsUntilTarget = differenceInMonths(new Date(goal.target_date), new Date());
  const monthlyNeeded = monthsUntilTarget > 0 ? remaining / monthsUntilTarget : 0;

  const goalTypeIcons = {
    "פרישה": "🏖️",
    "רכישת_דירה": "🏠",
    "חינוך_ילדים": "🎓",
    "חירום": "🚨",
    "נסיעה": "✈️",
    "אחר": "🎯"
  };

  const riskColors = {
    "שמרני": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    "מתון": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    "אגרסיבי": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{goalTypeIcons[goal.goal_type] || "🎯"}</span>
            <div>
              <CardTitle className="text-lg dark:text-white">{goal.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {goal.goal_type?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(goal)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(goal)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">התקדמות</span>
            <span className="text-sm font-semibold dark:text-white">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>₪{goal.current_amount.toLocaleString()}</span>
            <span>₪{goal.target_amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">תאריך יעד</p>
              <p className="font-medium">{format(new Date(goal.target_date), 'MM/yyyy')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Target className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">נותר</p>
              <p className="font-medium">₪{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <DollarSign className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">נדרש לחודש</p>
              <p className="font-medium">₪{Math.max(0, monthlyNeeded).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">תשואה צפויה</p>
              <p className="font-medium">{goal.expected_return}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge className={riskColors[goal.risk_profile]}>
            {goal.risk_profile}
          </Badge>
          {goal.monthly_contribution > 0 && (
            <Badge variant="outline" className="dark:border-gray-600">
              הפקדה: ₪{goal.monthly_contribution.toLocaleString()}/חודש
            </Badge>
          )}
        </div>

        {goal.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {goal.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}