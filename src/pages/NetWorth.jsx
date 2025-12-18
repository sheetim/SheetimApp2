import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, LineChart } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import AssetForm from "../components/networth/AssetForm";
import AssetCard from "../components/networth/AssetCard";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { NetWorthLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function NetWorthPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  const { data: savingsGoals = [], isLoading: savingsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const isLoading = assetsLoading || debtsLoading || investmentsLoading || savingsLoading;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      setEditingAsset(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowForm(false);
      setEditingAsset(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  // Calculate totals with live currency conversion for investments
  const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
  const totalLiabilities = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
  
  React.useEffect(() => {
    const calculateInvestments = async () => {
      if (investments.length === 0) {
        setTotalInvestments(0);
        return;
      }
      
      const { convertInvestmentsToILS } = await import('../components/utils/currencyUtils');
      const investmentsInILS = await convertInvestmentsToILS(investments);
      const value = investmentsInILS.reduce((sum, inv) => sum + inv.valueInILS, 0);
      setTotalInvestments(value);
    };
    
    calculateInvestments();
  }, [investments]);
  
  const netWorth = totalAssets + totalInvestments + totalSavings - totalLiabilities;

  const liquidAssets = assets.filter(a => a.is_liquid).reduce((sum, a) => sum + a.current_value, 0);
  const illiquidAssets = assets.filter(a => !a.is_liquid).reduce((sum, a) => sum + a.current_value, 0);

  // Pie chart data - show positive values for assets, separate display for debts
  const assetsData = [
    { name: 'נכסים נזילים', value: liquidAssets, color: '#10b981', icon: '💵' },
    { name: 'נכסים לא נזילים', value: illiquidAssets, color: '#3b82f6', icon: '🏠' },
    { name: 'השקעות', value: totalInvestments, color: '#8b5cf6', icon: '📈' },
    { name: 'חסכונות', value: totalSavings, color: '#f59e0b', icon: '🎯' },
  ].filter(item => item.value > 0);

  const totalPositive = liquidAssets + illiquidAssets + totalInvestments + totalSavings;
  const COLORS = assetsData.map(item => item.color);

  if (isLoading) {
    return <NetWorthLoadingSkeleton />;
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="שווי נקי" 
        icon={LineChart}
        pageName="NetWorth"
      >
        <Button onClick={() => { setEditingAsset(null); setShowForm(!showForm); }} size="sm" className="h-10 bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 ml-1" />
          נכס חדש
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">נכסים</p>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">₪{totalAssets.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">השקעות</p>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">₪{totalInvestments.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">חסכונות</p>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-amber-600 truncate">₪{totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-500">חובות</p>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-red-600 truncate">₪{totalLiabilities.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Summary */}
      <Card className={`bg-gradient-to-br ${netWorth >= 0 ? 'from-teal-500 to-emerald-600' : 'from-red-500 to-rose-600'} border-0 text-white overflow-hidden shadow-lg`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 mb-1">שווי נקי כולל</p>
              <p className="text-2xl sm:text-3xl font-bold" dir="ltr">
                {netWorth < 0 ? '-' : ''}₪{Math.abs(netWorth).toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              {netWorth >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Worth Breakdown */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">התפלגות שווי</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Pie Chart for Assets */}
            <div className="w-full md:w-1/2">
              <p className="text-xs text-center text-gray-500 mb-2">נכסים והשקעות</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={assetsData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} fill="#8884d8" dataKey="value" paddingAngle={3}>
                    {assetsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }} formatter={(value) => `₪${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend and Summary */}
            <div className="w-full md:w-1/2 space-y-3">
              {/* Assets breakdown */}
              <div className="space-y-2">
                {assetsData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>{entry.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">₪{entry.value.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-500">({totalPositive > 0 ? ((entry.value / totalPositive) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Debts section */}
              {totalLiabilities > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span className="text-xs font-medium text-red-700 dark:text-red-300">חובות</span>
                    </div>
                    <span className="text-xs font-bold text-red-600">-₪{totalLiabilities.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              {/* Net Worth Summary */}
              <div className={`rounded-lg px-3 py-2 ${netWorth >= 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">שווי נקי</span>
                  <span className={`text-sm font-bold ${netWorth >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                    {netWorth < 0 ? '-' : ''}₪{Math.abs(netWorth).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form - Fixed position on mobile */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => { setShowForm(false); setEditingAsset(null); }} />
          <Card className="fixed inset-x-2 bottom-2 top-auto max-h-[80vh] overflow-y-auto z-50 md:relative md:inset-auto md:max-h-none bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="p-4 pb-2 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">{editingAsset ? 'עריכת נכס' : 'נכס חדש'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <AssetForm asset={editingAsset} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingAsset(null); }} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Assets List */}
      {assets.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <EmptyState 
              icon={LineChart} 
              title="עוד לא חישבנו שווי נקי" 
              description="הוסף נכסים והתחייבויות כדי לראות את התמונה המלאה שלך." 
              actionLabel="התחל לבנות את השווי הנקי" 
              onAction={() => setShowForm(true)} 
              illustration="financial" 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onEdit={() => handleEdit(asset)} onDelete={() => deleteMutation.mutate(asset.id)} onUpdateValue={(newValue) => updateMutation.mutate({ id: asset.id, data: { ...asset, current_value: newValue } })} />
          ))}
        </div>
      )}
    </div>
  );
}