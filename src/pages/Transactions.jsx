import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Download, Upload, Wallet } from "lucide-react";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionStats from "@/components/transactions/TransactionStats";
import AdvancedSearch from "@/components/search/AdvancedSearch";
import ExcelImporter from "@/components/imports/ExcelImporter";
import { useToast } from "@/components/ui/use-toast";
import { exportTransactionsToCSV } from "@/components/utils/exportHelpers";
import EmptyState from "@/components/common/EmptyState";
import { ListLoadingSkeleton } from "@/components/common/LoadingSkeleton";
import PageHeader from "@/components/common/PageHeader";

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchFilters, setSearchFilters] = useState({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
      toast({
        title: "✅ עסקה נוספה",
        description: "העסקה נשמרה בהצלחה",
        variant: "success",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
      toast({
        title: "✅ עסקה עודכנה",
        description: "השינויים נשמרו בהצלחה",
        variant: "success",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "🗑️ עסקה נמחקה",
        description: "העסקה הוסרה מהמערכת",
        variant: "success",
      });
    },
  });

  const handleSubmit = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    
    if (searchFilters.searchTerm && !t.description?.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())) {
      return false;
    }
    
    if (searchFilters.category && t.category !== searchFilters.category) return false;
    if (searchFilters.type && t.type !== searchFilters.type) return false;
    
    if (searchFilters.minAmount && t.amount < searchFilters.minAmount) return false;
    if (searchFilters.maxAmount && t.amount > searchFilters.maxAmount) return false;
    
    if (searchFilters.dateFrom && t.date < searchFilters.dateFrom) return false;
    if (searchFilters.dateTo && t.date > searchFilters.dateTo) return false;
    
    return true;
  });

  const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
  const types = ['income', 'expense'];

  const handleExport = () => {
    exportTransactionsToCSV(filteredTransactions);
    toast({
      title: "📥 קובץ יוצא",
      description: "העסקאות יוצאו בהצלחה",
      variant: "success",
    });
  };

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="הכנסות והוצאות" 
        icon={Wallet}
        pageName="Transactions"
      >
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowImporter(!showImporter)} 
            variant="outline" 
            size="sm" 
            className={`h-10 ${showImporter ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700' : ''}`}
          >
            <Upload className="w-4 h-4 ml-2" />
            <span className="hidden sm:inline">ייבוא מאקסל</span>
          </Button>
          {transactions.length > 0 && (
            <Button onClick={handleExport} variant="outline" size="sm" className="h-10">
              <Download className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">ייצא</span>
            </Button>
          )}
          <Button
            onClick={() => { setEditingTransaction(null); setShowForm(!showForm); }}
            size="sm"
            className="h-10 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            עסקה חדשה
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <TransactionStats transactions={transactions} />

      {/* Excel Importer */}
      {showImporter && (
        <ExcelImporter 
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setShowImporter(false);
          }} 
        />
      )}

      {/* Search */}
      <AdvancedSearch
        onSearch={setSearchFilters}
        categories={categories}
        types={types}
      />

      {/* Form */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingTransaction ? 'עריכת עסקה' : 'עסקה חדשה'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTransaction(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">רשימת עסקאות</CardTitle>
            <div className="flex gap-2">
              {['all', 'income', 'expense'].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={`h-9 px-3 rounded-full ${filterType === type ? '' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {type === 'all' && 'הכל'}
                  {type === 'income' && <><TrendingUp className="w-4 h-4 ml-1" />הכנסות</>}
                  {type === 'expense' && <><TrendingDown className="w-4 h-4 ml-1" />הוצאות</>}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {isLoading ? (
            <ListLoadingSkeleton />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="עדיין אין תנועות"
              description="התחל להוסיף הוצאות והכנסות כדי לראות תמונה מלאה."
              actionLabel="הוסף תנועה ראשונה"
              onAction={() => setShowForm(true)}
              illustration="financial"
            />
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              isLoading={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}