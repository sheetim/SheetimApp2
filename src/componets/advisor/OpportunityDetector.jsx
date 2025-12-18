import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIService } from "../ai/AIService";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function OpportunityDetector() {
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
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

  const loadOpportunities = async () => {
    setIsLoading(true);
    const detected = await AIService.detectFinancialOpportunities({
      transactions,
      budgets,
      investments,
      savingsGoals,
      debts
    });
    setOpportunities(detected);
    setIsLoading(false);
  };

  useEffect(() => {
    if (transactions.length > 0) {
      loadOpportunities();
    }
  }, [transactions, budgets, investments, savingsGoals, debts]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'cost_reduction': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'investment': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'debt_optimization': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'budget_reallocation': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tax_optimization': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'גבוה': return 'bg-red-500';
      case 'בינוני': return 'bg-yellow-500';
      case 'נמוך': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            הזדמנויות פיננסיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md-card md-elevation-2 dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          הזדמנויות שזוהו
          <Badge variant="secondary">{opportunities.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={loadOpportunities}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            לא זוהו הזדמנויות כרגע
          </div>
        ) : (
          opportunities.map((opp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`w-1 h-full rounded-full ${getPriorityColor(opp.priority)}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {opp.title}
                    </h4>
                    <Badge className={getTypeColor(opp.type)}>
                      {opp.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {opp.action}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        ₪{opp.potential.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {opp.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}