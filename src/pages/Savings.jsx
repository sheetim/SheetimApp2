import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Target } from "lucide-react";
import SavingsGoalForm from "../components/savings/SavingsGoalForm";
import SavingsGoalCard from "../components/savings/SavingsGoalCard";
import { useToast } from "@/components/ui/use-toast";
import { exportSavingsGoalsToCSV } from "../components/utils/exportHelpers";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import { ListLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function SavingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SavingsGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setShowForm(false);
      setEditingGoal(null);
      toast({
        title: "🎯 יעד חיסכון נוסף",
        description: "היעד החדש נשמר במערכת",
        variant: "success",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavingsGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      setShowForm(false);
      setEditingGoal(null);
      toast({
        title: "✅ יעד עודכן",
        description: "השינויים נשמרו בהצלחה",
        variant: "success",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavingsGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      toast({
        title: "🗑️ יעד נמחק",
        description: "היעד הוסר מהמערכת",
        variant: "success",
      });
    },
  });

  const handleSubmit = (data) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);

  const handleExport = () => {
    exportSavingsGoalsToCSV(goals);
    toast({
      title: "📥 קובץ יוצא",
      description: "יעדי החיסכון יוצאו בהצלחה",
      variant: "success",
    });
  };

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="יעדי חיסכון" 
        icon={Target}
        pageName="Savings"
      >
        <div className="flex gap-2">
          {goals.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm" className="h-9 sm:h-10">
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => { setEditingGoal(null); setShowForm(!showForm); }} size="sm" className="h-9 sm:h-10 bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 sm:ml-1" />
            <span className="hidden sm:inline">יעד חדש</span>
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">סה״כ נחסך</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalSaved.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-400 to-teal-600" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 dark:bg-teal-900/40 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">יעד כולל</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">₪{totalTarget.toLocaleString()}</p>
                {totalTarget > 0 && <p className="text-[10px] sm:text-xs text-teal-600">{((totalSaved / totalTarget) * 100).toFixed(0)}% הושג</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingGoal ? 'עריכת יעד חיסכון' : 'יעד חיסכון חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <SavingsGoalForm goal={editingGoal} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingGoal(null); }} />
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {isLoading ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <ListLoadingSkeleton count={3} />
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <EmptyState 
              icon={Target} 
              title="אין יעדי חיסכון" 
              description="הגדר יעדי חיסכון ועקוב אחרי ההתקדמות שלך." 
              actionLabel="הגדר יעד חיסכון" 
              onAction={() => setShowForm(true)} 
              illustration="savings" 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((goal) => (
            <SavingsGoalCard key={goal.id} goal={goal} onEdit={() => handleEdit(goal)} onDelete={() => deleteMutation.mutate(goal.id)} onUpdateAmount={(newAmount) => updateMutation.mutate({ id: goal.id, data: { ...goal, current_amount: newAmount } })} />
          ))}
        </div>
      )}
    </div>
  );
}