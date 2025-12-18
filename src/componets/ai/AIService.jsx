import { base44 } from "@/api/base44Client";
import { format, addMonths, differenceInDays } from "date-fns";
import { NotificationService } from "../notifications/NotificationService";

export const AIService = {
  // Automatic transaction categorization with advanced learning
  async suggestCategory(description, amount, userHistory = []) {
    try {
      // Use extended history for better learning (last 50 transactions)
      const extendedHistory = userHistory.slice(-50);
      
      // Find similar past transactions by keyword matching
      const keywords = description.toLowerCase().split(/\s+/);
      const similarTransactions = extendedHistory.filter(h => {
        const histDesc = h.description?.toLowerCase() || '';
        return keywords.some(kw => histDesc.includes(kw) && kw.length > 2);
      }).slice(-10);

      // Calculate category frequency for similar transactions
      const categoryFrequency = {};
      similarTransactions.forEach(t => {
        categoryFrequency[t.category] = (categoryFrequency[t.category] || 0) + 1;
      });

      // Build enhanced context with pattern recognition
      const historyContext = extendedHistory.length > 0 ? `
היסטוריית למידה מורחבת (50 עסקאות אחרונות):
${extendedHistory.slice(-15).map(h => `- "${h.description}" → ${h.category} (₪${h.amount})`).join('\n')}

עסקאות דומות שזוהו:
${similarTransactions.length > 0 ? similarTransactions.map(h => `- "${h.description}" → ${h.category} (₪${h.amount})`).join('\n') : 'לא נמצאו עסקאות דומות'}

דפוס קטגוריות בעסקאות דומות:
${Object.entries(categoryFrequency).length > 0 ? Object.entries(categoryFrequency)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, freq]) => `- ${cat}: ${freq} פעמים`)
  .join('\n') : 'אין היסטוריה'}` : '';

      const prompt = `אתה מנוע סיווג AI מתקדם עם למידת מכונה עמוקה. אתה לומד מתבניות והתנהגויות של המשתמש לאורך זמן.

תיאור העסקה: "${description}"
סכום: ₪${amount}
${historyContext}

קטגוריות זמינות:
הכנסות: משכורת, עסק_עצמאי, השקעות, אחר_הכנסה
הוצאות: מזון_ומשקאות, קניות, תחבורה, בילויים, שירותים, בריאות, חינוך, דיור, חובות, חיסכון, אחר_הוצאה

הנחיות למידה מתקדמות:
1. אם זיהית עסקאות דומות - שקול את הדפוס הרווח
2. שים לב לסכום - סכומים דומים בדרך כלל מאותה קטגוריה
3. זהה מילות מפתח חזרתיות (למשל: "שופרסל" = מזון, "דלק" = תחבורה)
4. למד מהקשר - אם יש "משכורת" בתיאור, זו כנראה הכנסה
5. שפר את הדיוק מבסיס ההיסטוריה

החזר רקרק את שם הקטגוריה המדויקת ביותר, ללא הסברים.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      return response.trim();
    } catch (error) {
      console.error('Error suggesting category:', error);
      return null;
    }
  },

  // Proactive financial advice
  async generateProactiveAdvice(userId) {
    try {
      const user = await base44.auth.me();
      const transactions = await base44.entities.Transaction.filter(
        { created_by: user.email },
        '-date',
        200
      );
      const budgets = await base44.entities.Budget.filter({ created_by: user.email });
      const savingsGoals = await base44.entities.SavingsGoal.filter({ created_by: user.email });
      const debts = await base44.entities.Debt.filter({ created_by: user.email });

      const currentMonth = format(new Date(), 'yyyy-MM');
      const lastMonth = format(addMonths(new Date(), -1), 'yyyy-MM');
      
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

      const expensesByCategory = {};
      currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'אחר';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (t.amount || 0);
      });

      const lastMonthExpensesByCategory = {};
      lastMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'אחר';
        lastMonthExpensesByCategory[cat] = (lastMonthExpensesByCategory[cat] || 0) + (t.amount || 0);
      });

      const insights = [];

      // 1. ANOMALY DETECTION - Unusual transactions
      const anomalies = this.detectAnomalousTransactions(transactions, currentMonthTransactions);
      anomalies.forEach(anomaly => {
        insights.push({
          type: 'warning',
          title: `🔍 עסקה חריגה זוהתה`,
          message: anomaly.message,
          priority: 'high',
          data: anomaly
        });
      });

      // 2. Category comparison with last month
      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        const lastMonthAmount = lastMonthExpensesByCategory[category] || 0;
        if (lastMonthAmount > 0) {
          const changePercent = ((amount - lastMonthAmount) / lastMonthAmount) * 100;
          if (changePercent > 50 && amount > 500) {
            insights.push({
              type: 'warning',
              title: `📈 עלייה חדה ב${category.replace(/_/g, ' ')}`,
              message: `עלייה של ${changePercent.toFixed(0)}% לעומת חודש קודם (₪${lastMonthAmount.toLocaleString()} → ₪${amount.toLocaleString()})`,
              priority: 'high'
            });
          } else if (changePercent < -30 && lastMonthAmount > 500) {
            insights.push({
              type: 'success',
              title: `✅ חיסכון ב${category.replace(/_/g, ' ')}`,
              message: `ירידה של ${Math.abs(changePercent).toFixed(0)}% לעומת חודש קודם! חסכת ₪${(lastMonthAmount - amount).toLocaleString()}`,
              priority: 'low'
            });
          }
        }
      });

      // Budget alerts
      for (const budget of budgets) {
        if (budget.month === currentMonth) {
          const spent = expensesByCategory[budget.category] || 0;
          const percentage = (spent / budget.monthly_limit) * 100;
          
          if (percentage >= 90 && percentage < 100) {
            insights.push({
              type: 'warning',
              title: `⚠️ התראת תקציב: ${budget.category.replace(/_/g, ' ')}`,
              message: `השתמשת ב-${percentage.toFixed(0)}% מהתקציב. נותרו ₪${(budget.monthly_limit - spent).toLocaleString()}`,
              priority: 'high'
            });
          } else if (percentage >= 100) {
            await NotificationService.notifyBudgetExceeded(
              budget.category,
              spent,
              budget.monthly_limit
            );
          }
        }
      }

      // 3. PERSONALIZED SAVINGS RECOMMENDATIONS
      const savingsRecommendations = this.generatePersonalizedSavingsRecommendations(
        expensesByCategory, 
        lastMonthExpensesByCategory, 
        totalIncome, 
        totalExpenses
      );
      savingsRecommendations.forEach(rec => insights.push(rec));

      // 4. Savings goal progress with detailed forecast
      for (const goal of savingsGoals) {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        const daysToGoal = differenceInDays(new Date(goal.target_date), new Date());
        const remaining = goal.target_amount - goal.current_amount;
        const monthlyNeeded = daysToGoal > 0 ? (remaining / (daysToGoal / 30)) : 0;
        const currentMonthlySavings = totalIncome - totalExpenses;

        if (progress >= 100) {
          await NotificationService.notifyGoalAchieved(goal.name, goal.target_amount);
        } else if (daysToGoal <= 30 && progress < 90) {
          insights.push({
            type: 'warning',
            title: `🎯 יעד חיסכון בסיכון: ${goal.name}`,
            message: `נותרו ${daysToGoal} ימים. תצטרך לחסוך ₪${monthlyNeeded.toLocaleString()} החודש להשגת היעד`,
            priority: 'high',
            data: { goal, monthlyNeeded, daysToGoal }
          });
        } else if (daysToGoal > 30 && currentMonthlySavings > 0) {
          const monthsAtCurrentRate = remaining / currentMonthlySavings;
          const expectedDate = addMonths(new Date(), Math.ceil(monthsAtCurrentRate));
          const goalDate = new Date(goal.target_date);
          
          if (expectedDate > goalDate) {
            const shortfall = monthlyNeeded - currentMonthlySavings;
            insights.push({
              type: 'info',
              title: `📊 תחזית ליעד "${goal.name}"`,
              message: `בקצב הנוכחי תגיע ליעד ב-${format(expectedDate, 'MMMM yyyy', { locale: { code: 'he' } })}. כדי להגיע בזמן, הגדל חיסכון ב-₪${shortfall.toLocaleString()} לחודש`,
              priority: 'medium',
              data: { goal, expectedDate, shortfall }
            });
          } else {
            insights.push({
              type: 'success',
              title: `✨ יעד "${goal.name}" במסלול`,
              message: `מעולה! בקצב הנוכחי תגיע ליעד ב-${format(expectedDate, 'MMMM yyyy', { locale: { code: 'he' } })}, ${Math.round((goalDate - expectedDate) / (1000 * 60 * 60 * 24 * 30))} חודשים לפני המועד!`,
              priority: 'low'
            });
          }
        }
      }

      // Spending pattern analysis
      const highestExpenseCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (highestExpenseCategory) {
        const [category, amount] = highestExpenseCategory;
        const percentage = (amount / totalExpenses) * 100;
        
        if (percentage > 40) {
          insights.push({
            type: 'info',
            title: '📊 דפוס הוצאות',
            message: `${category.replace(/_/g, ' ')} מהווה ${percentage.toFixed(0)}% מההוצאות שלך (₪${amount.toLocaleString()}). שקול אופטימיזציה`,
            priority: 'medium'
          });
        }
      }

      // Debt optimization
      const highInterestDebts = debts.filter(d => d.interest_rate > 15);
      if (highInterestDebts.length > 0) {
        const totalHighInterest = highInterestDebts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
        insights.push({
          type: 'warning',
          title: '💳 חובות עם ריבית גבוהה',
          message: `יש לך ₪${totalHighInterest.toLocaleString()} בחובות עם ריבית מעל 15%. רפיננסינג יכול לחסוך ₪${Math.round(totalHighInterest * 0.05).toLocaleString()} בשנה`,
          priority: 'high'
        });
      }

      // Savings rate
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      if (savingsRate < 10 && totalIncome > 0) {
        const targetSavings = totalIncome * 0.2;
        const currentSavings = totalIncome - totalExpenses;
        const gap = targetSavings - currentSavings;
        insights.push({
          type: 'info',
          title: '💰 שיעור חיסכון נמוך',
          message: `שיעור החיסכון שלך ${savingsRate.toFixed(1)}%. כדי להגיע ל-20% המומלצים, חסוך עוד ₪${gap.toLocaleString()} בחודש`,
          priority: 'medium'
        });
      } else if (savingsRate >= 20) {
        insights.push({
          type: 'success',
          title: '🌟 שיעור חיסכון מצוין!',
          message: `שיעור החיסכון שלך ${savingsRate.toFixed(1)}% - מעל המומלץ! שקול להשקיע את העודף`,
          priority: 'low'
        });
      }

      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } catch (error) {
      console.error('Error generating proactive advice:', error);
      return [];
    }
  },

  // Detect anomalous transactions
  detectAnomalousTransactions(allTransactions, currentMonthTransactions) {
    const anomalies = [];
    
    // Calculate average and std dev per category from historical data
    const categoryStats = {};
    const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(t => {
      const cat = t.category || 'אחר';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { amounts: [], sum: 0, count: 0 };
      }
      categoryStats[cat].amounts.push(t.amount || 0);
      categoryStats[cat].sum += t.amount || 0;
      categoryStats[cat].count++;
    });

    // Calculate mean and std dev
    Object.keys(categoryStats).forEach(cat => {
      const stats = categoryStats[cat];
      stats.mean = stats.sum / stats.count;
      const squaredDiffs = stats.amounts.map(a => Math.pow(a - stats.mean, 2));
      stats.stdDev = Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / stats.count);
    });

    // Check current month transactions for anomalies
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'אחר';
        const stats = categoryStats[cat];
        
        if (stats && stats.count >= 3 && stats.stdDev > 0) {
          const zScore = (t.amount - stats.mean) / stats.stdDev;
          
          // If z-score > 2.5, it's anomalous (outside 98.7% of normal distribution)
          if (zScore > 2.5 && t.amount > stats.mean * 2) {
            anomalies.push({
              transaction: t,
              category: cat,
              amount: t.amount,
              avgAmount: Math.round(stats.mean),
              deviation: Math.round((t.amount / stats.mean - 1) * 100),
              message: `"${t.description || cat.replace(/_/g, ' ')}" בסך ₪${t.amount.toLocaleString()} - ${Math.round((t.amount / stats.mean - 1) * 100)}% מעל הממוצע בקטגוריה (₪${Math.round(stats.mean).toLocaleString()})`
            });
          }
        }
      });

    return anomalies.slice(0, 3); // Return top 3 anomalies
  },

  // Generate personalized savings recommendations
  generatePersonalizedSavingsRecommendations(currentExpenses, lastMonthExpenses, totalIncome, totalExpenses) {
    const recommendations = [];
    
    // Find categories with potential for savings
    const sortedCategories = Object.entries(currentExpenses)
      .sort(([,a], [,b]) => b - a);

    // Top spending categories analysis
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const topPercentage = totalExpenses > 0 ? (topAmount / totalExpenses) * 100 : 0;
      
      if (topPercentage > 30 && topAmount > 1000) {
        const potentialSaving = Math.round(topAmount * 0.15);
        recommendations.push({
          type: 'info',
          title: `💡 הזדמנות חיסכון ב${topCategory.replace(/_/g, ' ')}`,
          message: `קטגוריה זו היא ${topPercentage.toFixed(0)}% מההוצאות. הפחתה של 15% תחסוך ₪${potentialSaving.toLocaleString()} בחודש (₪${(potentialSaving * 12).toLocaleString()} בשנה)`,
          priority: 'medium',
          data: { category: topCategory, potentialSaving, annualSaving: potentialSaving * 12 }
        });
      }
    }

    // Recurring expenses optimization
    const recurringCategories = ['שירותים', 'בילויים', 'קניות'];
    recurringCategories.forEach(cat => {
      const current = currentExpenses[cat] || 0;
      const last = lastMonthExpenses[cat] || 0;
      
      if (current > 500 && current > last) {
        recommendations.push({
          type: 'info',
          title: `🔄 בדוק הוצאות חוזרות ב${cat}`,
          message: `הוצאות ${cat} עלו מ-₪${last.toLocaleString()} ל-₪${current.toLocaleString()}. בדוק מנויים ושירותים שאינם בשימוש`,
          priority: 'low'
        });
      }
    });

    // Income to expense ratio optimization
    if (totalIncome > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      if (expenseRatio > 80) {
        const targetReduction = Math.round(totalExpenses * 0.1);
        recommendations.push({
          type: 'warning',
          title: '⚠️ יחס הוצאות להכנסות גבוה',
          message: `${expenseRatio.toFixed(0)}% מההכנסה הולכת להוצאות. הפחתה של 10% (₪${targetReduction.toLocaleString()}) תשפר משמעותית את היכולת לחסוך`,
          priority: 'high'
        });
      }
    }

    return recommendations;
  },

  // Predict future balances
  async predictFutureBalance(months = 6) {
    try {
      const user = await base44.auth.me();
      const transactions = await base44.entities.Transaction.filter(
        { created_by: user.email },
        '-date',
        200
      );

      // Calculate historical monthly averages
      const monthlyData = {};
      transactions.forEach(t => {
        if (!t.date) return;
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
          monthlyData[month].income += t.amount || 0;
        } else {
          monthlyData[month].expenses += t.amount || 0;
        }
      });

      const monthlyArray = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12); // Last 12 months

      if (monthlyArray.length === 0) {
        return { predictions: [], currentBalance: 0, alert: null };
      }

      const avgIncome = monthlyArray.reduce((sum, [, data]) => sum + data.income, 0) / monthlyArray.length;
      const avgExpenses = monthlyArray.reduce((sum, [, data]) => sum + data.expenses, 0) / monthlyArray.length;
      const avgSavings = avgIncome - avgExpenses;

      // Calculate trends
      const recentMonths = monthlyArray.slice(-3);
      const olderMonths = monthlyArray.slice(0, 3);
      
      const recentAvgIncome = recentMonths.reduce((sum, [, data]) => sum + data.income, 0) / recentMonths.length;
      const olderAvgIncome = olderMonths.reduce((sum, [, data]) => sum + data.income, 0) / olderMonths.length;
      const incomeGrowthRate = olderAvgIncome > 0 ? (recentAvgIncome - olderAvgIncome) / olderAvgIncome : 0;

      const recentAvgExpenses = recentMonths.reduce((sum, [, data]) => sum + data.expenses, 0) / recentMonths.length;
      const olderAvgExpenses = olderMonths.reduce((sum, [, data]) => sum + data.expenses, 0) / olderMonths.length;
      const expenseGrowthRate = olderAvgExpenses > 0 ? (recentAvgExpenses - olderAvgExpenses) / olderAvgExpenses : 0;

      // Predict future months
      const predictions = [];
      let cumulativeBalance = 0;
      let shortfallMonths = [];

      for (let i = 1; i <= months; i++) {
        const projectedIncome = avgIncome * (1 + incomeGrowthRate * i / 12);
        const projectedExpenses = avgExpenses * (1 + expenseGrowthRate * i / 12);
        const monthlyBalance = projectedIncome - projectedExpenses;
        cumulativeBalance += monthlyBalance;

        const forecastDate = addMonths(new Date(), i);
        
        predictions.push({
          month: format(forecastDate, 'yyyy-MM'),
          monthName: format(forecastDate, 'MMM yyyy', { locale: { code: 'he' } }),
          projectedIncome: Math.round(projectedIncome),
          projectedExpenses: Math.round(projectedExpenses),
          monthlyBalance: Math.round(monthlyBalance),
          cumulativeBalance: Math.round(cumulativeBalance)
        });

        if (monthlyBalance < 0) {
          shortfallMonths.push({
            month: format(forecastDate, 'MMM yyyy', { locale: { code: 'he' } }),
            shortfall: Math.round(Math.abs(monthlyBalance))
          });
        }
      }

      // Generate alert if shortfalls detected
      let alert = null;
      if (shortfallMonths.length > 0) {
        alert = {
          type: 'warning',
          title: 'חוסר צפוי בתזרים המזומנים',
          message: `צפוי חוסר ב-${shortfallMonths.length} חודשים. הראשון: ${shortfallMonths[0].month} (₪${shortfallMonths[0].shortfall})`,
          shortfalls: shortfallMonths
        };
      } else if (cumulativeBalance > avgIncome * 3) {
        alert = {
          type: 'success',
          title: 'עודף חיסכון צפוי',
          message: `צפוי עודף של ₪${Math.round(cumulativeBalance)} ב-${months} חודשים. שקול השקעה`,
        };
      }

      return {
        predictions,
        currentBalance: cumulativeBalance,
        avgIncome: Math.round(avgIncome),
        avgExpenses: Math.round(avgExpenses),
        avgSavings: Math.round(avgSavings),
        incomeGrowthRate: (incomeGrowthRate * 100).toFixed(1),
        expenseGrowthRate: (expenseGrowthRate * 100).toFixed(1),
        alert
      };
    } catch (error) {
      console.error('Error predicting future balance:', error);
      return { predictions: [], currentBalance: 0, alert: null };
    }
  },

  // Advanced financial health score
  async calculateHealthScore(financialData) {
    const {
      totalIncome,
      totalExpenses,
      totalDebt,
      totalSavings,
      portfolioValue,
      savingsGoals,
      debts
    } = financialData;

    let score = 100;
    const factors = [];

    // 1. Savings Rate (30 points)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    if (savingsRate < 5) {
      score -= 30;
      factors.push({ factor: 'שיעור חיסכון נמוך מאוד', impact: -30, recommendation: 'הגדל חיסכון ל-20% לפחות' });
    } else if (savingsRate < 10) {
      score -= 20;
      factors.push({ factor: 'שיעור חיסכון נמוך', impact: -20, recommendation: 'שאף ל-20% חיסכון' });
    } else if (savingsRate < 15) {
      score -= 10;
      factors.push({ factor: 'שיעור חיסכון סביר', impact: -10, recommendation: 'שפר ל-20%' });
    } else if (savingsRate >= 20) {
      factors.push({ factor: 'שיעור חיסכון מצוין', impact: 0, recommendation: 'המשך כך!' });
    }

    // 2. Debt to Income Ratio (25 points)
    const monthlyDebtPayments = debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0);
    const debtToIncomeRatio = totalIncome > 0 ? (monthlyDebtPayments / totalIncome) * 100 : 0;
    if (debtToIncomeRatio > 40) {
      score -= 25;
      factors.push({ factor: 'חוב גבוה מדי', impact: -25, recommendation: 'דחוף: הקטן חובות' });
    } else if (debtToIncomeRatio > 30) {
      score -= 15;
      factors.push({ factor: 'רמת חוב גבוהה', impact: -15, recommendation: 'פרע חובות מהר יותר' });
    } else if (debtToIncomeRatio > 20) {
      score -= 5;
      factors.push({ factor: 'רמת חוב בינונית', impact: -5, recommendation: 'המשך לשלוט בחובות' });
    }

    // 3. Emergency Fund (20 points)
    const monthlyExpenses = totalExpenses;
    const emergencyFundMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
    if (emergencyFundMonths < 1) {
      score -= 20;
      factors.push({ factor: 'אין קרן חירום', impact: -20, recommendation: 'דחוף: בנה קרן חירום' });
    } else if (emergencyFundMonths < 3) {
      score -= 15;
      factors.push({ factor: 'קרן חירום לא מספיקה', impact: -15, recommendation: 'הגדל ל-6 חודשים' });
    } else if (emergencyFundMonths < 6) {
      score -= 5;
      factors.push({ factor: 'קרן חירום סבירה', impact: -5, recommendation: 'שפר ל-6 חודשים' });
    }

    // 4. Investment Diversification (15 points)
    if (portfolioValue === 0 && totalSavings > monthlyExpenses * 6) {
      score -= 15;
      factors.push({ factor: 'אין השקעות', impact: -15, recommendation: 'התחל להשקיע' });
    } else if (portfolioValue < totalSavings * 0.3) {
      score -= 8;
      factors.push({ factor: 'השקעות מוגבלות', impact: -8, recommendation: 'הגדל השקעות' });
    }

    // 5. Goal Progress (10 points)
    const goalsOnTrack = savingsGoals.filter(g => {
      const progress = g.current_amount / g.target_amount;
      return progress >= 0.5;
    }).length;
    const totalGoals = savingsGoals.length;
    if (totalGoals > 0 && goalsOnTrack / totalGoals < 0.5) {
      score -= 10;
      factors.push({ factor: 'יעדים לא בדרך', impact: -10, recommendation: 'התמקד ביעדים' });
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      grade: score >= 90 ? 'מצוין' : score >= 80 ? 'טוב מאוד' : score >= 70 ? 'טוב' : score >= 60 ? 'בינוני' : 'דורש שיפור',
      factors,
      savingsRate: savingsRate.toFixed(1),
      debtToIncomeRatio: debtToIncomeRatio.toFixed(1),
      emergencyFundMonths: emergencyFundMonths.toFixed(1)
    };
  },

  // Personalized savings recommendations
  async generateSavingsRecommendations() {
    try {
      const user = await base44.auth.me();
      const transactions = await base44.entities.Transaction.filter(
        { created_by: user.email },
        '-date',
        100
      );
      const savingsGoals = await base44.entities.SavingsGoal.filter({ created_by: user.email });

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

      const expensesByCategory = {};
      currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'אחר';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (t.amount || 0);
      });

      const prompt = `אתה יועץ חיסכון מומחה. בהתבסס על הנתונים הבאים, ספק 5 המלצות חיסכון ספציפיות ומעשיות:

הכנסות חודשיות: ₪${totalIncome.toLocaleString()}
הוצאות חודשיות: ₪${totalExpenses.toLocaleString()}
תזרים חודשי: ₪${(totalIncome - totalExpenses).toLocaleString()}

פילוח הוצאות:
${Object.entries(expensesByCategory)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, amount]) => `- ${cat.replace(/_/g, ' ')}: ₪${amount.toLocaleString()} (${(amount/totalExpenses*100).toFixed(1)}%)`)
  .join('\n')}

