import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Calendar } from "lucide-react";
import { format, subMonths } from "date-fns";
import { he } from "date-fns/locale";

export default function PerformanceAnalysis({ investments }) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");

  // חישוב ביצועים לכל השקעה
  const investmentPerformance = investments.map(inv => {
    const totalValue = (inv.quantity || 0) * (inv.current_price || 0);
    const totalCost = (inv.quantity || 0) * (inv.purchase_price || 0);
    const profit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const dividendYield = totalCost > 0 ? ((inv.dividends || 0) / totalCost) * 100 : 0;

    return {
      name: inv.name,
      symbol: inv.symbol || '',
      type: inv.type,
      totalValue,
      totalCost,
      profit,
      profitPercent,
      dividends: inv.dividends || 0,
      dividendYield,
      quantity: inv.quantity || 0,
      currentPrice: inv.current_price || 0,
      purchasePrice: inv.purchase_price || 0,
      purchaseDate: inv.purchase_date,
    };
  });

  // נתוני התפלגות לפי סוג נכס
  const assetAllocation = investments.reduce((acc, inv) => {
    const type = inv.type || 'אחר';
    const value = (inv.quantity || 0) * (inv.current_price || 0);
    acc[type] = (acc[type] || 0) + value;
    return acc;
  }, {});

  const allocationData = Object.entries(assetAllocation).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
    percent: ((value / investmentPerformance.reduce((sum, inv) => sum + inv.totalValue, 0)) * 100).toFixed(1)
  }));

  // צבעים לגרפים
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // נתוני ביצועים לגרף
  const performanceData = investmentPerformance
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .map(inv => ({
      name: inv.symbol || inv.name.substring(0, 10),
      'רווח/הפסד': inv.profit,
      'אחוז': inv.profitPercent,
    }));

  // חישוב סטטיסטיקות
  const totalPortfolioValue = investmentPerformance.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalInvested = investmentPerformance.reduce((sum, inv) => sum + inv.totalCost, 0);
  const totalProfit = totalPortfolioValue - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const totalDividends = investmentPerformance.reduce((sum, inv) => sum + inv.dividends, 0);
  const avgDividendYield = investments.length > 0 
    ? investmentPerformance.reduce((sum, inv) => sum + inv.dividendYield, 0) / investments.length 
    : 0;

  const bestPerformer = investmentPerformance.reduce((best, inv) => 
    inv.profitPercent > (best?.profitPercent || -Infinity) ? inv : best, null
  );

  const worstPerformer = investmentPerformance.reduce((worst, inv) => 
    inv.profitPercent < (worst?.profitPercent || Infinity) ? inv : worst, null
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="md-card md-elevation-2 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">תשואה כוללת</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ₪{Math.abs(totalProfit).toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                totalProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md-card md-elevation-2 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">דיבידנדים כולל</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₪{totalDividends.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  תשואה: {avgDividendYield.toFixed(2)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md-card md-elevation-2 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">הביצוע הטוב ביותר</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {bestPerformer?.name || '-'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +{bestPerformer?.profitPercent.toFixed(2)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md-card md-elevation-2 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">הביצוע החלש ביותר</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {worstPerformer?.name || '-'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {worstPerformer?.profitPercent.toFixed(2)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="performance">ביצועים</TabsTrigger>
          <TabsTrigger value="allocation">התפלגות נכסים</TabsTrigger>
          <TabsTrigger value="details">פירוט מלא</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">השוואת ביצועים בין נכסים</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      className="dark:text-gray-300"
                    />
                    <YAxis className="dark:text-gray-300" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        direction: 'rtl'
                      }}
                      formatter={(value, name) => {
                        if (name === 'רווח/הפסד') return `₪${value.toLocaleString()}`;
                        return `${value.toFixed(2)}%`;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="אחוז" fill="#3b82f6" name="אחוז רווח/הפסד" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  אין נתוני ביצועים להצגה
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">התפלגות נכסים לפי סוג</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allocationData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${percent}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => `₪${value.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {allocationData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">₪{item.value.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.percent}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    אין נתוני התפלגות להצגה
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">ניתוח מפורט לכל נכס</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">נכס</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">סוג</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">כמות</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">מחיר רכישה</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">מחיר נוכחי</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">שווי כולל</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">רווח/הפסד</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">תשואה %</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">דיבידנדים</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {investmentPerformance.map((inv, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{inv.name}</p>
                            {inv.symbol && <p className="text-xs text-gray-500 dark:text-gray-400">{inv.symbol}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.type?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.quantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₪{inv.purchasePrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₪{inv.currentPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₪{inv.totalValue.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-semibold ${inv.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.profit >= 0 ? '+' : ''}₪{inv.profit.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${inv.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.profitPercent >= 0 ? '+' : ''}{inv.profitPercent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400 font-medium">
                          ₪{inv.dividends.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-right text-gray-900 dark:text-white">סה"כ</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">₪{totalPortfolioValue.toLocaleString()}</td>
                      <td className={`px-4 py-3 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalProfit >= 0 ? '+' : ''}₪{totalProfit.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 ${totalProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">₪{totalDividends.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}