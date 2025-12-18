import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Target, Bell, Lightbulb, TrendingDown, Sparkles, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { he } from "date-fns/locale";

export default function AlertsWidget({ transactions, budgets, savingsGoals, debts, investments }) {
  const alerts = [];
  const recommendations = [];
  const aiInsights = [];

  // Check budget alerts
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthTransactions = transactions.filter((t) =>
  t.date && t.date.startsWith(currentMonth) && t.type === 'expense'
  );

  budgets.forEach((budget) => {
    if (budget.month === currentMonth) {
      const spent = currentMonthTransactions.
      filter((t) => t.category === budget.category).
      reduce((sum, t) => sum + (t.amount || 0), 0);

      const percentage = spent / budget.monthly_limit * 100;

      if (percentage >= 100) {
        alerts.push({
          type: 'danger',
          icon: AlertTriangle,
          title: 'חריגה מתקציב!',
          message: `חרגת מהתקציב של ${budget.category?.replace(/_/g, ' ')} ב-${(percentage - 100).toFixed(0)}%`,
          color: 'text-red-600',
          bg: 'bg-red-50'
        });
      } else if (percentage >= budget.alert_threshold) {
        alerts.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'קרוב לחריגה מתקציב',
          message: `השתמשת ב-${percentage.toFixed(0)}% מתקציב ${budget.category?.replace(/_/g, ' ')}`,
          color: 'text-orange-600',
          bg: 'bg-orange-50'
        });
      }
    }
  });

  // Check savings goals
  savingsGoals.forEach((goal) => {
    if (goal.target_date) {
      const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
      const percentage = goal.current_amount / goal.target_amount * 100;

      if (daysLeft <= 30 && percentage < 80) {
        alerts.push({
          type: 'warning',
          icon: Target,
          title: 'יעד חיסכון בסיכון',
          message: `${goal.name}: נותרו ${daysLeft} ימים והושגו רק ${percentage.toFixed(0)}%`,
          color: 'text-orange-600',
          bg: 'bg-orange-50'
        });
      } else if (percentage >= 100) {
        alerts.push({
          type: 'success',
          icon: Target,
          title: 'יעד חיסכון הושג! 🎉',
          message: `השגת את יעד החיסכון "${goal.name}"`,
          color: 'text-green-600',
          bg: 'bg-green-50'
        });
      }
    }
  });

  // Check high expense trend
  const lastMonthExpenses = transactions.
  filter((t) => {
    const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM');
    return t.date && t.date.startsWith(lastMonth) && t.type === 'expense';
  }).
  reduce((sum, t) => sum + (t.amount || 0), 0);

  const currentMonthExpenses = currentMonthTransactions.
  reduce((sum, t) => sum + (t.amount || 0), 0);

  if (lastMonthExpenses > 0) {
    const increase = (currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100;
    if (increase > 20) {
      alerts.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'עלייה בהוצאות',
        message: `ההוצאות שלך עלו ב-${increase.toFixed(0)}% לעומת החודש הקודם`,
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      });
    }
  }

  // Smart recommendations
  const categorySpending = {};
  currentMonthTransactions.forEach((t) => {
    const cat = t.category || 'אחר';
    categorySpending[cat] = (categorySpending[cat] || 0) + (t.amount || 0);
  });

  // Find highest spending category
  const highestCategory = Object.entries(categorySpending).
  sort(([, a], [, b]) => b - a)[0];

  if (highestCategory && highestCategory[1] > 2000) {
    const potentialSavings = highestCategory[1] * 0.15;
    recommendations.push({
      type: 'tip',
      icon: Lightbulb,
      title: 'הזדמנות לחיסכון',
      message: `הקטגוריה "${highestCategory[0].replace(/_/g, ' ')}" היא ההוצאה הגבוהה ביותר שלך (₪${highestCategory[1].toLocaleString()}). חיסכון של 15% יחסוך ₪${potentialSavings.toFixed(0)} בחודש!`,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    });
  }

  // Savings goal recommendation
  const activeGoals = savingsGoals.filter((g) => {
    const progress = g.current_amount / g.target_amount * 100;
    return progress < 100;
  });

  if (activeGoals.length > 0) {
    const nearestGoal = activeGoals.sort((a, b) =>
    new Date(a.target_date) - new Date(b.target_date)
    )[0];

    const remaining = nearestGoal.target_amount - nearestGoal.current_amount;
    const daysLeft = differenceInDays(new Date(nearestGoal.target_date), new Date());
    const monthlyNeeded = remaining / (daysLeft / 30);

    if (monthlyNeeded > 0) {
      recommendations.push({
        type: 'tip',
        icon: Target,
        title: 'המלצה ליעד חיסכון',
        message: `כדי להגיע ליעד "${nearestGoal.name}", חסוך ₪${monthlyNeeded.toFixed(0)} בחודש`,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      });
    }
  }

  // Debt payoff recommendation
  if (debts.length > 0) {
    const highestInterestDebt = debts.sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))[0];

    if (highestInterestDebt && highestInterestDebt.interest_rate) {
      recommendations.push({
        type: 'tip',
        icon: TrendingDown,
        title: 'אסטרטגיית פירעון חובות',
        message: `התמקד בפירעון "${highestInterestDebt.name}" (ריבית ${highestInterestDebt.interest_rate}%) כדי לחסוך בריבית`,
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      });
    }
  }

  // AI-Powered Insights - חריגות משמעותיות
  const last7Days = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= subDays(new Date(), 7) && t.type === 'expense';
  });

  const prevWeek = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7) && t.type === 'expense';
  });

  const thisWeekTotal = last7Days.reduce((sum, t) => sum + (t.amount || 0), 0);
  const prevWeekTotal = prevWeek.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (prevWeekTotal > 0) {
    const weeklyChange = (thisWeekTotal - prevWeekTotal) / prevWeekTotal * 100;

    if (Math.abs(weeklyChange) > 30) {
      aiInsights.push({
        type: 'ai',
        icon: Sparkles,
        title: 'חריגה משמעותית זוהתה!',
        message: `ההוצאות השבועיות שלך ${weeklyChange > 0 ? 'עלו' : 'ירדו'} ב-${Math.abs(weeklyChange).toFixed(0)}% לעומת שבוע שעבר. ${weeklyChange > 0 ? 'בדוק את ההוצאות שלך' : 'כל הכבוד על החיסכון'}!`,
        color: weeklyChange > 0 ? 'text-red-600' : 'text-green-600',
        bg: weeklyChange > 0 ? 'bg-red-50' : 'bg-green-50'
      });
    }
  }

  // התראות על שינוי בשווי תיק השקעות
  if (investments && investments.length > 0) {
    const portfolioValue = investments.reduce((sum, inv) =>
    sum + (inv.quantity || 0) * (inv.current_price || 0), 0
    );

    const portfolioCost = investments.reduce((sum, inv) =>
    sum + (inv.quantity || 0) * (inv.purchase_price || 0), 0
    );

    const portfolioChange = portfolioCost > 0 ? (portfolioValue - portfolioCost) / portfolioCost * 100 : 0;

    // התראה על שינוי משמעותי בתיק
    const savedPortfolioValue = parseFloat(localStorage.getItem('lastPortfolioValue') || portfolioValue);
    const portfolioValueChange = savedPortfolioValue > 0 ? (portfolioValue - savedPortfolioValue) / savedPortfolioValue * 100 : 0;

    if (Math.abs(portfolioValueChange) > 5) {
      alerts.push({
        type: portfolioValueChange > 0 ? 'success' : 'warning',
        icon: PieChart,
        title: 'שינוי משמעותי בתיק ההשקעות',
        message: `תיק ההשקעות שלך ${portfolioValueChange > 0 ? 'עלה' : 'ירד'} ב-${Math.abs(portfolioValueChange).toFixed(1)}% (${portfolioValueChange > 0 ? '+' : '-'}₪${Math.abs(portfolioValue - savedPortfolioValue).toLocaleString()})`,
        color: portfolioValueChange > 0 ? 'text-green-600' : 'text-orange-600',
        bg: portfolioValueChange > 0 ? 'bg-green-50' : 'bg-orange-50'
      });
    }

    // שמור את השווי הנוכחי
    localStorage.setItem('lastPortfolioValue', portfolioValue.toString());

    // המלצה אם יש רווח/הפסד גדול
    if (Math.abs(portfolioChange) > 15) {
      aiInsights.push({
        type: 'ai',
        icon: Sparkles,
        title: 'ניתוח תיק השקעות',
        message: portfolioChange > 0 ?
        `תיק ההשקעות שלך מציג רווח של ${portfolioChange.toFixed(1)}%! שקול לאזן מחדש או לממש חלק מהרווחים.` :
        `תיק ההשקעות שלך בירידה של ${Math.abs(portfolioChange).toFixed(1)}%. זה עשוי להיות זמן טוב לבחון את האסטרטגיה ולשקול רכישה נוספת.`,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      });
    }
  }

  // זיהוי דפוסים חריגים בהוצאות
  const categoryTrends = {};
  last7Days.forEach((t) => {
    const cat = t.category || 'אחר';
    categoryTrends[cat] = (categoryTrends[cat] || 0) + (t.amount || 0);
  });

  const prevCategoryTrends = {};
  prevWeek.forEach((t) => {
    const cat = t.category || 'אחר';
    prevCategoryTrends[cat] = (prevCategoryTrends[cat] || 0) + (t.amount || 0);
  });

  Object.keys(categoryTrends).forEach((cat) => {
    const current = categoryTrends[cat];
    const previous = prevCategoryTrends[cat] || 0;

    if (previous > 0) {
      const change = (current - previous) / previous * 100;
      if (change > 50 && current > 500) {
        aiInsights.push({
          type: 'ai',
          icon: Sparkles,
          title: `זינוק בהוצאות: ${cat.replace(/_/g, ' ')}`,
          message: `ההוצאות בקטגוריה זו עלו ב-${change.toFixed(0)}% השבוע. האם זו הוצאה חד-פעמית או מגמה חדשה?`,
          color: 'text-orange-600',
          bg: 'bg-orange-50'
        });
      }
    }
  });

  const allItems = [...alerts, ...aiInsights, ...recommendations];

  if (allItems.length === 0) {
    return (
      <Card className="md-card md-elevation-2 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell className="w-5 h-5" />
            התראות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="bg-green-500 mb-3 mx-auto rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">הכל תקין! אין התראות כרגע</p>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="md-card md-elevation-2 border-0">
      <CardHeader className="mobile-card-padding">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base md:text-lg">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          התראות והמלצות
          {allItems.length > 0 &&
          <Badge variant="destructive" className="mr-auto text-xs">{allItems.length}</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="mobile-card-padding pt-0">
        <div className="space-y-2 md:space-y-3">
          {allItems.map((alert, idx) => {
            const Icon = alert.icon;
            return (
              <div key={idx} className={`p-3 md:p-4 rounded-lg ${alert.bg} dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all hover:scale-[1.02] active:scale-[0.98] ${alert.type === 'ai' ? 'ring-2 ring-purple-200 dark:ring-purple-800' : ''}`}>
                <div className="flex items-start gap-2 md:gap-3">
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${alert.color} dark:${alert.color} mt-0.5 flex-shrink-0 ${alert.type === 'ai' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    {alert.type === 'ai' &&
                    <Badge className="mb-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">AI Insight</Badge>
                    }
                    <h4 className={`font-semibold ${alert.color} dark:${alert.color.replace('600', '400')} mb-1 text-sm md:text-base`}>{alert.title}</h4>
                    <p className="text-xs md:text-sm text-gray-800 dark:text-white font-medium">{alert.message}</p>
                  </div>
                </div>
              </div>);

          })}
        </div>
      </CardContent>
    </Card>);

}