יעדי חיסכון:
${savingsGoals.map(g => {
  const progress = (g.current_amount / g.target_amount * 100).toFixed(1);
  return `- ${g.name}: ${progress}% (₪${g.current_amount?.toLocaleString()} / ₪${g.target_amount?.toLocaleString()})`;
}).join('\n') || 'אין יעדים מוגדרים'}

ספק 5 המלצות בפורמט הבא (כל המלצה בשורה נפרדת):
1. [קטגוריה]: [פעולה ספציפית] - חיסכון משוער: ₪[סכום]
2. ...

דגש על פעולות מעשיות וקונקרטיות עם סכומים ספציפיים.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
      });

      return response;
    } catch (error) {
      console.error('Error generating savings recommendations:', error);
      return null;
    }
  },

  // Deep spending pattern analysis
  async analyzeSpendingPatterns(transactions) {
    try {
      const last90Days = transactions.filter(t => {
        const daysAgo = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= 90;
      });

      // Analyze by day of week
      const byDayOfWeek = {};
      const byTimeOfMonth = { early: 0, mid: 0, late: 0 };
      const recurring = [];

      last90Days.forEach(t => {
        if (t.type === 'expense') {
          const date = new Date(t.date);
          const day = date.getDay();
          byDayOfWeek[day] = (byDayOfWeek[day] || 0) + t.amount;

          const dayOfMonth = date.getDate();
          if (dayOfMonth <= 10) byTimeOfMonth.early += t.amount;
          else if (dayOfMonth <= 20) byTimeOfMonth.mid += t.amount;
          else byTimeOfMonth.late += t.amount;

          // Detect potential recurring transactions
          if (t.description) {
            const existing = recurring.find(r => r.description === t.description);
            if (existing) {
              existing.count++;
              existing.totalAmount += t.amount;
            } else {
              recurring.push({ description: t.description, count: 1, totalAmount: t.amount, category: t.category });
            }
          }
        }
      });

      const potentialRecurring = recurring.filter(r => r.count >= 2);
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const highestSpendDay = Object.keys(byDayOfWeek).reduce((a, b) => 
        byDayOfWeek[a] > byDayOfWeek[b] ? a : b
      );

      return {
        byDayOfWeek: Object.entries(byDayOfWeek).map(([day, amount]) => ({
          day: dayNames[day],
          amount
        })),
        highestSpendDay: dayNames[highestSpendDay],
        highestSpendAmount: byDayOfWeek[highestSpendDay],
        byTimeOfMonth,
        recurringTransactions: potentialRecurring.slice(0, 5)
      };
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return null;
    }
  },

  // Advanced portfolio analysis
  async analyzeInvestmentPortfolio(investments) {
    try {
      if (!investments || investments.length === 0) {
        return {
          score: 0,
          diversification: 'אין תיק השקעות',
          recommendations: ['התחל להשקיע בתיק מגוון'],
          riskLevel: 'N/A'
        };
      }

      // Use live exchange rates
      const { convertInvestmentsToILS } = await import('../utils/currencyUtils');
      const investmentsInILS = await convertInvestmentsToILS(investments);
      
      const totalValue = investmentsInILS.reduce((sum, inv) => sum + inv.valueInILS, 0);
      const totalCost = investmentsInILS.reduce((sum, inv) => sum + inv.costInILS, 0);

      const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100) : 0;

      // Analyze diversification by type (using pre-converted values)
      const byType = {};
      investmentsInILS.forEach(inv => {
        const type = inv.type || 'אחר';
        byType[type] = (byType[type] || 0) + inv.valueInILS;
      });

      const diversificationScore = Object.keys(byType).length;
      const largestPosition = Math.max(...Object.values(byType));
      const largestPositionPct = (largestPosition / totalValue) * 100;

      // Calculate performance (considering each investment individually, not currency-converted)
      const winners = investments.filter(inv => {
        const gain = ((inv.current_price - inv.purchase_price) / inv.purchase_price) * 100;
        return gain > 0;
      }).length;

      const winRate = investments.length > 0 ? (winners / investments.length) * 100 : 0;

      const recommendations = [];
      
      if (diversificationScore < 3) {
        recommendations.push('הגדל גיוון - השקע לפחות ב-3 סוגי נכסים שונים');
      }
      
      if (largestPositionPct > 40) {
        recommendations.push(`הפוזיציה הגדולה ביותר ${largestPositionPct.toFixed(0)}% - הקטן ריכוזיות`);
      }
      
      if (totalReturn < 5) {
        recommendations.push('התשואה נמוכה מהצפוי - שקול אסטרטגיה אגרסיבית יותר');
      }
      
      if (winRate < 60) {
        recommendations.push('שיעור הצלחה נמוך - שפר בחירת נכסים');
      }

      // Benchmark comparison
      const marketReturn = 7; // Assumed market average
      const alpha = totalReturn - marketReturn;

      return {
        totalValue: Math.round(totalValue),
        totalCost: Math.round(totalCost),
        totalReturn: totalReturn.toFixed(2),
        alpha: alpha.toFixed(2),
        diversificationScore,
        largestPositionPct: largestPositionPct.toFixed(1),
        winRate: winRate.toFixed(1),
        recommendations,
        byType: Object.entries(byType).map(([type, value]) => ({
          type,
          value: Math.round(value),
          percentage: ((value / totalValue) * 100).toFixed(1)
        }))
      };
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      return null;
    }
  },

  // Long-term financial plan generation
  async generateLongTermPlan(userData) {
    try {
      const {
        age,
        retirementAge = 67,
        currentIncome,
        currentExpenses,
        currentSavings,
        currentDebt,
        goals = []
      } = userData;

      const yearsToRetirement = retirementAge - age;
      const monthlySavings = currentIncome - currentExpenses;
      const savingsRate = currentIncome > 0 ? (monthlySavings / currentIncome) * 100 : 0;

      const prompt = `אתה מתכנן פיננסי מומחה. צור תוכנית פיננסית מקיפה ל-${yearsToRetirement} שנים:

📊 מצב נוכחי:
- גיל: ${age}
- הכנסה חודשית: ₪${currentIncome?.toLocaleString() || 0}
- הוצאות חודשיות: ₪${currentExpenses?.toLocaleString() || 0}
- חיסכון נוכחי: ₪${currentSavings?.toLocaleString() || 0}
- חובות: ₪${currentDebt?.toLocaleString() || 0}
- שיעור חיסכון: ${savingsRate.toFixed(1)}%

🎯 יעדים:
${goals.map(g => `- ${g.name}: ₪${g.target_amount?.toLocaleString()} עד ${g.target_date}`).join('\n') || 'אין יעדים מוגדרים'}

צור תוכנית מפורטת הכוללת:

1️⃣ **שלב 1: בסיס (שנים 1-2)**
   - מטרות: בניית קרן חירום, סגירת חובות
   - צעדים קונקרטיים
   - סכומים מדויקים
   - ציון דרך: מתי להתקדם לשלב הבא

2️⃣ **שלב 2: צמיחה (שנים 3-5)**
   - מטרות: הגדלת השקעות, השגת יעדים קצרי טווח
   - אסטרטגיית השקעה
   - חלוקת נכסים מומלצת

3️⃣ **שלב 3: ביסוס (שנים 6-10)**
   - מטרות: רכישות גדולות, השקעות ארוכות טווח
   - תכנון מס
   - אופטימיזציה

4️⃣ **שלב 4: הכנה לפרישה (${Math.max(0, yearsToRetirement - 10)}-${yearsToRetirement} שנים)**
   - מעבר להשקעות שמרניות
   - מקסום חיסכון
   - תכנון פרישה

5️⃣ **תחזיות:**
   - שווי צפוי בכל שלב
   - הכנסה פסיבית צפויה
   - רמת עצמאות פיננסית

6️⃣ **התאמות לפי גיל:**
   - ${age < 30 ? 'צעיר - נטילת סיכונים מחושבת' : age < 45 ? 'בוגר - איזון בין צמיחה לביטחון' : 'מבוגר - שימור הון'}

כתוב בצורה מפורטת, מעשית ומוטיבציה.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return response;
    } catch (error) {
      console.error('Error generating long-term plan:', error);
      return null;
    }
  },

  // Smart opportunity detection with learning
  async detectFinancialOpportunities(historicalData) {
    try {
      const {
        transactions,
        budgets,
        investments,
        savingsGoals,
        debts
      } = historicalData;

      const opportunities = [];

      // 1. Recurring expense optimization
      const recurringExpenses = transactions
        .filter(t => t.type === 'expense' && t.is_recurring)
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
          return acc;
        }, {});

      Object.entries(recurringExpenses).forEach(([category, amount]) => {
        if (amount > 1000) {
          opportunities.push({
            type: 'cost_reduction',
            title: `הפחת הוצאות חוזרות ב${category.replace(/_/g, ' ')}`,
            potential: Math.round(amount * 0.15),
            difficulty: 'בינוני',
            action: `חפש חלופות זולות יותר או נהל מחדש את ${category.replace(/_/g, ' ')}`,
            priority: amount > 2000 ? 'גבוה' : 'בינוני'
          });
        }
      });

      // 2. Investment opportunities
      const cashBalance = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
      const monthlyExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      if (cashBalance > monthlyExpenses * 6 && investments.length < 5) {
        opportunities.push({
          type: 'investment',
          title: 'עודף מזומנים - הזדמנות להשקעה',
          potential: Math.round(cashBalance * 0.07),
          difficulty: 'קל',
          action: `השקע ₪${Math.round(cashBalance * 0.3).toLocaleString()} בתיק מגוון`,
          priority: 'גבוה'
        });
      }

      // 3. Debt refinancing opportunities
      const highInterestDebts = debts.filter(d => d.interest_rate > 12);
      if (highInterestDebts.length > 0) {
        const totalHighInterestDebt = highInterestDebts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
        const potentialSaving = totalHighInterestDebt * 0.05; // 5% saving estimate
        
        opportunities.push({
          type: 'debt_optimization',
          title: 'רפיננסינג חובות עם ריבית גבוהה',
          potential: Math.round(potentialSaving),
          difficulty: 'בינוני',
          action: 'פנה לבנק לרפיננסינג או איחוד חובות',
          priority: 'גבוה'
        });
      }

      // 4. Budget optimization
      budgets.forEach(budget => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === budget.category)
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        if (spent < budget.monthly_limit * 0.7) {
          opportunities.push({
            type: 'budget_reallocation',
            title: `ניצול חסר של תקציב ${budget.category.replace(/_/g, ' ')}`,
            potential: Math.round((budget.monthly_limit - spent) * 0.5),
            difficulty: 'קל',
            action: `הקצה מחדש ₪${Math.round(budget.monthly_limit - spent)} מתקציב זה`,
            priority: 'נמוך'
          });
        }
      });

      // 5. Tax optimization opportunities
      const yearlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      if (yearlyIncome > 200000 && investments.length > 0) {
        opportunities.push({
          type: 'tax_optimization',
          title: 'אופטימיזציית מס',
          potential: Math.round(yearlyIncome * 0.03),
          difficulty: 'מורכב',
          action: 'התייעץ עם יועץ מס לגבי קופת גמל/קרן השתלמות',
          priority: 'בינוני'
        });
      }

      // Sort by potential saving
      return opportunities.sort((a, b) => b.potential - a.potential).slice(0, 5);
    } catch (error) {
      console.error('Error detecting opportunities:', error);
      return [];
    }
  },

  // Decision feedback system
  async provideFeedbackOnDecision(decision) {
    try {
      const {
        type, // 'purchase', 'investment', 'debt', 'savings'
        amount,
        description,
        context
      } = decision;

      const prompt = `אתה יועץ פיננסי מומחה. ספק משוב מעמיק על החלטה פיננסית:

סוג החלטה: ${type}
סכום: ₪${amount?.toLocaleString()}
תיאור: ${description}

הקשר פיננסי:
${JSON.stringify(context, null, 2)}

ספק משוב הכולל:

1️⃣ **הערכת ההחלטה** (1-10)
   - ציון כללי
   - נימוק מפורט

2️⃣ **השפעה פיננסית**
   - השפעה קצרת טווח (חודש)
   - השפעה בינונית (שנה)
   - השפעה ארוכת טווח (5+ שנים)

3️⃣ **סיכונים והזדמנויות**
   - סיכונים פוטנציאליים
   - הזדמנויות חלופיות

4️⃣ **המלצות לשיפור**
   - אם זו החלטה טובה - איך למקסם אותה
   - אם זו החלטה בעייתית - חלופות טובות יותר

5️⃣ **צעדי המשך**
   - מה לעשות אחרי החלטה זו
   - נקודות בקרה ומעקב

כתוב בצורה אמפתית אבל כנה, עם נתונים קונקרטיים.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return response;
    } catch (error) {
      console.error('Error providing feedback:', error);
      return null;
    }
  },

  // Advanced spending pattern analysis by time
  async analyzeTimeBasedSpending(transactions) {
    try {
      if (!transactions || transactions.length === 0) {
        return {
          byDayOfWeek: [],
          byHourOfDay: [],
          byDayOfMonth: {},
          insights: []
        };
      }

      // Filter last 90 days
      const last90Days = transactions.filter(t => {
        if (!t.date) return false;
        const daysAgo = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= 90 && t.type === 'expense';
      });

      // Analyze by day of week
      const byDayOfWeek = Array(7).fill(0).map(() => ({ count: 0, total: 0 }));
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      
      // Analyze by time of month
      const byDayOfMonth = {
        early: { count: 0, total: 0, days: '1-10' },
        mid: { count: 0, total: 0, days: '11-20' },
        late: { count: 0, total: 0, days: '21-31' }
      };

      // Analyze by category over time
      const categoryTrends = {};

      last90Days.forEach(t => {
        const date = new Date(t.date);
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();
        const category = t.category || 'אחר';

        // Day of week
        byDayOfWeek[dayOfWeek].count++;
        byDayOfWeek[dayOfWeek].total += t.amount || 0;

        // Time of month
        if (dayOfMonth <= 10) {
          byDayOfMonth.early.count++;
          byDayOfMonth.early.total += t.amount || 0;
        } else if (dayOfMonth <= 20) {
          byDayOfMonth.mid.count++;
          byDayOfMonth.mid.total += t.amount || 0;
        } else {
          byDayOfMonth.late.count++;
          byDayOfMonth.late.total += t.amount || 0;
        }

        // Category trends
        if (!categoryTrends[category]) {
          categoryTrends[category] = [];
        }
        categoryTrends[category].push({
          date: t.date,
          amount: t.amount
        });
      });

      // Generate insights
      const insights = [];

      // Find highest spending day
      const maxDayIndex = byDayOfWeek.reduce((maxIdx, day, idx, arr) => 
        day.total > arr[maxIdx].total ? idx : maxIdx, 0
      );
      const maxDay = dayNames[maxDayIndex];
      const maxDayAmount = byDayOfWeek[maxDayIndex].total;
      const avgDayAmount = byDayOfWeek.reduce((sum, d) => sum + d.total, 0) / 7;

      if (maxDayAmount > avgDayAmount * 1.5) {
        insights.push({
          type: 'day_pattern',
          title: `יום ${maxDay} - יום הוצאות שיא`,
          message: `אתה מוציא בממוצע ₪${Math.round(maxDayAmount)} ביום ${maxDay}, ${Math.round((maxDayAmount / avgDayAmount - 1) * 100)}% יותר מימים אחרים`,
          recommendation: `תכנן קניות וביטקניות גדולות ליום אחר`,
          priority: 'בינוני'
        });
      }

      // Time of month pattern
      const monthParts = Object.entries(byDayOfMonth).sort(([,a], [,b]) => b.total - a.total);
      const highestPart = monthParts[0];
      
      if (highestPart[1].total > last90Days.reduce((sum, t) => sum + (t.amount || 0), 0) * 0.4) {
        insights.push({
          type: 'month_pattern',
          title: `תבנית הוצאות ב${highestPart[0] === 'early' ? 'תחילת' : highestPart[0] === 'mid' ? 'אמצע' : 'סוף'} החודש`,
          message: `${Math.round((highestPart[1].total / last90Days.reduce((sum, t) => sum + (t.amount || 0), 0)) * 100)}% מההוצאות שלך ב-${highestPart[1].days} לחודש (₪${Math.round(highestPart[1].total)})`,
          recommendation: 'פזר הוצאות לאורך החודש לשליטה טובה יותר',
          priority: 'בינוני'
        });
      }

      // Category acceleration detection
      Object.entries(categoryTrends).forEach(([category, txs]) => {
        if (txs.length >= 5) {
          const sorted = txs.sort((a, b) => a.date.localeCompare(b.date));
          const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
          const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
          
          const firstAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg * 1.3) {
            insights.push({
              type: 'category_acceleration',
              title: `הוצאות ${category} בעלייה`,
              message: `הוצאות בקטגוריה זו עלו ב-${Math.round((secondAvg / firstAvg - 1) * 100)}% (מ-₪${Math.round(firstAvg)} ל-₪${Math.round(secondAvg)} בממוצע)`,
              recommendation: 'בדוק למה ההוצאות בקטגוריה זו גדלות',
              priority: 'גבוה'
            });
          }
        }
      });

      // Weekend spending
      const weekendTotal = byDayOfWeek[5].total + byDayOfWeek[6].total;
      const weekdayTotal = byDayOfWeek.slice(0, 5).reduce((sum, d) => sum + d.total, 0);
      const weekendAvg = weekendTotal / 2;
      const weekdayAvg = weekdayTotal / 5;

      if (weekendAvg > weekdayAvg * 1.4) {
        insights.push({
          type: 'weekend_spending',
          title: 'הוצאות סופי שבוע גבוהות',
          message: `אתה מוציא ₪${Math.round(weekendAvg)} בממוצע בסופ"ש, ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% יותר מאשר בימי חול`,
          recommendation: 'שקול פעילויות סופ"ש זולות יותר',
          priority: 'בינוני'
        });
      }

      return {
        byDayOfWeek: byDayOfWeek.map((day, idx) => ({
          day: dayNames[idx],
          count: day.count,
          total: Math.round(day.total),
          average: day.count > 0 ? Math.round(day.total / day.count) : 0
        })),
        byDayOfMonth: Object.entries(byDayOfMonth).map(([period, data]) => ({
          period,
          days: data.days,
          count: data.count,
          total: Math.round(data.total),
          average: data.count > 0 ? Math.round(data.total / data.count) : 0
        })),
        categoryTrends: Object.entries(categoryTrends).map(([category, txs]) => ({
          category,
          transactionCount: txs.length,
          totalAmount: Math.round(txs.reduce((sum, t) => sum + t.amount, 0))
        })),
        insights: insights.sort((a, b) => {
          const priorityOrder = { 'גבוה': 3, 'בינוני': 2, 'נמוך': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
      };
    } catch (error) {
      console.error('Error analyzing time-based spending:', error);
      return { byDayOfWeek: [], byDayOfMonth: {}, insights: [] };
    }
  },

  // Goal setting assistance
  async suggestGoal(userContext) {
    try {
      const prompt = `בהתבסס על המידע הבא, המלץ על יעד חיסכון ריאלי ומותאם אישית:

${userContext}

ספק המלצה בפורמט JSON:
{
  "name": "שם יעד מושך",
  "target_amount": סכום_ממספר,
  "monthly_contribution": סכום_חודשי_מומלץ,
  "months_to_goal": מספר_חודשים,
  "reason": "הסבר קצר למה זה יעד טוב"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            target_amount: { type: "number" },
            monthly_contribution: { type: "number" },
            months_to_goal: { type: "number" },
            reason: { type: "string" }
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Error suggesting goal:', error);
      return null;
    }
  }
};