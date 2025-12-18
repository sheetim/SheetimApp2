import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function ScenarioComparison({ baseScenario, scenarios }) {
  if (!baseScenario || !scenarios || scenarios.length === 0) return null;

  const comparisonData = [
    {
      name: 'תרחיש בסיס',
      'חיסכון בפרישה': baseScenario.totalSavingsAtRetirement,
      'חיסכון נדרש': baseScenario.requiredSavings,
      color: '#6b7280'
    },
    ...scenarios.map((scenario, idx) => ({
      name: scenario.name,
      'חיסכון בפרישה': scenario.results.totalSavingsAtRetirement,
      'חיסכון נדרש': scenario.results.requiredSavings,
      color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][idx % 4]
    }))
  ];

  const timelineData = [];
  const maxYears = Math.max(
    baseScenario.yearsToRetirement,
    ...scenarios.map(s => s.results.yearsToRetirement)
  );

  for (let year = 0; year <= maxYears; year++) {
    const dataPoint = { year };
    
    if (year <= baseScenario.yearsToRetirement) {
      dataPoint['תרחיש בסיס'] = baseScenario.projectionData[year]?.חיסכון || 0;
    }
    
    scenarios.forEach((scenario, idx) => {
      if (year <= scenario.results.yearsToRetirement) {
        dataPoint[scenario.name] = scenario.results.projectionData[year]?.חיסכון || 0;
      }
    });
    
    timelineData.push(dataPoint);
  }

  const getBestScenario = () => {
    let best = { name: 'תרחיש בסיס', ...baseScenario };
    
    scenarios.forEach(scenario => {
      if (scenario.results.totalSavingsAtRetirement > best.totalSavingsAtRetirement) {
        best = { name: scenario.name, ...scenario.results };
      }
    });
    
    return best;
  };

  const bestScenario = getBestScenario();

  return (
    <div className="space-y-6">
      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            תרחיש מומלץ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{bestScenario.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">מניב את התוצאות הטובות ביותר</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">חיסכון צפוי</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ₪{bestScenario.totalSavingsAtRetirement.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">עודף/חסר</p>
              <p className={`text-xl font-bold ${
                bestScenario.isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {bestScenario.isOnTrack ? '+' : '-'}₪{bestScenario.shortfall.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold dark:text-white">השוואת תרחישים</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {/* Mobile: Card-based view */}
          <div className="space-y-2 md:hidden">
            {comparisonData.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{item.name}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">חיסכון צפוי:</span>
                  <span className="font-bold text-green-600">₪{item['חיסכון בפרישה']?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">נדרש:</span>
                  <span className="font-bold text-red-600">₪{item['חיסכון נדרש']?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop: Chart view */}
          <div className="hidden md:block">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fontSize: 10 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    direction: 'rtl'
                  }}
                  formatter={(value) => `₪${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="חיסכון בפרישה" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="חיסכון נדרש" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold dark:text-white">מסלול צבירה לאורך זמן</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  direction: 'rtl',
                  fontSize: '12px'
                }}
                formatter={(value) => `₪${value.toLocaleString()}`}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="תרחיש בסיס" 
                stroke="#6b7280" 
                strokeWidth={2}
                dot={false}
              />
              {scenarios.map((scenario, idx) => (
                <Line 
                  key={scenario.name}
                  type="monotone" 
                  dataKey={scenario.name} 
                  stroke={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][idx % 4]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario, idx) => (
          <Card 
            key={scenario.name}
            className="md-card md-elevation-2 border-0 dark:bg-gray-800"
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between dark:text-white">
                <span>{scenario.name}</span>
                {scenario.results.isOnTrack ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    בדרך הנכונה
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    דורש התאמה
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">הפקדה חודשית:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₪{scenario.monthlyContribution.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">תשואה שנתית:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{scenario.expectedReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">גיל פרישה:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{scenario.retirementAge}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">חיסכון צפוי:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ₪{scenario.results.totalSavingsAtRetirement.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {scenario.results.isOnTrack ? 'עודף:' : 'חסר:'}
                  </span>
                  <span className={`text-lg font-bold ${
                    scenario.results.isOnTrack 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    ₪{scenario.results.shortfall.toLocaleString()}
                  </span>
                </div>
              </div>

              {scenario.comparison && (
                <div className={`p-3 rounded-lg ${
                  scenario.comparison.better 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center gap-2 text-sm">
                    {scenario.comparison.better ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className={
                      scenario.comparison.better 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }>
                      {scenario.comparison.better ? '+' : ''}
                      ₪{scenario.comparison.difference.toLocaleString()} לעומת תרחיש הבסיס
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}