import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target, AlertCircle, Lightbulb, FileText, Lock } from "lucide-react";
import ChatInterface from "../components/advisor/ChatInterface";
import PortfolioAnalysis from "../components/investments/PortfolioAnalysis";
import FinancialPlanGenerator from "../components/advisor/FinancialPlanGenerator";
import OpportunityDetector from "../components/advisor/OpportunityDetector";
import { SubscriptionGuard, useSubscription } from "../components/subscription/SubscriptionGuard";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FinancialAdvisorPage() {
  const { isPremium } = useSubscription();
  const [showChat, setShowChat] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

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
    const portfolioValue = investments.reduce((sum, inv) => 
      sum + ((inv.quantity || 0) * (inv.current_price || 0)), 0
    );

    const expensesByCategory = {};
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'אחר';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (t.amount || 0);
    });

    // Calculate historical data (last 12 months)
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthKey = format(date, 'yyyy-MM');
      const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(monthKey));
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        month: monthKey,
        income,
        expenses,
        savings: income - expenses
      };
    });

    // Calculate trends and averages
    const avgIncome = last12Months.reduce((sum, m) => sum + m.income, 0) / last12Months.length;
    const avgExpenses = last12Months.reduce((sum, m) => sum + m.expenses, 0) / last12Months.length;
    const avgSavings = last12Months.reduce((sum, m) => sum + m.savings, 0) / last12Months.length;

    // Calculate growth rates
    const recentMonths = last12Months.slice(-3);
    const olderMonths = last12Months.slice(0, 3);
    const incomeGrowth = olderMonths.length > 0 && recentMonths.length > 0 
      ? ((recentMonths.reduce((s, m) => s + m.income, 0) / recentMonths.length) - 
         (olderMonths.reduce((s, m) => s + m.income, 0) / olderMonths.length)) / 
        (olderMonths.reduce((s, m) => s + m.income, 0) / olderMonths.length) * 100
      : 0;

    const expenseGrowth = olderMonths.length > 0 && recentMonths.length > 0
      ? ((recentMonths.reduce((s, m) => s + m.expenses, 0) / recentMonths.length) - 
         (olderMonths.reduce((s, m) => s + m.expenses, 0) / olderMonths.length)) / 
        (olderMonths.reduce((s, m) => s + m.expenses, 0) / olderMonths.length) * 100
      : 0;

    // Calculate investment performance
    const totalInvestmentValue = investments.reduce((sum, inv) => 
      sum + ((inv.quantity || 0) * (inv.current_price || 0)), 0
    );
    const totalInvestmentCost = investments.reduce((sum, inv) => 
      sum + ((inv.quantity || 0) * (inv.purchase_price || 0)), 0
    );
    const investmentReturn = totalInvestmentCost > 0 
      ? ((totalInvestmentValue - totalInvestmentCost) / totalInvestmentCost * 100)
      : 0;

    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      totalSavings,
      portfolioValue,
      expensesByCategory,
      last12Months,
      avgIncome,
      avgExpenses,
      avgSavings,
      incomeGrowth,
      expenseGrowth,
      investmentReturn,
      totalInvestmentValue,
      totalInvestmentCost,
      savingsGoals,
      debts,
      investments
    };
  };

  const analyzeFinancialHealth = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();

      const prompt = `אתה יועץ פיננסי מומחה מתקדם עם יכולות ניתוח כמותיות עמוקות. נתח את המצב הפיננסי בצורה מפורטת ומדעית:

📊 מצב פיננסי נוכחי:
- הכנסות חודשיות: ₪${data.totalIncome.toLocaleString()} (ממוצע שנתי: ₪${data.avgIncome.toLocaleString()})
- הוצאות חודשיות: ₪${data.totalExpenses.toLocaleString()} (ממוצע שנתי: ₪${data.avgExpenses.toLocaleString()})
- תזרים מזומנים: ₪${(data.totalIncome - data.totalExpenses).toLocaleString()}
- יחס חיסכון: ${data.totalIncome > 0 ? ((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1) : 0}%
- סך חובות: ₪${data.totalDebt.toLocaleString()}
- חיסכון נוכחי: ₪${data.totalSavings.toLocaleString()}
- תיק השקעות: ₪${data.portfolioValue.toLocaleString()} (תשואה: ${data.investmentReturn.toFixed(1)}%)
- שווי נקי: ₪${(data.portfolioValue + data.totalSavings - data.totalDebt).toLocaleString()}

📈 ניתוח מגמות (12 חודשים):
- מגמת הכנסות: ${data.incomeGrowth > 0 ? '+' : ''}${data.incomeGrowth.toFixed(1)}%
- מגמת הוצאות: ${data.expenseGrowth > 0 ? '+' : ''}${data.expenseGrowth.toFixed(1)}%
- ממוצע חיסכון חודשי: ₪${data.avgSavings.toLocaleString()}

${data.last12Months.map((m, i) => `${i+1}. ${m.month}: הכנסות ₪${m.income.toLocaleString()}, הוצאות ₪${m.expenses.toLocaleString()}, חיסכון ₪${m.savings.toLocaleString()}`).join('\n')}

💰 פילוח הוצאות מפורט:
${Object.entries(data.expensesByCategory)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, amount]) => `- ${cat}: ₪${amount.toLocaleString()} (${(amount/data.totalExpenses*100).toFixed(1)}%)`)
  .join('\n')}

🎯 יעדי חיסכון (${data.savingsGoals.length} יעדים):
${data.savingsGoals.map(g => {
  const progress = (g.current_amount / g.target_amount * 100).toFixed(1);
  const remaining = g.target_amount - g.current_amount;
  const monthsToGoal = data.avgSavings > 0 ? Math.ceil(remaining / data.avgSavings) : 'N/A';
  return `- ${g.name}: ${progress}% הושג (נותר ₪${remaining.toLocaleString()}), זמן משוער: ${monthsToGoal} חודשים`;
}).join('\n') || 'אין יעדים מוגדרים'}

💳 ניתוח חובות מפורט (${data.debts.length} חובות):
${data.debts.map(d => {
  const monthlyInterest = (d.current_balance * d.interest_rate / 100 / 12);
  const monthsLeft = d.monthly_payment > monthlyInterest ? 
    Math.ceil(d.current_balance / (d.monthly_payment - monthlyInterest)) : 'N/A';
  const totalInterest = monthsLeft !== 'N/A' ? monthsLeft * monthlyInterest : 'N/A';
  return `- ${d.name} (${d.type}): יתרה ₪${d.current_balance?.toLocaleString()}, ריבית ${d.interest_rate}%, תשלום ₪${d.monthly_payment?.toLocaleString()}, ריבית חודשית ~₪${monthlyInterest.toFixed(0)}, זמן פירעון משוער: ${monthsLeft} חודשים, סה"כ ריבית צפויה: ${totalInterest !== 'N/A' ? '₪' + totalInterest.toFixed(0) : 'N/A'}`;
}).join('\n') || 'אין חובות פעילים 🎉'}

