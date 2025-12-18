import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Sparkles,
  Plus,
  Receipt,
  Lightbulb,
  ArrowLeft,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";

import AddWidgetsModal from "../components/dashboard/AddWidgetsModal";
import SavingsProgress from "../components/dashboard/SavingsProgress";
import WorthWidget from "../components/dashboard/WorthWidget";
import FinancialHealthScore from "../components/dashboard/FinancialHealthScore";
import AlertsWidget from "../components/dashboard/AlertsWidget";
import ProactiveInsights from "../components/dashboard/ProactiveInsights";
import PersonalizedHero from "../components/dashboard/PersonalizedHero";
import FinancialTip from "../components/education/FinancialTip";
import { getOnboardingData } from "../components/utils/onboardingUtils";

export default function Dashboard() {
  const [showAddWidgets, setShowAddWidgets] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState(['net_worth', 'monthly_expenses', 'monthly_income', 'recent_transactions', 'ai_tip']);
  const [onboardingData, setOnboardingData] = useState({ goals: [], awareness: null });
  const [portfolioValue, setPortfolioValue] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      try {
        setEnabledWidgets(JSON.parse(saved));
      } catch (e) {}
    }
    setOnboardingData(getOnboardingData());
  }, []);

  // Check for unread AI insights
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return base44.entities.Notification.filter(
          { created_by: user.email, is_read: false },
          '-created_date',
          10
        );
      } catch { return []; }
    },
    initialData: [],
  });

  const hasUnreadInsights = notifications.some(n => n.type === 'insight' || n.type === 'info');

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

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const currentMonthTransactions = transactions.filter(t => 
    t.date && t.date.startsWith(currentMonth)
  );
  const lastMonthTransactions = transactions.filter(t => 
    t.date && t.date.startsWith(lastMonth)
  );

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
    
  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSavings = savingsGoals.reduce((sum, goal) => sum + (goal.current_amount || 0), 0);
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.current_balance || 0), 0);
  const totalAssets = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);

  // Calculate portfolio value with live exchange rates
  useEffect(() => {
    const calculatePortfolio = async () => {
      if (investments.length === 0) {
        setPortfolioValue(0);
        return;
      }

      const { convertInvestmentsToILS } = await import('../components/utils/currencyUtils');
      const investmentsInILS = await convertInvestmentsToILS(investments);
      const value = investmentsInILS.reduce((sum, inv) => sum + inv.valueInILS, 0);
      setPortfolioValue(value);
    };

    calculatePortfolio();
  }, [investments]);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const hasAnyData = transactions.length > 0 || budgets.length > 0 || savingsGoals.length > 0;

  const isWidgetEnabled = (id) => enabledWidgets.includes(id);

  const categoryIcons = {
    'משכורת': '💰', 'עסק_עצמאי': '💼', 'השקעות': '📈', 'אחר_הכנסה': '💵',
    'מזון_ומשקאות': '🍕', 'קניות': '🛒', 'תחבורה': '🚗', 'בילויים': '🎉',
    'שירותים': '📱', 'בריאות': '🏥', 'חינוך': '📚', 'דיור': '🏠',
    'חובות': '💳', 'חיסכון': '🏦', 'אחר_הוצאה': '📦'
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto pb-24 md:pb-6" dir="rtl">
      {/* Header - Minimal */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">שלום! 👋</h1>
        <Button
          onClick={() => setShowAddWidgets(true)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Proactive AI Insights Banner - Removed for cleaner design */}

      {/* Empty State for New Users */}
      {!hasAnyData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 text-center border border-purple-200 dark:border-purple-700"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
            {localStorage.getItem('sheetim_smart_start_created') 
              ? '✅ התחלנו עבורך עם תקציב בסיסי ויעד חיסכון'
              : 'מעולה, בנינו עבורך התחלה חכמה!'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-sm mx-auto">
            {localStorage.getItem('sheetim_smart_start_created')
              ? 'אתה יכול לשנות הכל בהמשך. בוא נוסיף את התנועה הראשונה!'
              : 'בוא נוסיף עכשיו את התנועה הראשונה שלך או נגדיר תקציב חודשי'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl("Transactions")}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto h-11">
                <Plus className="w-4 h-4 ml-2" />
                הוסף תנועה
              </Button>
            </Link>
            <Link to={createPageUrl("Budgets")}>
              <Button variant="outline" className="w-full sm:w-auto h-11">
                צפה בתקציבים
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Core Stats - Always Visible */}
      {hasAnyData && (
        <>
          {/* Personalized Hero Card - Uses User Settings Goal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <PersonalizedHero
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalSavings={totalSavings}
              totalDebt={totalDebt}
              portfolioValue={portfolioValue}
              totalAssets={totalAssets}
              hasUnreadInsights={hasUnreadInsights}
            />
          </motion.div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Stats - Combined Card */}
            {(isWidgetEnabled('monthly_expenses') || isWidgetEnabled('monthly_income')) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-2"
              >
                <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Income */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">הכנסות</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₪{totalIncome.toLocaleString()}
                        </p>
                      </div>
                      {/* Balance */}
                      <div className="text-center border-x border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">יתרה</p>
                        <p className={`text-lg font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                          ₪{(totalIncome - totalExpenses).toLocaleString()}
                        </p>
                      </div>
                      {/* Expenses */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">הוצאות</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          ₪{totalExpenses.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Recent Transactions - Compact */}
          {isWidgetEnabled('recent_transactions') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">תנועות אחרונות</span>
                    <Link to={createPageUrl("Transactions")}>
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                        הכל <ArrowLeft className="w-3 h-3 mr-1" />
                      </Button>
                    </Link>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">אין תנועות עדיין</p>
                  ) : (
                    <div className="space-y-2">
                      {recentTransactions.map((transaction, idx) => {
                        const isIncome = transaction.type === 'income';
                        const icon = categoryIcons[transaction.category] || (isIncome ? '💰' : '📦');
                        
                        return (
                          <div 
                            key={transaction.id || idx} 
                            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-base">{icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {transaction.description || transaction.category?.replace(/_/g, ' ') || 'תנועה'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {transaction.date ? format(new Date(transaction.date), 'd בMMM', { locale: he }) : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncome ? '+' : '-'}₪{(transaction.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Tip - More Compact */}
          {isWidgetEnabled('ai_tip') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <FinancialTip compact />
                </div>
              </div>
            </motion.div>
          )}

          {/* Optional Widgets */}
          {isWidgetEnabled('savings_progress') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SavingsProgress savingsGoals={savingsGoals} />
            </motion.div>
          )}

          {isWidgetEnabled('financial_health') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <FinancialHealthScore />
            </motion.div>
          )}

          {isWidgetEnabled('alerts') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <AlertsWidget
                transactions={transactions}
                budgets={budgets}
                savingsGoals={savingsGoals}
                debts={debts}
                investments={investments}
              />
            </motion.div>
          )}

          {isWidgetEnabled('ai_insights') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ProactiveInsights />
            </motion.div>
          )}
        </>
      )}

      {/* Add Widgets Modal */}
      <AddWidgetsModal
        open={showAddWidgets}
        onOpenChange={setShowAddWidgets}
        currentWidgets={enabledWidgets}
        onSave={(widgets) => {
          setEnabledWidgets(widgets);
        }}
      />
    </div>
  );
}