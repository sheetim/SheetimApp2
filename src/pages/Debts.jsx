import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, Download, CreditCard, Minus } from "lucide-react";
import DebtForm from "../components/debts/DebtForm";
import DebtCard from "../components/debts/DebtCard";
import DebtCalculator from "../components/debts/DebtCalculator";
import { useToast } from "@/components/ui/use-toast";
import { exportDebtsToCSV } from "../components/utils/exportHelpers";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import { ListLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function DebtsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Debt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowForm(false);
      setEditingDebt(null);
      toast({
        title: "💳 חוב נוסף",
        description: "החוב נרשם במערכת",
        variant: "success",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Debt.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setShowForm(false);
      setEditingDebt(null);
      toast({
        title: "✅ חוב עודכן",
        description: "השינויים נשמרו בהצלחה",
        variant: "success",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Debt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast({
        title: "🎉 חוב נמחק",
        description: "החוב הוסר מהמערכת",
        variant: "success",
      });
    },
  });

  const handleSubmit = (data) => {
    if (editingDebt) {
      updateMutation.mutate({ id: editingDebt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setShowForm(true);
  };

  const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  const handleExport = () => {
    exportDebtsToCSV(debts);
    toast({
      title: "📥 קובץ יוצא",
      description: "החובות יוצאו בהצלחה",
      variant: "success",
    });
  };

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="ניהול חובות" 
        icon={Minus}
        pageName="Debts"
      >
        <div className="flex gap-2">
          {debts.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm" className="h-10">
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => setShowCalculator(!showCalculator)} variant="outline" size="sm" className="h-10">
            <Calculator className="w-4 h-4 ml-1" />
            <span className="hidden sm:inline">מחשבון</span>
          </Button>
          <Button onClick={() => { setEditingDebt(null); setShowForm(!showForm); }} size="sm" className="h-10 bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 ml-2" />
            חוב חדש
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/40 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">סך החובות</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">₪{totalDebt.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">{debts.length} חובות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">תשלום חודשי</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">₪{totalMonthlyPayment.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator */}
      {showCalculator && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">מחשבון חובות</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <DebtCalculator onAddDebt={(debt) => { createMutation.mutate(debt); setShowCalculator(false); }} />
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingDebt ? 'עריכת חוב' : 'חוב חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <DebtForm debt={editingDebt} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingDebt(null); }} />
          </CardContent>
        </Card>
      )}

      {/* Debts List */}
      {isLoading ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <ListLoadingSkeleton count={3} />
          </CardContent>
        </Card>
      ) : debts.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <EmptyState 
              icon={CreditCard} 
              title="אין חובות במעקב" 
              description="אם יש לך הלוואות או חובות, הוסף אותם כדי לתכנן איך לסיים אותם." 
              actionLabel="הוסף חוב" 
              onAction={() => setShowForm(true)} 
              illustration="financial" 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {debts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} onEdit={() => handleEdit(debt)} onDelete={() => deleteMutation.mutate(debt.id)} onUpdateBalance={(newBalance) => updateMutation.mutate({ id: debt.id, data: { ...debt, current_balance: newBalance } })} />
          ))}
        </div>
      )}
    </div>
  );
}