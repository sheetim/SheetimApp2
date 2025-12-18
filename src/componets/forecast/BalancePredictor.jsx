import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AIService } from "../ai/AIService";

export default function BalancePredictor({ months = 6 }) {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadForecast = async () => {
      setIsLoading(true);
      const data = await AIService.predictFutureBalance(months);
      setForecast(data);
      setIsLoading(false);
    };
    loadForecast();
  }, [months]);

  if (isLoading) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">תחזית תזרים מזומנים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast || forecast.predictions.length === 0) {
    return null;
  }

  return (
    <Card className="md-card md-elevation-2 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between dark:text-white">
          <span>תחזית תזרים מזומנים - {months} חודשים</span>
          <Badge variant={forecast.currentBalance > 0 ? "success" : "destructive"}>
            <span dir="ltr">{forecast.currentBalance >= 0 ? '+' : '-'}₪{Math.abs(forecast.currentBalance).toLocaleString()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {forecast.alert && (
          <Alert className={
            forecast.alert.type === 'warning' 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }>
            {forecast.alert.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
            <AlertDescription className="text-gray-700 dark:text-gray-300">
              <strong>{forecast.alert.title}</strong>
              <p className="text-sm mt-1">{forecast.alert.message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">ממוצע הכנסות</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{forecast.avgIncome.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1 mt-1" dir="ltr">
              {parseFloat(forecast.incomeGrowthRate) >= 0 ? (
                <><TrendingUp className="w-3 h-3" /> +{forecast.incomeGrowthRate}%</>
              ) : (
                <><TrendingDown className="w-3 h-3" /> -{Math.abs(parseFloat(forecast.incomeGrowthRate))}%</>
              )}
            </div>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">ממוצע הוצאות</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{forecast.avgExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 flex items-center justify-center gap-1 mt-1" dir="ltr">
              {parseFloat(forecast.expenseGrowthRate) >= 0 ? (
                <><TrendingUp className="w-3 h-3" /> +{forecast.expenseGrowthRate}%</>
              ) : (
                <><TrendingDown className="w-3 h-3" /> -{Math.abs(parseFloat(forecast.expenseGrowthRate))}%</>
              )}
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">ממוצע חיסכון</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{forecast.avgSavings.toLocaleString()}
            </div>
          </div>

          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400">צבירה צפויה</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{forecast.currentBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => `₪${value.toLocaleString()}`}
                labelStyle={{ color: '#000' }}
              />
              <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="projectedIncome" 
                stroke="#10b981" 
                name="הכנסות צפויות"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="projectedExpenses" 
                stroke="#ef4444" 
                name="הוצאות צפויות"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="cumulativeBalance" 
                stroke="#8b5cf6" 
                name="מאזן מצטבר"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          תחזית מבוססת על ניתוח {months} חודשים אחרונים ומגמות היסטוריות
        </div>
      </CardContent>
    </Card>
  );
}