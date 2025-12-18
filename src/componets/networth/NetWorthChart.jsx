import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function NetWorthChart({ currentNetWorth, totalAssets, totalInvestments, totalLiabilities }) {
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ['netWorthHistory'],
    queryFn: () => base44.entities.NetWorthHistory.list('-date'),
    initialData: [],
  });

  const createHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.NetWorthHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['netWorthHistory'] });
    },
  });

  const recordCurrentValue = () => {
    createHistoryMutation.mutate({
      date: format(new Date(), 'yyyy-MM-dd'),
      total_assets: totalAssets,
      total_investments: totalInvestments,
      total_savings: 0,
      total_liabilities: totalLiabilities,
      net_worth: currentNetWorth
    });
  };

  const chartData = history.map(h => ({
    date: format(new Date(h.date), 'dd MMM', { locale: he }),
    'שווי נקי': h.net_worth,
    'נכסים': h.total_assets || 0,
    'השקעות': h.total_investments || 0,
    'חובות': -(h.total_liabilities || 0)
  }));

  const trend = history.length >= 2 
    ? ((history[0].net_worth - history[history.length - 1].net_worth) / history[history.length - 1].net_worth) * 100 
    : 0;

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              מעקב שווי נקי לאורך זמן
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {history.length} נקודות מעקב
              {trend !== 0 && (
                <span className={`mr-2 font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={recordCurrentValue}
            disabled={createHistoryMutation.isPending}
            className="md-ripple"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${createHistoryMutation.isPending ? 'animate-spin' : ''}`} />
            רשום נקודה
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => `₪${value.toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="שווי נקי" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="נכסים" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="השקעות" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="חובות" 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-center">אין נתוני היסטוריה</p>
            <p className="text-sm text-center mt-1">לחץ על "רשום נקודה" כדי להתחיל מעקב</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}