💼 תיק השקעות (${data.investments.length} השקעות):
${data.investments.map(inv => {
  const currentValue = (inv.quantity || 0) * (inv.current_price || 0);
  const purchaseValue = (inv.quantity || 0) * (inv.purchase_price || 0);
  const gain = purchaseValue > 0 ? ((currentValue - purchaseValue) / purchaseValue * 100).toFixed(1) : 0;
  const gainAmount = currentValue - purchaseValue;
  return `- ${inv.name} (${inv.type}): שווי ₪${currentValue.toLocaleString()}, ${gainAmount >= 0 ? 'רווח' : 'הפסד'} ${gain}% (₪${Math.abs(gainAmount).toLocaleString()})`;
}).join('\n') || 'אין השקעות'}

📋 ספק ניתוח מקיף:

1️⃣ ציון בריאות פיננסית (1-10) עם הסבר מפורט לכל קריטריון

2️⃣ תחזית פיננסית מדויקת ל-12 חודשים:
   - הכנסות צפויות (בהתבסס על מגמה)
   - הוצאות צפויות (בהתבסס על מגמה)
   - פוטנציאל חיסכון שנתי
   - נקודות ציון חשובות

3️⃣ אסטרטגיית אופטימיזציה אגרסיבית לחובות:
   - דירוג חובות לפי ROI של פירעון
   - שיטת Avalanche vs Snowball - מה מתאים יותר
   - חישוב מדויק של חיסכון בריבית
   - המלצות קונקרטיות לרפיננסינג או איחוד חובות

