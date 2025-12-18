import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Target, PieChart, Award } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AIService } from "../ai/AIService";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PortfolioAnalysis({ investments }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzePortfolio = async () => {
      setIsLoading(true);
      const result = await AIService.analyzeInvestmentPortfolio(investments);
      setAnalysis(result);
      setIsLoading(false);
    };

    analyzePortfolio();
  }, [investments]);

  if (isLoading) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">ניתוח תיק השקעות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.score === 0) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">ניתוח תיק השקעות</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              אין מספיק נתונים לניתוח תיק ההשקעות. התחל להשקיע!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md-card md-elevation-2 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between dark:text-white">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ניתוח תיק השקעות AI
          </div>
          <Badge className={parseFloat(analysis.totalReturn) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {parseFloat(analysis.totalReturn) >= 0 ? '+' : ''}{analysis.totalReturn}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">שווי כולל</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{analysis.totalValue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">רווח/הפסד</div>
            <div className={`text-lg font-bold ${
              parseFloat(analysis.totalReturn) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ₪{(analysis.totalValue - analysis.totalCost).toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">Alpha</div>
            <div className={`text-lg font-bold ${
              parseFloat(analysis.alpha) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {parseFloat(analysis.alpha) >= 0 ? '+' : ''}{analysis.alpha}%
            </div>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">שיעור הצלחה</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {analysis.winRate}%
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">פיזור תיק</h4>
          <div className="flex gap-4">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={150}>
                <RePieChart>
                  <Pie
                    data={analysis.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analysis.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {analysis.byType.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{item.type}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="w-4 h-4 text-yellow-600" />
            המלצות לשיפור
          </h4>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <Alert key={idx} className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                  {rec}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Target className="w-3 h-3" />
          <span>ניתוח מבוסס AI עם השוואה לשוק</span>
        </div>
      </CardContent>
    </Card>
  );
}