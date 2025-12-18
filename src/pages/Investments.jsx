import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Download, BarChart3, Target, RefreshCw, Upload, Camera, CandlestickChart } from "lucide-react";
import InvestmentForm from "../components/investments/InvestmentForm";
import InvestmentCard from "../components/investments/InvestmentCard";
import { useToast } from "@/components/ui/use-toast";
import { exportInvestmentsToCSV } from "../components/utils/exportHelpers";
import EmptyState from "../components/common/EmptyState";
import DividendTracker from "../components/investments/DividendTracker";
import PerformanceAnalysis from "../components/investments/PerformanceAnalysis";
import InvestmentGoalForm from "../components/investments/InvestmentGoalForm";
import InvestmentGoalCard from "../components/investments/InvestmentGoalCard";
import AIRecommendations from "../components/investments/AIRecommendations";
import PortfolioImport from "../components/investments/PortfolioImport";
import BrokerageSync from "../components/investments/BrokerageSync";
import SmartPortfolioScan from "../components/investments/SmartPortfolioScan";
import PageHeader from "../components/common/PageHeader";
import ProBadge from "../components/common/ProBadge";
import { InvestmentsLoadingSkeleton } from "../components/common/LoadingSkeleton";

export default function InvestmentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [showDividendTracker, setShowDividendTracker] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showGoals, setShowGoals] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSmartScan, setShowSmartScan] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['investmentGoals'],
    queryFn: () => base44.entities.InvestmentGoal.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Investment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setShowForm(false);
      setEditingInvestment(null);
      toast({
        title: "השקעה נוספה",
        description: "ההשקעה נרשמה בהצלחה",
      });
    },
  });

  const updateAllPrices = async (manual = false) => {
    if (investments.length === 0) return;
    if(!manual) {
        const lastSync = localStorage.getItem('lastInvestmentSync');
        if (lastSync && new Date() - new Date(lastSync) < 5 * 60 * 1000) {
            return; // Don't auto-sync if synced in the last 5 mins
        }
    }

    setIsSyncing(true);

    const stocks = investments
        .filter(inv => inv.type === 'מניות' && inv.symbol)
        .map(inv => inv.symbol.toUpperCase());
    
    const cryptos = investments
        .filter(inv => inv.type === 'קריפטו' && inv.symbol)
        .map(inv => inv.symbol.toLowerCase());

    try {
        const updates = [];

        if (stocks.length > 0) {
            const { data } = await base44.functions.invoke('getStockPrices', { symbols: stocks, type: 'stock' });
            if (data?.prices) {
                investments.forEach(inv => {
                    if (inv.type === 'מניות' && inv.symbol && data.prices[inv.symbol.toUpperCase()]) {
                        const priceInfo = data.prices[inv.symbol.toUpperCase()];
                        // Use the price based on the investment's currency
                        const currency = inv.currency || 'ILS';
                        let newPrice;
                        if (currency === 'USD') {
                            newPrice = priceInfo.price_usd;
                        } else if (currency === 'ILS') {
                            newPrice = priceInfo.price_ils;
                        } else {
                            newPrice = priceInfo.price_usd * 0.92; // EUR approximate
                        }
                        
                        if (newPrice && (inv.current_price?.toFixed(2) !== newPrice?.toFixed(2) || inv.change_24h?.toFixed(2) !== priceInfo.change_24h?.toFixed(2))) {
                            updates.push({ id: inv.id, data: { current_price: newPrice, change_24h: priceInfo.change_24h } });
                        }
                    }
                });
            }
        }

        if (cryptos.length > 0) {
            const { data } = await base44.functions.invoke('getStockPrices', { symbols: cryptos, type: 'crypto' });
            if (data?.prices) {
                investments.forEach(inv => {
                    if (inv.type === 'קריפטו' && inv.symbol && data.prices[inv.symbol.toLowerCase()]) {
                        const priceInfo = data.prices[inv.symbol.toLowerCase()];
                        // Use the price based on the investment's currency
                        const currency = inv.currency || 'ILS';
                        let newPrice;
                        if (currency === 'USD') {
                            newPrice = priceInfo.price_usd;
                        } else if (currency === 'ILS') {
                            newPrice = priceInfo.price_ils;
                        } else {
                            newPrice = priceInfo.price_usd * 0.92; // EUR approximate
                        }
                        
                        if (newPrice && (inv.current_price?.toFixed(2) !== newPrice?.toFixed(2) || inv.change_24h?.toFixed(2) !== priceInfo.change_24h?.toFixed(2))) {
                            updates.push({ id: inv.id, data: { current_price: newPrice, change_24h: priceInfo.change_24h } });
                        }
                    }
                });
            }
        }
        
        const uniqueUpdates = updates.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)

        if (uniqueUpdates.length > 0) {
             await Promise.all(uniqueUpdates.map(u => base44.entities.Investment.update(u.id, u.data)));
             queryClient.invalidateQueries({ queryKey: ['investments'] });
             if (manual) toast({ title: `📈 עודכנו ${uniqueUpdates.length} מחירים` });
        } else if (manual) {
             toast({ title: `מחירים עדכניים` });
        }
        localStorage.setItem('lastInvestmentSync', new Date().toISOString());

    } catch (error) {
        console.error("Failed to update prices", error);
        if (manual) toast({ title: "שגיאה בעדכון מחירים", variant: 'destructive' });
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    if(investments.length > 0) {
         updateAllPrices();
    }
    const interval = setInterval(() => {
        if(investments.length > 0) updateAllPrices();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [investments.length]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Investment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setShowForm(false);
      setEditingInvestment(null);
      toast({
        title: "השקעה עודכנה",
        description: "השינויים נשמרו בהצלחה",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Investment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      toast({
        title: "השקעה נמחקה",
        description: "ההשקעה הוסרה מהתיק",
      });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestmentGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentGoals'] });
      setShowGoalForm(false);
      setEditingGoal(null);
      toast({
        title: "יעד נוסף",
        description: "יעד ההשקעה נוצר בהצלחה",
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InvestmentGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentGoals'] });
      setShowGoalForm(false);
      setEditingGoal(null);
      toast({
        title: "יעד עודכן",
        description: "השינויים נשמרו בהצלחה",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestmentGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentGoals'] });
      toast({
        title: "יעד נמחק",
        description: "יעד ההשקעה הוסר",
      });
    },
  });

  const handleSubmit = (data) => {
    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleGoalSubmit = (data) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  // Use live exchange rates
  const [investmentsInILS, setInvestmentsInILS] = React.useState([]);
  const [ratesLoaded, setRatesLoaded] = React.useState(false);
  
  React.useEffect(() => {
    const loadRates = async () => {
      const { convertInvestmentsToILS } = await import('../components/utils/currencyUtils');
      const converted = await convertInvestmentsToILS(investments);
      setInvestmentsInILS(converted);
      setRatesLoaded(true);
    };
    
    if (investments.length > 0) {
      loadRates();
    } else {
      setRatesLoaded(true);
    }
  }, [investments]);

  const totalInvested = investmentsInILS.reduce((sum, inv) => sum + (inv.costInILS || 0), 0);
  const currentValue = investmentsInILS.reduce((sum, inv) => sum + (inv.valueInILS || 0), 0);
  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const totalDividends = investmentsInILS.reduce((sum, inv) => sum + (inv.dividendsInILS || 0), 0);
  const annualDividendYield = totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

  if (isLoading || !ratesLoaded) {
    return <InvestmentsLoadingSkeleton />;
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="תיק השקעות" 
        icon={CandlestickChart}
        pageName="Investments"
        badge="Pro"
        badgeVariant="default"
      >
        <Button 
          onClick={() => { setEditingInvestment(null); setShowForm(!showForm); }} 
          size="sm" 
          className="h-10 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף השקעה
        </Button>
      </PageHeader>

      {/* Hero Stats Card - Gradient Design */}
      <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 border-0 text-white overflow-hidden shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div>
              <p className="text-[10px] sm:text-xs text-white/70 mb-0.5 sm:mb-1">שווי תיק</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold">₪{currentValue.toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1">{investments.length} השקעות</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] sm:text-xs text-white/70 mb-0.5 sm:mb-1">רווח/הפסד</p>
              <p className={`text-lg sm:text-2xl md:text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {totalGainLoss >= 0 ? '+' : ''}₪{Math.abs(totalGainLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {totalGainLoss >= 0 ? '▲' : '▼'} {Math.abs(totalGainLossPercent).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
            <div className="flex-1">
              <p className="text-[10px] sm:text-xs text-white/70">סך הושקע</p>
              <p className="text-xs sm:text-sm md:text-base font-semibold">₪{totalInvested.toLocaleString()}</p>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] sm:text-xs text-white/70">דיבידנדים</p>
              <p className="text-xs sm:text-sm md:text-base font-semibold">₪{totalDividends.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Chips - Pill Style */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button 
          onClick={() => updateAllPrices(true)} 
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 active:scale-95'}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          עדכון מחירים
        </button>
        <button 
          onClick={() => setShowAnalysis(!showAnalysis)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${showAnalysis ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          ניתוח ביצועים
        </button>
        <button 
          onClick={() => setShowDividendTracker(!showDividendTracker)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${showDividendTracker ? 'bg-green-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700'}`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          דיבידנדים
        </button>
        <button 
          onClick={() => setShowGoals(!showGoals)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${showGoals ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700'}`}
        >
          <Target className="w-3.5 h-3.5" />
          יעדים
        </button>
        <button 
          onClick={() => setShowSmartScan(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md transition-all active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          סריקה חכמה
        </button>
        <button 
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          ייבוא
        </button>
        <button 
          onClick={() => exportInvestmentsToCSV(investments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          ייצוא
        </button>
      </div>

      {showSmartScan && (
        <SmartPortfolioScan 
          onImport={() => queryClient.invalidateQueries({ queryKey: ['investments'] })}
          onClose={() => setShowSmartScan(false)}
        />
      )}

      {showImport && (
        <PortfolioImport 
          onImport={() => queryClient.invalidateQueries({ queryKey: ['investments'] })}
          onClose={() => setShowImport(false)}
        />
      )}

      {showAnalysis && investments.length > 0 && (
        <PerformanceAnalysis investments={investments} />
      )}

      {showDividendTracker && (
        <DividendTracker 
          investments={investments}
          onClose={() => setShowDividendTracker(false)}
          onUpdateInvestment={(id, data) => updateMutation.mutate({ id, data })}
        />
      )}

      {showGoals && (
        <div className="space-y-6">
          <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">יעדי השקעה</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                  variant="outline"
                  className="md-ripple"
                >
                  המלצות AI
                </Button>
                <Button
                  onClick={() => {
                    setEditingGoal(null);
                    setShowGoalForm(!showGoalForm);
                  }}
                  className="md-ripple"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  יעד חדש
                </Button>
              </div>
            </CardHeader>
          </Card>

          {showAIRecommendations && (
            <AIRecommendations goals={goals} investments={investments} />
          )}

          {showGoalForm && (
            <InvestmentGoalForm
              goal={editingGoal}
              onSubmit={handleGoalSubmit}
              onCancel={() => {
                setShowGoalForm(false);
                setEditingGoal(null);
              }}
            />
          )}

          {goals.length === 0 ? (
            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardContent>
                <EmptyState
                  icon={Target}
                  title="אין יעדי השקעה"
                  description="הגדר יעדי השקעה וקבל המלצות מותאמות מ-AI"
                  actionLabel="הוסף יעד"
                  onAction={() => setShowGoalForm(true)}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <InvestmentGoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={(g) => deleteGoalMutation.mutate(g.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingInvestment ? 'עריכת השקעה' : 'השקעה חדשה'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <InvestmentForm investment={editingInvestment} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingInvestment(null); }} />
          </CardContent>
        </Card>
      )}

      {/* Brokerage Sync */}
      <BrokerageSync onSyncComplete={() => queryClient.invalidateQueries({ queryKey: ['investments'] })} />

      {investments.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5 md:p-8">
            <EmptyState 
              icon={TrendingUp} 
              title="תיק ההשקעות שלך עדיין ריק" 
              description="הוסף מניות, קרנות או נכסים כדי לעקוב אחרי התשואה והדיבידנדים." 
              actionLabel="הוסף השקעה" 
              onAction={() => setShowForm(true)} 
              illustration="financial" 
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              ההשקעות שלי ({investments.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {investments.map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} onEdit={() => handleEdit(investment)} onDelete={() => deleteMutation.mutate(investment.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}