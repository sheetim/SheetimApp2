import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign, Calendar, Sparkles, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ScenarioComparison from "../components/retirement/ScenarioComparison";

export default function RetirementPage() {
  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('65');
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('5');
  const [monthlyExpenseInRetirement, setMonthlyExpenseInRetirement] = useState('');
  const [inflationRate, setInflationRate] = useState('2');
  
  const [results, setResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);

  const calculateRetirement = () => {
    const age = parseFloat(currentAge);
    const retAge = parseFloat(retirementAge);
    const lifeExp = parseFloat(lifeExpectancy);
    const savings = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const returnRate = parseFloat(expectedReturn) / 100;
    const monthlyExpense = parseFloat(monthlyExpenseInRetirement) || 0;
    const inflation = parseFloat(inflationRate) / 100;

    const yearsToRetirement = retAge - age;
    const yearsInRetirement = lifeExp - retAge;
    const monthsToRetirement = yearsToRetirement * 12;

    // Calculate future value of current savings
    const futureValueOfSavings = savings * Math.pow(1 + returnRate, yearsToRetirement);

    // Calculate future value of monthly contributions
    const monthlyRate = returnRate / 12;
    const futureValueOfContributions = monthly * 
      ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate) * 
      (1 + monthlyRate);

    const totalSavingsAtRetirement = futureValueOfSavings + futureValueOfContributions;

    // Calculate required savings considering inflation
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflation, yearsToRetirement);
    const requiredSavings = adjustedMonthlyExpense * 12 * yearsInRetirement;

    // Calculate if there's a shortfall
    const shortfall = requiredSavings - totalSavingsAtRetirement;
    const isOnTrack = shortfall <= 0;

    // Generate projection data
    const projectionData = [];
    for (let year = 0; year <= yearsToRetirement; year++) {
      const currentSavingsValue = savings * Math.pow(1 + returnRate, year);
      const contributionValue = monthly * 12 * year * Math.pow(1 + returnRate, year / 2);
      projectionData.push({
        year: age + year,
        חיסכון: Math.round(currentSavingsValue + contributionValue)
      });
    }

    const baseResults = {
      totalSavingsAtRetirement: Math.round(totalSavingsAtRetirement),
      requiredSavings: Math.round(requiredSavings),
      shortfall: Math.round(Math.abs(shortfall)),
      isOnTrack,
      yearsToRetirement,
      yearsInRetirement,
      monthlyExpenseAtRetirement: Math.round(adjustedMonthlyExpense),
      projectionData
    };

    setResults(baseResults);
    generateScenarios(baseResults);
  };

  const calculateScenario = (params) => {
    const age = parseFloat(currentAge);
    const retAge = parseFloat(params.retirementAge);
    const lifeExp = parseFloat(lifeExpectancy);
    const savings = parseFloat(currentSavings) || 0;
    const monthly = parseFloat(params.monthlyContribution);
    const returnRate = parseFloat(params.expectedReturn) / 100;
    const monthlyExpense = parseFloat(monthlyExpenseInRetirement) || 0;
    const inflation = parseFloat(inflationRate) / 100;

    const yearsToRetirement = retAge - age;
    const yearsInRetirement = lifeExp - retAge;
    const monthsToRetirement = yearsToRetirement * 12;

    const futureValueOfSavings = savings * Math.pow(1 + returnRate, yearsToRetirement);
    const monthlyRate = returnRate / 12;
    const futureValueOfContributions = monthly * 
      ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate) * 
      (1 + monthlyRate);

    const totalSavingsAtRetirement = futureValueOfSavings + futureValueOfContributions;
    const adjustedMonthlyExpense = monthlyExpense * Math.pow(1 + inflation, yearsToRetirement);
    const requiredSavings = adjustedMonthlyExpense * 12 * yearsInRetirement;
    const shortfall = requiredSavings - totalSavingsAtRetirement;
    const isOnTrack = shortfall <= 0;

    const projectionData = [];
    for (let year = 0; year <= yearsToRetirement; year++) {
      const currentSavingsValue = savings * Math.pow(1 + returnRate, year);
      const contributionValue = monthly * 12 * year * Math.pow(1 + returnRate, year / 2);
      projectionData.push({
        year: age + year,
        חיסכון: Math.round(currentSavingsValue + contributionValue)
      });
    }

    return {
      totalSavingsAtRetirement: Math.round(totalSavingsAtRetirement),
      requiredSavings: Math.round(requiredSavings),
      shortfall: Math.round(Math.abs(shortfall)),
      isOnTrack,
      yearsToRetirement,
      yearsInRetirement,
      monthlyExpenseAtRetirement: Math.round(adjustedMonthlyExpense),
      projectionData
    };
  };

  const generateScenarios = (baseResults) => {
    const baseMonthly = parseFloat(monthlyContribution) || 0;
    const baseReturn = parseFloat(expectedReturn);
    const baseRetAge = parseFloat(retirementAge);

    const scenariosList = [
      {
        name: 'חיסכון מוגבר +30%',
        description: 'הגדלת הפקדה חודשית ב-30%',
        monthlyContribution: Math.round(baseMonthly * 1.3),
        expectedReturn: baseReturn,
        retirementAge: baseRetAge
      },
      {
        name: 'השקעה אגרסיבית',
        description: 'תשואה גבוהה יותר +2%',
        monthlyContribution: baseMonthly,
        expectedReturn: baseReturn + 2,
        retirementAge: baseRetAge
      },
      {
        name: 'דחיית פרישה 3 שנים',
        description: 'פרישה בגיל מאוחר יותר',
        monthlyContribution: baseMonthly,
        expectedReturn: baseReturn,
        retirementAge: baseRetAge + 3
      },
      {
        name: 'תרחיש מאוזן',
        description: 'חיסכון +15%, תשואה +1%, דחייה +1.5 שנה',
        monthlyContribution: Math.round(baseMonthly * 1.15),
        expectedReturn: baseReturn + 1,
        retirementAge: Math.round(baseRetAge + 1.5)
      }
    ];

    const calculatedScenarios = scenariosList.map(scenario => {
      const results = calculateScenario(scenario);
      return {
        ...scenario,
        results,
        comparison: {
          difference: results.totalSavingsAtRetirement - baseResults.totalSavingsAtRetirement,
          better: results.totalSavingsAtRetirement > baseResults.totalSavingsAtRetirement
        }
      };
    });

    setScenarios(calculatedScenarios);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-600" />
            סימולטור פרישה
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">תכנן את פרישתך והשווה תרחישים</p>
        </div>
        {results && (
          <Badge className="bg-purple-600 text-white text-xs">
            <Sparkles className="w-3 h-3 ml-1" />{scenarios.length} תרחישים
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calculator Form */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Calculator className="w-4 h-4" />פרטי החישוב
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px] text-gray-500">גיל נוכחי</Label><Input type="number" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} placeholder="30" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">גיל פרישה</Label><Input type="number" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} placeholder="65" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">תוחלת חיים</Label><Input type="number" value={lifeExpectancy} onChange={(e) => setLifeExpectancy(e.target.value)} placeholder="85" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">חיסכון נוכחי (₪)</Label><Input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder="500,000" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">הפקדה חודשית (₪)</Label><Input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder="5,000" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">תשואה שנתית (%)</Label><Input type="number" step="0.1" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} placeholder="5" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">הוצאה בפרישה (₪)</Label><Input type="number" value={monthlyExpenseInRetirement} onChange={(e) => setMonthlyExpenseInRetirement(e.target.value)} placeholder="15,000" className="h-9 text-sm" /></div>
              <div><Label className="text-[10px] text-gray-500">אינפלציה (%)</Label><Input type="number" step="0.1" value={inflationRate} onChange={(e) => setInflationRate(e.target.value)} placeholder="2" className="h-9 text-sm" /></div>
            </div>
            <Button onClick={calculateRetirement} className="w-full h-10 bg-amber-600 hover:bg-amber-700" disabled={!currentAge || !monthlyExpenseInRetirement}>
              <Calculator className="w-4 h-4 ml-2" />חשב
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${results.isOnTrack ? 'border-green-200' : 'border-orange-200'}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {results.isOnTrack ? (
                  <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-green-700">בדרך הנכונה! 🎉</span></>
                ) : (
                  <><DollarSign className="w-4 h-4 text-orange-600" /><span className="text-orange-700">נדרשת התאמה</span></>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-[10px] text-gray-500">חיסכון צפוי</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white" dir="ltr">₪{results.totalSavingsAtRetirement.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-[10px] text-gray-500">חיסכון נדרש</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white" dir="ltr">₪{results.requiredSavings.toLocaleString()}</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-[10px] text-gray-500">שנים לפרישה</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{results.yearsToRetirement}</p>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-[10px] text-gray-500">שנות פרישה</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{results.yearsInRetirement}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${results.isOnTrack ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">{results.isOnTrack ? 'עודף' : 'חסר'}</p>
                <p className={`text-lg font-bold ${results.isOnTrack ? 'text-green-600' : 'text-orange-600'}`} dir="ltr">₪{results.shortfall.toLocaleString()}</p>
              </div>

              {!results.isOnTrack && (
                <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">💡 המלצות:</p>
                  <ul className="text-[10px] text-gray-600 dark:text-gray-400 space-y-0.5 list-disc list-inside">
                    <li>הגדל הפקדה חודשית</li>
                    <li>דחה גיל פרישה</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Projection Chart */}
      {results && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">תחזית חיסכון</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={results.projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} width={35} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl', fontSize: '12px' }} formatter={(value) => `₪${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="חיסכון" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Scenario Comparison */}
      {results && scenarios.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              השוואת תרחישים
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              גלה איך שינויים שונים ישפיעו על החיסכון שלך בפרישה
            </p>
          </div>
          <ScenarioComparison 
            baseScenario={results} 
            scenarios={scenarios}
          />
        </div>
      )}
    </div>
  );
}