import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  Lock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CreditCard,
  PiggyBank,
  Calendar
} from "lucide-react";
import ChatInterface from "../components/advisor/ChatInterface";
import PortfolioAnalysis from "../components/investments/PortfolioAnalysis";
import FinancialPlanGenerator from "../components/advisor/FinancialPlanGenerator";
import OpportunityDetector from "../components/advisor/OpportunityDetector";
import { SubscriptionGuard, useSubscription } from "../components/subscription/SubscriptionGuard";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import ProBadge from "../components/common/ProBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getGoalConfig, getAwarenessConfig } from "../components/utils/onboardingUtils";
import { NotificationService } from "../components/notifications/NotificationService";

const insightCategories = [
  { id: 'monthly', title: 'סיכום חודשי', icon: Calendar, color: 'blue' },
  { id: 'spending', title: 'אזהרות והזדמנויות', icon: AlertCircle, color: 'orange' },
  { id: 'savings', title: 'הצעות לשיפור', icon: Lightbulb, color: 'purple' },
  { id: 'investments', title: 'ניתוח השקעות', icon: TrendingUp, color: 'green' },
  { id: 'debts', title: 'המלצות חובות', icon: CreditCard, color: 'red' },
];

export default function AIInsightsPage() {
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const [showChat, setShowChat] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(['monthly']);
  const [portfolioValue, setPortfolioValue] = useState(0);

  // Get user's financial goal from settings
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  // Map user settings goal to onboarding goal format
  const mapUserGoal = (userGoal) => {
    const mapping = {
      'חיסכון_לפרישה': 'build_savings',
      'קניית_דירה': 'build_savings',
      'חופשה': 'build_savings',
      'השכלה': 'build_savings',
      'פירעון_חובות': 'close_debts',
      'קרן_חירום': 'build_savings',
      'השקעות': 'start_investing',
    };
    return mapping[userGoal] || null;
  };

  const primaryGoal = currentUser?.financial_goal ? mapUserGoal(currentUser.financial_goal) : null;
  const goalConfig = getGoalConfig(primaryGoal);
  const awarenessConfig = getAwarenessConfig(currentUser?.awareness || 'intermediate');

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

  const toggleCategory = (id) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const generateFinancialData = () => {
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

    const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
    const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      totalSavings,
      portfolioValue,
      savingsGoals,
      debts,
      investments
    };
  };

  const analyzeFinancialHealth = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();
      
      // Personalize prompt based on user's goal and awareness level
      const goalContext = goalConfig 
        ? `המטרה העיקרית של המשתמש: ${goalConfig.title}. ${goalConfig.aiTone}.`
        : '';
      
      const complexityLevel = awarenessConfig.aiComplexity === 'simple' 
        ? 'השתמש בשפה פשוטה והסבר כל מושג. הימנע ממילים מקצועיות.' 
        : awarenessConfig.aiComplexity === 'detailed'
        ? 'אפשר להשתמש במונחים מקצועיים. תן ניתוח מעמיק.'
        : 'השתמש בשפה ברורה אך ניתן להזכיר מונחים מקצועיים עם הסבר קצר.';

      const prompt = `אתה יועץ פיננסי מומחה. נתח את המצב הפיננסי:
הכנסות: ₪${data.totalIncome.toLocaleString()}
הוצאות: ₪${data.totalExpenses.toLocaleString()}
חובות: ₪${data.totalDebt.toLocaleString()}
חיסכון: ₪${data.totalSavings.toLocaleString()}
תיק השקעות: ₪${data.portfolioValue.toLocaleString()}

${goalContext}

הוראות סגנון: ${complexityLevel}

ספק:
1. ציון בריאות פיננסית (1-10)
2. התייחסות ספציפית למטרה של המשתמש (אם קיימת)
3. 3 נקודות חזקות
4. 3 נקודות לשיפור
5. 5 המלצות קונקרטיות - התחל בהמלצה הרלוונטית ביותר למטרה

כתוב בעברית, בקצרה ובבהירות.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setInsights(response);

      // Check for high-priority issues and create notifications
      const balance = data.totalIncome - data.totalExpenses;
      if (balance < 0 && Math.abs(balance) > data.totalIncome * 0.2) {
        await NotificationService.notifyAIInsight(
          'חריגה משמעותית בהוצאות',
          `ההוצאות החודשיות עולות על ההכנסות ב-₪${Math.abs(balance).toLocaleString()}`,
          'Transactions',
          'high'
        );
        queryClient.invalidateQueries(['notifications']);
      }

      // Check for high-interest debts
      const highInterestDebts = data.debts.filter(d => d.interest_rate > 10);
      if (highInterestDebts.length > 0) {
        await NotificationService.notifyRiskyDebt(
          highInterestDebts[0].name,
          highInterestDebts[0].interest_rate
        );
        queryClient.invalidateQueries(['notifications']);
      }

    } catch (error) {
      setInsights('אירעה שגיאה בניתוח. נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasEnoughData = transactions.length >= 5;

  if (!isPremium) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
        <PageHeader 
          title="יועץ AI" 
          icon={Sparkles}
          pageName="AIInsights"
        />

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="text-center py-8 px-5">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              פיצ'ר Pro – יועץ AI
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 max-w-sm mx-auto">
              קבל ניתוח מעמיק, תובנות מותאמות והמלצות לשיפור המצב הפיננסי
            </p>
            
            <Link to={createPageUrl('UserSettings')}>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 h-11">
                <Sparkles className="w-4 h-4 ml-2" />
                לפתיחה, עברו לתכנית Pro
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-3">7 ימי ניסיון חינם • ביטול בכל עת</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
        <PageHeader 
          title="יועץ AI" 
          icon={Sparkles}
          pageName="AIInsights"
        />

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="text-center py-8 px-5">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              צריך עוד קצת נתונים
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-sm mx-auto">
              כדי שנוכל לתת לך תובנה אמיתית, נוסיף קודם כמה עסקאות. יש לך כרגע {transactions.length} עסקאות, צריך לפחות 5.
            </p>
            
            <Link to={createPageUrl('Transactions')}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11">
                הוסף עסקאות בדשבורד
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      <PageHeader 
        title="יועץ AI" 
        icon={Sparkles}
        pageName="AIInsights"
      >
        <Button 
          onClick={() => setShowChat(!showChat)} 
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="w-4 h-4 ml-2" />
          {showChat ? 'סגור צ\'אט' : 'פתח צ\'אט AI'}
        </Button>
      </PageHeader>

      {showChat && <ChatInterface />}

      {/* Insight Categories */}
      <div className="space-y-4">
        {insightCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          
          return (
            <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
              <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${category.color}-100 dark:bg-${category.color}-900/30`}>
                          <Icon className={`w-5 h-5 text-${category.color}-600`} />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.title}
                        </CardTitle>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-5 pb-5 pt-0">
                    {category.id === 'monthly' && (
                      <div className="space-y-4">
                        {/* Goal Context Banner */}
                        {goalConfig && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-lg">{goalConfig.emoji}</span>
                              <span className="text-purple-800 dark:text-purple-300">
                                <strong>המטרה שלך:</strong> {goalConfig.title}
                              </span>
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              הניתוח יתמקד ב{goalConfig.focus} ויתן המלצות רלוונטיות
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          קבל דוח חודשי מפורט על המצב הפיננסי שלך
                          {awarenessConfig.level === 'beginner' && ' (מותאם למתחילים)'}
                        </p>
                        <Button 
                          onClick={analyzeFinancialHealth} 
                          disabled={isAnalyzing}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isAnalyzing ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2" />
                          ) : (
                            <BarChart3 className="w-4 h-4 ml-2" />
                          )}
                          צור דוח חודשי
                        </Button>
                        {insights && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                              {insights}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    {category.id === 'spending' && (
                      <OpportunityDetector />
                    )}
                    {category.id === 'investments' && (
                      <PortfolioAnalysis investments={investments} />
                    )}
                    {category.id === 'debts' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          המלצות לאופטימיזציה ופירעון חובות
                        </p>
                        <FinancialPlanGenerator />
                      </div>
                    )}
                    {category.id === 'savings' && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          הצעות מותאמות אישית לשיפור המצב הפיננסי
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Lightbulb className="w-5 h-5 text-purple-600 mb-2" />
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">אוטומציה</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              הגדר העברה אוטומטית לחיסכון ביום קבלת המשכורת
                            </p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <Target className="w-5 h-5 text-green-600 mb-2" />
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">יעדים ברורים</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              הגדר יעדי חיסכון ספציפיים ומדידים
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">הגדל הכנסות</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              חפש דרכים להגדיל את ההכנסה החודשית
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      </div>
  );
}