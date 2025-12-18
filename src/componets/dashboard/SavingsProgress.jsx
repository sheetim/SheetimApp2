import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target as TargetIcon, ArrowLeft, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SavingsProgress({ savingsGoals = [] }) {
  const activeGoals = savingsGoals.filter(g => g.target_amount > 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
  const totalCurrent = activeGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const topGoals = activeGoals
    .sort((a, b) => {
      const progressA = (a.current_amount || 0) / (a.target_amount || 1);
      const progressB = (b.current_amount || 0) / (b.target_amount || 1);
      return progressB - progressA;
    })
    .slice(0, 3);

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TargetIcon className="w-5 h-5 text-orange-500" />
            יעדי חיסכון
          </CardTitle>
          <Link to={createPageUrl("Savings")}>
            <Button variant="ghost" size="sm" className="text-xs h-8">
              הכל
              <ArrowLeft className="w-3 h-3 mr-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activeGoals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TargetIcon className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              עוד לא הגדרת יעדי חיסכון
            </p>
            <Link to={createPageUrl("Savings")}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 ml-1" />
                הוסף יעד
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">התקדמות כללית</span>
                <div className="flex items-center gap-1">
                  {overallProgress >= 50 && <Sparkles className="w-3 h-3 text-orange-500" />}
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {overallProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={overallProgress} 
                className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-500"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>₪{totalCurrent.toLocaleString()}</span>
                <span>מתוך ₪{totalTarget.toLocaleString()}</span>
              </div>
            </div>

            {/* Top Goals */}
            <div className="space-y-3">
              {topGoals.map((goal, idx) => {
                const progress = (goal.current_amount || 0) / (goal.target_amount || 1) * 100;
                return (
                  <div key={goal.id || idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      {goal.icon || <TargetIcon className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {goal.name}
                        </span>
                        <span className="text-xs text-gray-500 mr-2">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-1.5 [&>div]:bg-orange-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {activeGoals.length > 3 && (
              <Link to={createPageUrl("Savings")}>
                <p className="text-xs text-center text-orange-600 dark:text-orange-400 hover:underline">
                  +{activeGoals.length - 3} יעדים נוספים
                </p>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}