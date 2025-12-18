import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { AIService } from "../ai/AIService";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function FinancialPlanGenerator() {
  const [age, setAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('67');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const handleGenerate = async () => {
    if (!age) return;

    setIsGenerating(true);
    
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthTransactions = transactions.filter(t => 
      t.date && t.date.startsWith(currentMonth)
    );

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);

    const userData = {
      age: parseInt(age),
      retirementAge: parseInt(retirementAge),
      currentIncome: totalIncome,
      currentExpenses: totalExpenses,
      currentSavings: totalSavings,
      currentDebt: totalDebt,
      goals: savingsGoals.map(g => ({
        name: g.name,
        target_amount: g.target_amount,
        target_date: g.target_date
      }))
    };

    const generatedPlan = await AIService.generateLongTermPlan(userData);
    setPlan(generatedPlan);
    setIsGenerating(false);
  };

  return (
    <Card className="md-card md-elevation-2 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          תוכנית פיננסית אישית
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!plan ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">גיל נוכחי</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retirementAge">גיל פרישה</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                  placeholder="67"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!age || isGenerating}
              className="w-full md-ripple bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייצר תוכנית...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור תוכנית פיננסית
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              התוכנית תיווצר בהתבסס על הנתונים הפיננסיים שלך
            </p>
          </>
        ) : (
          <>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-900 dark:text-white text-sm leading-relaxed">
                  {plan}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setPlan(null)}
              variant="outline"
              className="w-full"
            >
              צור תוכנית חדשה
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}