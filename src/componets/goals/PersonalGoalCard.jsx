import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit2, Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const categoryIcons = {
  "חיסכון_לפרישה": "🏖️",
  "קניית_דירה": "🏠",
  "חופשה": "✈️",
  "השכלה": "🎓",
  "פירעון_חובות": "💳",
  "קרן_חירום": "🛡️",
  "השקעות": "📈",
  "עצמאות_פיננסית": "🎯",
  "שיפוץ": "🔨",
  "אחר": "📝"
};

const priorityColors = {
  "גבוהה": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "בינונית": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "נמוכה": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
};

const timeFrameLabels = {
  "קצר_טווח": "קצר טווח",
  "בינוני": "בינוני",
  "ארוך_טווח": "ארוך טווח"
};

export default function PersonalGoalCard({ goal, onEdit, onDelete }) {
  const progress = goal.target_amount > 0 
    ? Math.min((goal.current_progress / goal.target_amount) * 100, 100) 
    : 0;
  
  const remaining = Math.max(goal.target_amount - goal.current_progress, 0);

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl">{categoryIcons[goal.category]}</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{goal.title}</h3>
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityColors[goal.priority]}>
                  {goal.priority === "גבוהה" ? "🔴" : goal.priority === "בינונית" ? "🟡" : "🟢"} {goal.priority}
                </Badge>
                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  {timeFrameLabels[goal.time_frame]}
                </Badge>
                {goal.target_date && (
                  <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    📅 {format(new Date(goal.target_date), 'MMM yyyy', { locale: he })}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal)}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">התקדמות</span>
            <span className="font-semibold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">נצבר</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">
                ₪{goal.current_progress?.toLocaleString() || 0}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">יעד</div>
              <div className="font-bold text-purple-600 dark:text-purple-400">
                ₪{goal.target_amount?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {remaining > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">נותר להשגה</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">₪{remaining.toLocaleString()}</span>
            </div>
          )}

          {goal.monthly_allocation > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              💰 הקצאה חודשית מומלצת: <span className="font-semibold text-green-700 dark:text-green-300">₪{goal.monthly_allocation.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}