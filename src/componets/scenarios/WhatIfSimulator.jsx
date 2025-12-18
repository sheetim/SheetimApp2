import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, TrendingUp, TrendingDown, PiggyBank, 
  CreditCard, ArrowRight, Sparkles, RotateCcw,
  Target, Clock, Wallet
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatIfSimulator({ 
  currentIncome = 0, 
  currentExpenses = 0,
  currentSavings = 0,
  currentDebt = 0,
  savingsGoals = [],
  debts = []
}) {
  const [scenario, setScenario] = useState({
    incomeChange: 0,
    expenseChange: 0,
    extraSavings: 0,
    extraDebtPayment: 0
  });
  const [months, setMonths] = useState(12);

  const resetScenario = () => {
    setScenario({
      incomeChange: 0,
      expenseChange: 0,
      extraSavings: 0,
      extraDebtPayment: 0
    });
  };

  // Calculate projections
  const projections = useMemo(() => {
    const newIncome = currentIncome * (1 + scenario.incomeChange / 100);
    const newExpenses = currentExpenses * (1 - scenario.expenseChange / 100);
    const monthlySavings = newIncome - newExpenses + scenario.extraSavings;
    
    const data = [];
    let cumulativeSavings = currentSavings;
    let remainingDebt = currentDebt;
    
    for (let i = 0; i <= months; i++) {
      // Apply extra debt payment first
      const debtPayment = Math.min(remainingDebt, scenario.extraDebtPayment);
      remainingDebt = Math.max(0, remainingDebt - debtPayment);
      
      // Then add to savings
      cumulativeSavings += (monthlySavings - debtPayment);
      
      data.push({
        month: i,
        label: i === 0 ? 'היום' : `חודש ${i}`,
        savings: Math.round(cumulativeSavings),
        debt: Math.round(remainingDebt),
        netWorth: Math.round(cumulativeSavings - remainingDebt)
      });
    }
    
    return data;
  }, [scenario, months, currentIncome, currentExpenses, currentSavings, currentDebt]);

  // Calculate impact summary
  const impact = useMemo(() => {
    const newIncome = currentIncome * (1 + scenario.incomeChange / 100);
    const newExpenses = currentExpenses * (1 - scenario.expenseChange / 100);
    const currentMonthlySavings = currentIncome - currentExpenses;
    const newMonthlySavings = newIncome - newExpenses + scenario.extraSavings - scenario.extraDebtPayment;
    
    const improvementPercent = currentMonthlySavings > 0 
      ? ((newMonthlySavings - currentMonthlySavings) / currentMonthlySavings * 100)
      : 0;
    
    const yearlySavingsChange = (newMonthlySavings - currentMonthlySavings) * 12;
    
    // Time to goals
    const goalTimelines = savingsGoals.map(goal => {
      const remaining = goal.target_amount - goal.current_amount;
      const currentMonths = currentMonthlySavings > 0 ? Math.ceil(remaining / currentMonthlySavings) : Infinity;
      const newMonths = newMonthlySavings > 0 ? Math.ceil(remaining / newMonthlySavings) : Infinity;
      return {
        name: goal.name,
        currentMonths,
        newMonths,
        savedMonths: currentMonths - newMonths
      };
    });
    
    // Debt payoff time
    const totalMonthlyDebtPayment = debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0);
    const newDebtPayment = totalMonthlyDebtPayment + scenario.extraDebtPayment;
    const currentDebtPayoffMonths = totalMonthlyDebtPayment > 0 ? Math.ceil(currentDebt / totalMonthlyDebtPayment) : Infinity;
    const newDebtPayoffMonths = newDebtPayment > 0 ? Math.ceil(currentDebt / newDebtPayment) : Infinity;
    
    return {
      currentMonthlySavings,
      newMonthlySavings,
      improvementPercent,
      yearlySavingsChange,
      goalTimelines,
      currentDebtPayoffMonths,
      newDebtPayoffMonths,
      debtMonthsSaved: currentDebtPayoffMonths - newDebtPayoffMonths
    };
  }, [scenario, currentIncome, currentExpenses, currentDebt, savingsGoals, debts]);

  const formatNumber = (num) => {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-slate-800">
      <CardHeader className="pb-3 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            סימולטור "מה אם"
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetScenario}
            className="h-9 text-xs w-full sm:w-auto"
          >
            <RotateCcw className="w-3 h-3 ml-1" />
            איפוס
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          בדוק איך שינויים בהכנסות והוצאות ישפיעו על העתיד הפיננסי שלך
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6">
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="income" className="text-xs py-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30">הכנסות</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs py-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-900/30">הוצאות</TabsTrigger>
            <TabsTrigger value="savings" className="text-xs py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30">חיסכון</TabsTrigger>
            <TabsTrigger value="debt" className="text-xs py-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 dark:data-[state=active]:bg-orange-900/30">חובות</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">שינוי בהכנסות</span>
                </div>
                <Badge className={scenario.incomeChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {scenario.incomeChange >= 0 ? '+' : ''}{scenario.incomeChange}%
                </Badge>
              </div>
              <div className="mb-4">
                <Slider
                  value={[scenario.incomeChange]}
                  onValueChange={(val) => setScenario({ ...scenario, incomeChange: val[0] })}
                  min={-30}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">הכנסה נוכחית:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">₪{currentIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">הכנסה חדשה:</span>
                  <span className="text-sm font-bold text-green-600">₪{Math.round(currentIncome * (1 + scenario.incomeChange / 100)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">קיצוץ הוצאות</span>
                </div>
                <Badge className="bg-green-100 text-green-700 w-fit">
                  -{scenario.expenseChange}%
                </Badge>
              </div>
              <div className="mb-4">
                <Slider
                  value={[scenario.expenseChange]}
                  onValueChange={(val) => setScenario({ ...scenario, expenseChange: val[0] })}
                  min={0}
                  max={40}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">הוצאות נוכחיות:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">₪{currentExpenses.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">הוצאות חדשות:</span>
                  <span className="text-sm font-bold text-green-600">₪{Math.round(currentExpenses * (1 - scenario.expenseChange / 100)).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400">חיסכון חודשי:</span>
                  <span className="text-sm font-bold text-blue-600">₪{Math.round(currentExpenses * (scenario.expenseChange / 100)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="savings" className="mt-4 space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">חיסכון נוסף חודשי</span>
                </div>
                <Badge className="bg-blue-100 text-blue-700 w-fit">
                  +₪{scenario.extraSavings.toLocaleString()}
                </Badge>
              </div>
              <div className="mb-4">
                <Slider
                  value={[scenario.extraSavings]}
                  onValueChange={(val) => setScenario({ ...scenario, extraSavings: val[0] })}
                  min={0}
                  max={5000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2">
                  <span>₪0</span>
                  <span>₪2,500</span>
                  <span>₪5,000</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">צבירה שנתית:</span>
                  <span className="text-sm font-bold text-blue-600">₪{(scenario.extraSavings * 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="debt" className="mt-4 space-y-3">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">תשלום נוסף חודשי</span>
                </div>
                <Badge className="bg-orange-100 text-orange-700 w-fit">
                  +₪{scenario.extraDebtPayment.toLocaleString()}
                </Badge>
              </div>
              <div className="mb-4">
                <Slider
                  value={[scenario.extraDebtPayment]}
                  onValueChange={(val) => setScenario({ ...scenario, extraDebtPayment: val[0] })}
                  min={0}
                  max={3000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2">
                  <span>₪0</span>
                  <span>₪1,500</span>
                  <span>₪3,000</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">תשלום שנתי נוסף:</span>
                  <span className="text-sm font-bold text-orange-600">₪{(scenario.extraDebtPayment * 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Projection Period */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">תקופת תחזית:</span>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            {[6, 12, 24, 36].map(m => (
              <Button
                key={m}
                variant={months === m ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs flex-1 sm:flex-none"
                onClick={() => setMonths(m)}
              >
                {m} חודשים
              </Button>
            ))}
          </div>
        </div>

        {/* Impact Summary */}
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(scenario)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">חיסכון חודשי חדש</p>
              <p className="text-lg font-bold text-green-600">
                ₪{formatNumber(impact.newMonthlySavings)}
              </p>
              {impact.improvementPercent !== 0 && (
                <Badge className={impact.improvementPercent > 0 ? "bg-green-100 text-green-700 text-[10px]" : "bg-red-100 text-red-700 text-[10px]"}>
                  {impact.improvementPercent > 0 ? '+' : ''}{impact.improvementPercent.toFixed(0)}%
                </Badge>
              )}
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">חיסכון שנתי נוסף</p>
              <p className="text-lg font-bold text-blue-600">
                {impact.yearlySavingsChange >= 0 ? '+' : ''}₪{formatNumber(impact.yearlySavingsChange)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">תחזית לאורך זמן</h4>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₪${formatNumber(v)}`} width={50} />
                <Tooltip 
                  formatter={(value, name) => [`₪${value.toLocaleString()}`, name]}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    direction: 'rtl',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#10b981" 
                  fill="url(#colorSavings)"
                  name="חסכונות"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#6366f1" 
                  fill="url(#colorNetWorth)"
                  name="שווי נקי"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Impact */}
        {impact.goalTimelines.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              השפעה על יעדי חיסכון
            </h4>
            {impact.goalTimelines.slice(0, 2).map((goal, idx) => (
              <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{goal.name}</span>
                  {goal.savedMonths > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                      ⚡ -{goal.savedMonths} חודשים
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">זמן נוכחי:</span>
                  <span className="font-medium line-through text-gray-400">{goal.currentMonths} חודשים</span>
                  <ArrowRight className="w-3 h-3 text-purple-500 mx-1" />
                  <span className="font-bold text-purple-600">{goal.newMonths} חודשים</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debt Impact */}
        {currentDebt > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">זמן פירעון חובות</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 rounded-lg p-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">זמן נוכחי:</span>
                <span className="text-xs font-medium line-through text-gray-400">{impact.currentDebtPayoffMonths} חודשים</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800/50 rounded-lg p-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">זמן חדש:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-600">{impact.newDebtPayoffMonths} חודשים</span>
                  {impact.debtMonthsSaved > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                      ⚡ -{impact.debtMonthsSaved}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}