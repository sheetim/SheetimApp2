// Utility functions for reading and using onboarding data

export function getOnboardingData() {
  try {
    const goals = JSON.parse(localStorage.getItem('sheetim_user_goals') || '[]');
    const importMethod = localStorage.getItem('sheetim_user_import') || null;
    const awareness = localStorage.getItem('sheetim_user_awareness') || null;
    const completed = localStorage.getItem('sheetim_onboarding_completed') === 'true';
    
    return { goals, importMethod, awareness, completed };
  } catch (e) {
    return { goals: [], importMethod: null, awareness: null, completed: false };
  }
}

export function getPrimaryGoal() {
  // First try to get from localStorage (onboarding)
  const { goals } = getOnboardingData();
  if (goals.length > 0) return goals[0];
  return null;
}

export function isOnboardingCompleted() {
  return localStorage.getItem('sheetim_onboarding_completed') === 'true';
}

export function isSmartStartCreated() {
  return localStorage.getItem('sheetim_smart_start_created') === 'true';
}

export function getGoalConfig(goalId) {
  const goalConfigs = {
    stop_minus: {
      title: 'להפסיק את המינוס',
      focus: 'תזרים מזומנים',
      emoji: '💳',
      dashboardHint: 'מתמקדים בצמצום הוצאות ושיפור התזרים',
      aiTone: 'מתמקד בזיהוי דפוסי הוצאות מיותרים ובניית תקציב מאוזן',
      priorityPages: ['Transactions', 'Budgets', 'CashFlow'],
      savingsPercent: 10
    },
    start_investing: {
      title: 'להתחיל להשקיע',
      focus: 'השקעות וחיסכון',
      emoji: '📈',
      dashboardHint: 'מתמקדים בבניית תיק השקעות ראשוני',
      aiTone: 'מתמקד בבניית תיק השקעות מותאם לרמת הסיכון והיעדים שלך',
      priorityPages: ['Investments', 'Savings', 'Retirement'],
      savingsPercent: 15
    },
    close_debts: {
      title: 'לסגור חובות',
      focus: 'ניהול חובות',
      emoji: '🎯',
      dashboardHint: 'מתמקדים בפירעון יעיל של חובות',
      aiTone: 'מתמקד באסטרטגיית פירעון חובות יעילה ומפחיתה עלויות ריבית',
      priorityPages: ['Debts', 'Budgets', 'CashFlow'],
      savingsPercent: 5
    },
    build_savings: {
      title: 'לבנות חיסכון',
      focus: 'יעדי חיסכון',
      emoji: '💰',
      dashboardHint: 'מתמקדים בהגעה ליעדי החיסכון',
      aiTone: 'מתמקד בהגדרת יעדי חיסכון ובניית תוכנית להשגתם',
      priorityPages: ['Savings', 'Budgets', 'NetWorth'],
      savingsPercent: 20
    }
  };
  
  return goalConfigs[goalId] || null;
}

export function getAwarenessConfig(awarenessId) {
  const awarenessConfigs = {
    no_idea: {
      level: 'beginner',
      title: 'מתחיל',
      aiComplexity: 'simple',
      showExplanations: true,
      terminology: 'basic'
    },
    roughly: {
      level: 'intermediate',
      title: 'בינוני',
      aiComplexity: 'moderate',
      showExplanations: true,
      terminology: 'standard'
    },
    tracking: {
      level: 'advanced',
      title: 'מתקדם',
      aiComplexity: 'detailed',
      showExplanations: false,
      terminology: 'professional'
    }
  };
  
  return awarenessConfigs[awarenessId] || awarenessConfigs.roughly;
}

export function getPersonalizedGreeting(goalId, awarenessId) {
  const goal = getGoalConfig(goalId);
  if (!goal) return null;
  
  const greetings = {
    stop_minus: 'בוא נעשה סדר בתזרים ונבין לאן הכסף נעלם 💪',
    start_investing: 'הזמן לגרום לכסף לעבוד בשבילך! 📈',
    close_debts: 'צעד אחד קדימה לחופש פיננסי 🎯',
    build_savings: 'כל שקל נחסך מקרב אותך ליעד! 💰'
  };
  
  return greetings[goalId] || 'בוא נתחיל לנהל את הכסף שלך חכם יותר';
}

export function getRecommendedSavingsPercent(goalId, monthlyIncome) {
  const goal = getGoalConfig(goalId);
  if (!goal || !monthlyIncome) return null;
  
  const percent = goal.savingsPercent;
  const amount = Math.round(monthlyIncome * (percent / 100));
  
  return { percent, amount };
}