4️⃣ תרחישי "מה אם" מורכבים:
   - תרחיש A: חיסכון +20%, זמן להשגת יעדים
   - תרחיש B: הקטנת הוצאות 15%, השפעה על שנה
   - תרחיש C: הגדלת תשלומי חובות +30%, חיסכון בריבית
   - תרחיש D: שילוב אופטימלי מותאם

5️⃣ 7 המלצות קונקרטיות ומעשיות מסודרות לפי עדיפות

6️⃣ אזורים קריטיים לשיפור מיידי

כתוב בצורה מקצועית עם חישובים מדויקים ומספרים קונקרטיים.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setInsights(response);
    } catch (error) {
      console.error('Error analyzing financial health:', error);
      setInsights('מצטער, אירעה שגיאה בניתוח הנתונים הפיננסיים. אנא נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMonthlySummary = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();
      const currentMonth = format(new Date(), 'yyyy-MM');
      const lastMonth = data.last12Months[data.last12Months.length - 2] || {};
      
      const prompt = `צור סיכום פיננסי חודשי מקיף עבור ${currentMonth}:

📊 נתוני החודש:
- הכנסות: ₪${data.totalIncome.toLocaleString()}
- הוצאות: ₪${data.totalExpenses.toLocaleString()}
- מאזן: ₪${(data.totalIncome - data.totalExpenses).toLocaleString()}
- יחס חיסכון: ${data.totalIncome > 0 ? ((data.totalIncome - data.totalExpenses) / data.totalIncome * 100).toFixed(1) : 0}%

📈 השוואה לחודש הקודם (${lastMonth.month || 'N/A'}):
- הכנסות: ${lastMonth.income ? '₪' + lastMonth.income.toLocaleString() : 'N/A'} → ₪${data.totalIncome.toLocaleString()}
- הוצאות: ${lastMonth.expenses ? '₪' + lastMonth.expenses.toLocaleString() : 'N/A'} → ₪${data.totalExpenses.toLocaleString()}

📊 ממוצעים (12 חודשים):
- ממוצע הכנסות: ₪${data.avgIncome.toLocaleString()}
- ממוצע הוצאות: ₪${data.avgExpenses.toLocaleString()}
- מגמת הכנסות: ${data.incomeGrowth > 0 ? '📈' : '📉'} ${data.incomeGrowth.toFixed(1)}%

💰 פילוח הוצאות:
${Object.entries(data.expensesByCategory).map(([cat, amount]) => `- ${cat}: ₪${amount.toLocaleString()} (${((amount / data.totalExpenses) * 100).toFixed(1)}%)`).join('\n')}

הסיכום צריך לכלול:
1. ביצועים חודשיים - האם שיפרת/הרעת לעומת החודש הקודם
2. דגשים עיקריים - הישגים וקשיים
3. קטגוריות בולטות - איפה הוצאת הכי הרבה
4. המלצות לחודש הבא
5. יעדים להשגה

כתוב בצורה קצרה, ברורה ומעוררת השראה.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setInsights(response);
    } catch (error) {
      console.error('Error generating summary:', error);
      setInsights('מצטער, אירעה שגיאה ביצירת הסיכום. אנא נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateWhatIfScenario = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();
      
      const prompt = `נתח תרחישי "מה אם" מורכבים ומפורטים עם חישובים מדויקים:

📊 מצב בסיס נוכחי:
- הכנסות חודשיות: ₪${data.totalIncome.toLocaleString()} (ממוצע: ₪${data.avgIncome.toLocaleString()})
- הוצאות חודשיות: ₪${data.totalExpenses.toLocaleString()} (ממוצע: ₪${data.avgExpenses.toLocaleString()})
- חיסכון חודשי ממוצע: ₪${data.avgSavings.toLocaleString()}
- סך חיסכון נוכחי: ₪${data.totalSavings.toLocaleString()}
- סך חובות: ₪${data.totalDebt.toLocaleString()}
- תיק השקעות: ₪${data.portfolioValue.toLocaleString()}

💰 פילוח הוצאות לאופטימיזציה:
${Object.entries(data.expensesByCategory)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, amount]) => `- ${cat}: ₪${amount.toLocaleString()} (${(amount/data.totalExpenses*100).toFixed(1)}%)`)
  .join('\n')}

