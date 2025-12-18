import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Lightbulb, Target, TrendingUp, CreditCard, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getGoalConfig, getPersonalizedGreeting, getRecommendedSavingsPercent } from "../utils/onboardingUtils";

export default function PersonalizedHero({ 
  totalIncome, 
  totalExpenses, 
  totalSavings, 
  totalDebt, 
  portfolioValue,
  totalAssets = 0,
  hasUnreadInsights = false
}) {
  // Get goal from user settings (financial_goal) - takes priority
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
  
  const balance = totalIncome - totalExpenses;
  const netWorth = totalAssets + portfolioValue + totalSavings - totalDebt;
  
  // Get personalized message based on goal
  const getPersonalizedMessage = () => {
    if (!goalConfig) return null;
    
    switch (primaryGoal) {
      case 'stop_minus':
        if (balance < 0) {
          return { 
            text: `המינוס החודשי עומד על ₪${Math.abs(balance).toLocaleString()}. בוא נמצא היכן אפשר לקצץ.`,
            type: 'warning',
            cta: { label: 'נתח הוצאות', page: 'Transactions' }
          };
        } else {
          return {
            text: `מצוין! החודש סיימת בפלוס של ₪${balance.toLocaleString()}!`,
            type: 'success',
            cta: { label: 'המשך למעקב', page: 'Budgets' }
          };
        }
      
      case 'start_investing':
        const savingsRecommendation = getRecommendedSavingsPercent(primaryGoal, totalIncome);
        if (portfolioValue === 0) {
          return {
            text: `הגיע הזמן להתחיל להשקיע! מומלץ להקצות ${savingsRecommendation?.percent || 15}% מההכנסה.`,
            type: 'info',
            cta: { label: 'התחל להשקיע', page: 'Investments' }
          };
        } else {
          return {
            text: `תיק ההשקעות שלך שווה ₪${portfolioValue.toLocaleString()}. המשך לגדול!`,
            type: 'success',
            cta: { label: 'צפה בתיק', page: 'Investments' }
          };
        }
      
      case 'close_debts':
        if (totalDebt > 0) {
          return {
            text: `יתרת החוב: ₪${totalDebt.toLocaleString()}. נתכנן יחד אסטרטגיית פירעון.`,
            type: 'warning',
            cta: { label: 'נהל חובות', page: 'Debts' }
          };
        } else {
          return {
            text: `מדהים! אין לך חובות פעילים! 🎉`,
            type: 'success',
            cta: { label: 'המשך לחסוך', page: 'Savings' }
          };
        }
      
      case 'build_savings':
        const savingsTarget = getRecommendedSavingsPercent(primaryGoal, totalIncome);
        return {
          text: `החיסכון הנוכחי: ₪${totalSavings.toLocaleString()}. מומלץ לחסוך ₪${savingsTarget?.amount?.toLocaleString() || 0} בחודש.`,
          type: totalSavings > 0 ? 'success' : 'info',
          cta: { label: 'צפה ביעדים', page: 'Savings' }
        };
      
      default:
        return null;
    }
  };

  const personalizedMessage = getPersonalizedMessage();
  const greeting = getPersonalizedGreeting(primaryGoal, null);

  const getGoalIcon = () => {
    switch (primaryGoal) {
      case 'stop_minus': return CreditCard;
      case 'start_investing': return TrendingUp;
      case 'close_debts': return Target;
      case 'build_savings': return Wallet;
      default: return Sparkles;
    }
  };

  const GoalIcon = getGoalIcon();

  // Fallback: Show a default summary card if no goal is configured
  if (!goalConfig) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg border-0 text-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white/80">תמונה כללית על המצב שלך</h2>
            <Link to={createPageUrl("NetWorth")}>
              <Button variant="ghost" size="sm" className="text-xs h-7 text-white/60 hover:text-white hover:bg-white/10">
                פירוט <ArrowLeft className="w-3 h-3 mr-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 mb-1">שווי נקי</p>
              <p className={`text-lg font-bold ${netWorth >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                ₪{netWorth.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 mb-1">השקעות</p>
              <p className="text-lg font-bold text-blue-400">₪{portfolioValue.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 mb-1">חיסכון</p>
              <p className="text-lg font-bold text-green-400">₪{totalSavings.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-[10px] text-white/60 mb-1">חובות</p>
              <p className="text-lg font-bold text-red-400">₪{totalDebt.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl shadow-lg border-0 text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="p-4 relative z-10">
        {/* Goal Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <GoalIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">היעד שלך</p>
              <p className="text-sm font-medium">{goalConfig.title}</p>
            </div>
          </div>
          
          {hasUnreadInsights && (
            <Link to={createPageUrl("AIInsights")}>
              <Button 
                size="sm" 
                className="h-8 bg-white/20 hover:bg-white/30 text-white border-0 text-xs gap-1"
              >
                <Sparkles className="w-3 h-3" />
                תובנות חדשות
              </Button>
            </Link>
          )}
        </div>

        {/* Personalized Message */}
        {personalizedMessage && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{personalizedMessage.text}</p>
              </div>
            </div>
            {personalizedMessage.cta && (
              <Link to={createPageUrl(personalizedMessage.cta.page)}>
                <Button 
                  size="sm" 
                  className="mt-2 h-8 bg-white text-purple-700 hover:bg-gray-100 text-xs w-full sm:w-auto"
                >
                  {personalizedMessage.cta.label}
                  <ArrowLeft className="w-3 h-3 mr-1" />
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-white/70">יתרה חודשית</p>
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {balance >= 0 ? '+' : ''}₪{balance.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-white/70">שווי נקי</p>
            <p className={`text-sm font-bold ${netWorth >= 0 ? 'text-teal-300' : 'text-red-300'}`}>
              ₪{netWorth.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-white/70">{goalConfig.focus}</p>
            <p className="text-sm font-bold">
              {primaryGoal === 'close_debts' && `₪${totalDebt.toLocaleString()}`}
              {primaryGoal === 'build_savings' && `₪${totalSavings.toLocaleString()}`}
              {primaryGoal === 'start_investing' && `₪${portfolioValue.toLocaleString()}`}
              {primaryGoal === 'stop_minus' && `₪${totalExpenses.toLocaleString()}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}