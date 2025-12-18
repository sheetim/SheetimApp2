import { base44 } from "@/api/base44Client";

export class NotificationService {
  static async createNotification(data) {
    try {
      return await base44.entities.Notification.create(data);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Budget alerts
  static async notifyBudgetWarning(category, percentage, spent, limit) {
    return this.createNotification({
      title: `⚠️ התראת תקציב - ${category}`,
      message: `הגעת ל-${percentage}% מהתקציב (₪${spent.toLocaleString()} מתוך ₪${limit.toLocaleString()})`,
      type: 'warning',
      priority: percentage >= 90 ? 'high' : 'medium'
    });
  }

  static async notifyBudgetExceeded(category, spent, limit) {
    return this.createNotification({
      title: `🚨 חריגה מתקציב - ${category}`,
      message: `חרגת מהתקציב! הוצאת ₪${spent.toLocaleString()} מתוך ₪${limit.toLocaleString()} מותרים`,
      type: 'warning',
      priority: 'high'
    });
  }

  // Savings goal alerts
  static async notifySavingsGoalProgress(goalName, percentage) {
    return this.createNotification({
      title: `🎯 התקדמות ביעד - ${goalName}`,
      message: `הגעת ל-${percentage}% מהיעד! המשך כך!`,
      type: 'goal',
      priority: 'low'
    });
  }

  static async notifySavingsGoalReached(goalName, amount) {
    return this.createNotification({
      title: `🎉 יעד הושג! - ${goalName}`,
      message: `מזל טוב! הגעת ליעד של ₪${amount.toLocaleString()}!`,
      type: 'success',
      priority: 'medium'
    });
  }

  // Subscription alerts
  static async notifySubscriptionUpgrade(planName) {
    return this.createNotification({
      title: `✨ שודרגת ל-${planName}!`,
      message: `כל התכונות המתקדמות זמינות לך עכשיו. תהנה!`,
      type: 'subscription',
      priority: 'medium'
    });
  }

  static async notifySubscriptionCancellation() {
    return this.createNotification({
      title: `המנוי בוטל`,
      message: `המנוי שלך בוטל. תוכל להמשיך להשתמש עד תום התקופה.`,
      type: 'subscription',
      priority: 'medium'
    });
  }

  static async notifyPaymentSuccess(billingRecord) {
    return this.createNotification({
      title: `✅ התשלום בוצע בהצלחה`,
      message: `חשבונך חויב ב-₪${billingRecord.amount}`,
      type: 'payment',
      priority: 'low'
    });
  }

  // Trial alerts
  static async notifyTrialStarted() {
    return this.createNotification({
      title: `🎁 תקופת ניסיון התחילה!`,
      message: `יש לך 7 ימים ליהנות מכל תכונות Pro בחינם`,
      type: 'subscription',
      priority: 'medium'
    });
  }

  static async notifyTrialEnding(daysLeft) {
    return this.createNotification({
      title: `⏰ תקופת הניסיון מסתיימת בקרוב`,
      message: `נותרו לך ${daysLeft} ימים. שדרג עכשיו כדי לשמור על הגישה`,
      type: 'subscription',
      priority: 'high'
    });
  }

  // Check for upcoming renewals
  static async checkUpcomingRenewal() {
    try {
      const user = await base44.auth.me();
      if (!user || !user.subscription_end_date) return;

      const endDate = new Date(user.subscription_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Check for trial ending
      if (user.is_trial && daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        await this.notifyTrialEnding(daysUntilExpiry);
      }
    } catch (error) {
      console.error('Error checking renewal:', error);
    }
  }

  // Spending insights
  static async notifyUnusualSpending(category, amount, average) {
    const percentAbove = Math.round(((amount - average) / average) * 100);
    return this.createNotification({
      title: `📊 הוצאה חריגה ב${category}`,
      message: `הוצאת ${percentAbove}% יותר מהממוצע בקטגוריה זו`,
      type: 'info',
      priority: 'low'
    });
  }

  static async notifySavingsOpportunity(amount) {
    return this.createNotification({
      title: `💡 הזדמנות לחיסכון!`,
      message: `על בסיס ההוצאות שלך, יכולת לחסוך עד ₪${amount.toLocaleString()} החודש`,
      type: 'info',
      priority: 'low'
    });
  }

  // Future payments
  static async notifyUpcomingPayment(description, amount, daysUntil) {
    return this.createNotification({
      title: `📅 תשלום מתקרב - ${description}`,
      message: `בעוד ${daysUntil} ימים יש לך תשלום של ₪${amount.toLocaleString()}`,
      type: 'info',
      priority: daysUntil <= 3 ? 'high' : 'medium'
    });
  }

  // AI Insights notifications
  static async notifyAIInsight(title, message, actionUrl = null, priority = 'medium') {
    return this.createNotification({
      title: `🤖 ${title}`,
      message,
      type: 'insight',
      priority,
      action_url: actionUrl
    });
  }

  static async notifyOverspending(category, amount, averageAmount) {
    const percentOver = Math.round(((amount - averageAmount) / averageAmount) * 100);
    return this.notifyAIInsight(
      `חריגה בקטגוריית ${category}`,
      `הוצאת ${percentOver}% יותר מהרגיל (₪${amount.toLocaleString()} לעומת ממוצע של ₪${averageAmount.toLocaleString()})`,
      'Transactions',
      'high'
    );
  }

  static async notifyMissedSavingsGoal(goalName, targetAmount, currentAmount) {
    const remaining = targetAmount - currentAmount;
    return this.notifyAIInsight(
      `יעד חיסכון לא מתקדם`,
      `היעד "${goalName}" עדיין רחוק - חסרים ₪${remaining.toLocaleString()} להשלמה`,
      'Savings',
      'medium'
    );
  }

  static async notifyRiskyDebt(debtName, interestRate) {
    return this.notifyAIInsight(
      `חוב בריבית גבוהה`,
      `${debtName} בריבית של ${interestRate}% - מומלץ לפרוע קודם`,
      'Debts',
      'high'
    );
  }
}