🎯 יעדי חיסכון עם חישובים:
${data.savingsGoals.map(g => {
  const remaining = g.target_amount - g.current_amount;
  const monthsAtCurrentRate = data.avgSavings > 0 ? Math.ceil(remaining / data.avgSavings) : 'N/A';
  return `- ${g.name}: נותרו ₪${remaining.toLocaleString()}, יעד ${g.target_date}, זמן נוכחי ${monthsAtCurrentRate} חודשים`;
}).join('\n') || 'אין יעדים מוגדרים'}

💳 חובות עם פרמטרים מלאים:
${data.debts.map(d => {
  const monthlyInterest = (d.current_balance * d.interest_rate / 100 / 12);
  const principal = d.monthly_payment - monthlyInterest;
  const monthsLeft = principal > 0 ? Math.ceil(d.current_balance / principal) : 'N/A';
  return `- ${d.name}: יתרה ₪${d.current_balance?.toLocaleString()}, ריבית ${d.interest_rate}%, תשלום ₪${d.monthly_payment?.toLocaleString()}, קרן בתשלום ₪${principal.toFixed(0)}, חודשים נותרים ${monthsLeft}`;
}).join('\n') || 'אין חובות'}

נתח את התרחישים הבאים בצורה מפורטת עם חישובים מדויקים:

🔷 תרחיש 1: אופטימיזציה אגרסיבית של הוצאות (-25%)
   - קטגוריות ספציפיות לקיצוץ (תן המלצות לפי העדיפות)
   - חיסכון חודשי: ₪X
   - חיסכון שנתי: ₪Y
   - זמן חדש להשגת יעדי חיסכון
   - השפעה על איכות חיים (דרג 1-10)

🔷 תרחיש 2: הגדלת חיסכון משמעותית (+30%)
   - סכום חיסכון חודשי חדש
   - זמן להגיע לכל יעד חיסכון
   - השפעה על תזרים המזומנים
   - אפשרות לביצוע (דרג 1-10)

🔷 תרחיש 3: פירעון אגרסיבי של חובות (הגדלת תשלומים +40%)
   - סכום תשלום חודשי חדש לכל חוב
   - זמן פירעון חדש לכל חוב
   - חיסכון מדויק בריבית לכל חוב
   - סה"כ חיסכון בריבית
   - זמן שייחסך

🔷 תרחיש 4: רפיננסינג ואיחוד חובות
   - ריבית ממוצעת משוקללת נוכחית
   - ריבית אפשרית לאיחוד (הערכה: 8-12%)
   - חיסכון חודשי פוטנציאלי
   - חיסכון כולל על פני התקופה
   - האם כדאי? (כן/לא + הסבר)

🔷 תרחיש 5: שילוב אופטימלי מתקדם
   - אחוזי קיצוץ מומלצים לכל קטגוריה
   - חלוקה אופטימלית בין חיסכון לפירעון חובות
   - זמן צפוי לחופש פיננסי (ללא חובות)
   - שווי נקי צפוי בעוד שנה
   - אבני דרך רבעוניות

🔷 תרחיש 6: תרחיש השקעה (אם יש עודף)
   - סכום זמין להשקעה
   - תשואה צפויה (שמרנית 5%, אופטימית 8%)
   - ערך תיק בעוד 5 שנים
   - השוואה לחיסכון רגיל

🔷 תרחיש 7: תרחיש חירום (הכנסות -20%)
   - יכולת הישרדות בחודשים
   - איזה הוצאות חיוניות
   - אסטרטגיית מגן

עבור כל תרחיש ספק:
✅ חישובים מלאים ומדויקים
✅ ציר זמן ברור
✅ השפעה על כל היעדים
✅ יתרונות וחסרונות
✅ המלצה ברורה (כן/לא)
✅ רמת קושי ביצוע (1-10)

בסוף, המלץ על התרחיש/שילוב התרחישים הטוב ביותר עם תוכנית פעולה צעד אחר צעד.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setInsights(response);
    } catch (error) {
      console.error('Error generating scenarios:', error);
      setInsights('מצטער, אירעה שגיאה ביצירת התרחישים. אנא נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateYearlySummary = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();
      const currentYear = new Date().getFullYear();
      
      const prompt = `צור סיכום פיננסי שנתי מקיף עבור ${currentYear}:

📊 סיכום שנתי (12 חודשים):
- סה"כ הכנסות: ₪${(data.avgIncome * 12).toLocaleString()}
- סה"כ הוצאות: ₪${(data.avgExpenses * 12).toLocaleString()}
- סה"כ חיסכון: ₪${(data.avgSavings * 12).toLocaleString()}

📈 מגמות שנתיות:
- מגמת הכנסות: ${data.incomeGrowth > 0 ? '📈' : '📉'} ${Math.abs(data.incomeGrowth).toFixed(1)}%
- מגמת הוצאות: ${data.expenseGrowth > 0 ? '📈' : '📉'} ${Math.abs(data.expenseGrowth).toFixed(1)}%

📅 פירוט חודשי:
${data.last12Months.map((m, i) => 
  `${i+1}. ${m.month}: הכנסות ₪${m.income.toLocaleString()}, הוצאות ₪${m.expenses.toLocaleString()}, חיסכון ₪${m.savings.toLocaleString()}`
).join('\n')}

צור סיכום שנתי מקיף:
1️⃣ ציון כללי לשנה (1-10)
2️⃣ 5 ההישגים הגדולים
3️⃣ 5 הלקחים החשובים
4️⃣ ניתוח מגמות ודפוסים
5️⃣ תחזית לשנה הבאה
6️⃣ תוכנית אסטרטגית
7️⃣ המלצות אסטרטגיות

כתוב בצורה משמעותית ומעמיקה.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setInsights(response);
    } catch (error) {
      console.error('Error generating yearly summary:', error);
      setInsights('מצטער, אירעה שגיאה ביצירת הסיכום השנתי. אנא נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeDebts = async () => {
    setIsAnalyzing(true);
    try {
      const data = generateFinancialData();
      
      if (data.debts.length === 0) {
        setInsights('🎉 מעולה! אין לך חובות פעילים כרגע. המשך לנהל את הכספים שלך בחוכמה!\n\n💡 המלצות:\n- שקול להקים קרן חירום של 3-6 חודשי הוצאות\n- השקע את העודפים בתיק השקעות מגוון\n- המשך להימנע מחובות צרכניים');
        setIsAnalyzing(false);
        return;
      }

      const prompt = `אתה מומחה אליטה לאופטימיזציה וניהול חובות עם ניסיון של 20+ שנה. נתח והמלץ על אסטרטגיה אגרסיבית ומדויקת:

💳 ניתוח מפורט של חובות:
${data.debts.map((d, i) => {
  const monthlyInterest = (d.current_balance * d.interest_rate / 100 / 12);
  const principal = d.monthly_payment - monthlyInterest;
  const effectiveRate = d.monthly_payment > 0 ? (monthlyInterest / d.monthly_payment * 100) : 0;
  const monthsLeft = principal > 0 ? Math.ceil(d.current_balance / principal) : 999;
  const totalInterestRemaining = monthlyInterest * monthsLeft;
  
  return `${i + 1}. ${d.name} (${d.type})
   💰 יתרה: ₪${d.current_balance?.toLocaleString()}
   📊 ריבית שנתית: ${d.interest_rate}%
   💵 תשלום חודשי: ₪${d.monthly_payment?.toLocaleString()}
   🔍 מתוכם ריבית: ₪${monthlyInterest.toFixed(0)} (${effectiveRate.toFixed(1)}%)
   📈 מתוכם קרן: ₪${principal.toFixed(0)}
   ⏱️ חודשים נותרים: ${monthsLeft < 999 ? monthsLeft : 'לא מוגדר'}
   💸 סה"כ ריבית צפויה: ₪${totalInterestRemaining.toFixed(0)}
   📦 חוב מקורי: ₪${d.original_amount?.toLocaleString()}
   ✅ אחוז פירעון: ${((d.original_amount - d.current_balance) / d.original_amount * 100).toFixed(1)}%`;
}).join('\n\n')}

💰 יכולת תשלום ומשאבים:
- תזרים חודשי פנוי: ₪${(data.totalIncome - data.totalExpenses).toLocaleString()}
- סה"כ תשלומי חובות: ₪${data.debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0).toLocaleString()}
- חיסכון זמין: ₪${data.totalSavings.toLocaleString()}
- ריבית ממוצעת משוקללת: ${(data.debts.reduce((sum, d) => sum + (d.current_balance * d.interest_rate), 0) / data.totalDebt).toFixed(2)}%

ספק אסטרטגיית אופטימיזציה אגרסיבית ומדויקת:

1️⃣ דירוג מתקדם של חובות לפירעון:
   
   📈 שיטת Avalanche (ריבית גבוהה → נמוכה):
   - דרג את כל החובות לפי ריבית
   - חשב לכל חוב: חיסכון בריבית אם מפרעים אותו קודם
   - זמן פירעון כולל
   - סה"כ חיסכון
   
   ⛰️ שיטת Snowball (חוב קטן → גדול):
   - דרג את כל החובות לפי גודל
   - זמן עד ניצחון ראשון
   - השפעה פסיכולוגית
   - סה"כ זמן פירעון
   
   🎯 שיטת Hybrid מותאמת אישית:
   - איזון בין חיסכון בריבית למוטיבציה
   - המלצה לסדר פירעון אופטימלי
   - נימוק לכל החלטה

2️⃣ סימולציות מפורטות של הגדלת תשלומים:
   
   💪 תרחיש +10% (₪X נוסף לחודש):
   - זמן חדש לפירעון כל חוב
   - חיסכון בריבית לכל חוב
   - סה"כ חיסכון בריבית
   - זמן שנחסך בחודשים
   
   🚀 תרחיש +25% (₪Y נוסף לחודש):
   - [אותם הפרמטרים]
   
   ⚡ תרחיש +50% (₪Z נוסף לחודש):
   - [אותם הפרמטרים]
   
   💎 תרחיש אגרסיבי מקסימלי:
   - השתמש בכל התזרים הפנוי
   - חישובים מלאים

3️⃣ ניתוח רפיננסינג ואיחוד חובות:
   
   🔄 אפשרות 1: איחוד חובות
   - ריבית אחודה אופטימלית (הערכה מציאותית)
   - תשלום חודשי חדש
   - חיסכון חודשי
   - חיסכון כולל לאורך זמן
   - עלויות פתיחה משוערות
   - ROI נטו
   - המלצה: כדאי/לא כדאי
   
   💡 אפשרות 2: רפיננסינג חובות יקרים
   - מיהו החוב היקר ביותר
   - פוטנציאל הורדת ריבית
   - חיסכון משוער
   - דרישות ותנאים
   
   🏦 אפשרות 3: משא ומתן עם הבנק
   - איזה חובות מתאימים
   - אסטרטגיה למשא ומתן
   - פוטנציאל חיסכון

4️⃣ תוכנית פעולה מפורטת ב-12 חודשים:
   
   חודש 1-3:
   - פעולות ספציפיות
   - יעדים למדידה
   
   חודש 4-6:
   - [המשך התוכנית]
   
   חודש 7-9:
   - [המשך התוכנית]
   
   חודש 10-12:
   - [המשך התוכנית]
   
   אבני דרך חשובות:
   - מתי תסיים לפרוע את החוב הראשון
   - מתי תגיע למחצית הדרך
   - מתי תהיה חופשי מחובות

5️⃣ אסטרטגיות מתקדמות נוספות:
   - שימוש בחיסכון לפירעון (כדאי/לא כדאי)
   - העברת יתרה לכרטיס 0% ריבית
   - הלוואות peer-to-peer
   - מכירת נכסים (אם רלוונטי)
   
6️⃣ מניעת החלקה חזרה לחובות:
   - הקמת קרן חירום
   - תקציב חודשי
   - שימוש בדביט במקום אשראי
   - מעקב אוטומטי

7️⃣ חישוב השפעה על שווי נקי:
   - שווי נקי נוכחי
   - שווי נקי צפוי בעוד 12 חודשים
   - שווי נקי בסיום פירעון כל החובות

סכם עם המלצה חד-משמעית והצעת פעולה הבאה הכי חשובה שצריך לעשות מחר.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      setInsights(response);
    } catch (error) {
      console.error('Error optimizing debts:', error);
      setInsights('מצטער, אירעה שגיאה בניתוח החובות. אנא נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto" dir="rtl">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />יועץ פיננסי AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">קבל המלצות מותאמות אישית</p>
        </div>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">היועץ הפיננסי AI זמין למנויי Premium</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">שדרג למנוי Premium וקבל גישה ליועץ פיננסי AI מתקדם</p>
            <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg"><Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-1" /><p className="text-xs font-medium">ניתוח AI</p></div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" /><p className="text-xs font-medium">תחזיות</p></div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg"><Target className="w-6 h-6 text-green-600 mx-auto mb-1" /><p className="text-xs font-medium">המלצות</p></div>
            </div>
            <Link to={createPageUrl('Subscription')}>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Sparkles className="w-4 h-4 ml-2" />שדרג ל-Premium
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />יועץ פיננסי AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">קבל המלצות מותאמות אישית</p>
        </div>
        <Button onClick={() => setShowChat(!showChat)} size="sm" className="h-10 bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 ml-2" />{showChat ? 'סגור צ\'אט' : 'פתח צ\'אט'}
        </Button>
      </div>

      {showChat && <ChatInterface />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortfolioAnalysis investments={investments} />
        <OpportunityDetector />
      </div>

      <FinancialPlanGenerator />

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div><h3 className="text-sm font-semibold text-gray-900 dark:text-white">ניתוח מקיף</h3></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-green-600" />
              </div>
              <div><h3 className="text-sm font-semibold text-gray-900 dark:text-white">המלצות חכמות</h3></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div><h3 className="text-sm font-semibold text-gray-900 dark:text-white">השגת יעדים</h3></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Buttons */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">ניתוחים פיננסיים</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button onClick={analyzeFinancialHealth} disabled={isAnalyzing} size="sm" className="h-9 text-xs bg-purple-600 hover:bg-purple-700">
              {isAnalyzing ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <><Sparkles className="w-3 h-3 ml-1" />ניתוח מקיף</>}
            </Button>
            <Button onClick={generateMonthlySummary} disabled={isAnalyzing} size="sm" className="h-9 text-xs bg-green-600 hover:bg-green-700"><AlertCircle className="w-3 h-3 ml-1" />סיכום חודשי</Button>
            <Button onClick={generateYearlySummary} disabled={isAnalyzing} size="sm" className="h-9 text-xs bg-cyan-600 hover:bg-cyan-700"><FileText className="w-3 h-3 ml-1" />סיכום שנתי</Button>
            <Button onClick={generateWhatIfScenario} disabled={isAnalyzing} size="sm" className="h-9 text-xs bg-orange-600 hover:bg-orange-700"><Target className="w-3 h-3 ml-1" />מה אם</Button>
            <Button onClick={optimizeDebts} disabled={isAnalyzing} size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700"><TrendingUp className="w-3 h-3 ml-1" />חובות</Button>
          </div>

          {insights && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-gray-700 rounded-xl border border-purple-200 dark:border-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">ניתוח פיננסי</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words" style={{ lineHeight: '1.7' }}>{insights}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />איך להשתמש?
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-1"><span className="text-xs font-bold text-purple-600">1</span></div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">לחץ ניתוח</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-1"><span className="text-xs font-bold text-purple-600">2</span></div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">פתח צ׳אט</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-1"><span className="text-xs font-bold text-purple-600">3</span></div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">יישם המלצות</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}