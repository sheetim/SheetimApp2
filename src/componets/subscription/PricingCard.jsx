import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function PricingCard({ 
  plan, 
  isCurrentPlan, 
  onSelect, 
  billingCycle = 'monthly',
  recommended = false,
  currentPlanType = 'free'
}) {
  const planOrder = { free: 1, pro: 2, pro_plus: 3 };
  const isUpgrade = planOrder[plan.plan_type] > planOrder[currentPlanType];
  const isDowngrade = planOrder[plan.plan_type] < planOrder[currentPlanType];
  const features = [
    {
      key: 'max_transactions',
      label: plan.features?.max_transactions === 0 ? 'עסקאות ללא הגבלה' : `עד ${plan.features?.max_transactions} עסקאות`,
      included: true
    },
    {
      key: 'max_budgets',
      label: plan.features?.max_budgets === 0 ? 'תקציבים ללא הגבלה' : `עד ${plan.features?.max_budgets} תקציבים`,
      included: true
    },
    {
      key: 'ai_coaching',
      label: 'יועץ פיננסי AI',
      included: plan.features?.ai_coaching
    },
    {
      key: 'advanced_reports',
      label: 'דוחות מתקדמים',
      included: plan.features?.advanced_reports
    },
    {
      key: 'smart_alerts',
      label: 'התראות חכמות AI',
      included: plan.features?.smart_alerts
    },
    {
      key: 'unlimited_history',
      label: 'היסטוריה ללא הגבלה',
      included: plan.features?.unlimited_history
    },
    {
      key: 'open_banking',
      label: 'חיבור Open Banking',
      included: plan.features?.open_banking
    },
    {
      key: 'priority_support',
      label: 'תמיכה עדיפה 24/7',
      included: plan.features?.priority_support
    }
  ];

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const pricePerMonth = billingCycle === 'yearly' ? (plan.price_yearly / 12).toFixed(0) : price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: recommended ? 1.05 : 1.02 }}
      className="relative"
    >
      {recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
            <Sparkles className="w-3 h-3 ml-1" />
            מומלץ ביותר
          </Badge>
        </div>
      )}
      
      <Card className={`md-card md-elevation-2 border-2 transition-all duration-300 ${
        recommended 
          ? 'border-purple-500 dark:border-purple-400 shadow-xl' 
          : isCurrentPlan
          ? 'border-green-500 dark:border-green-400'
          : 'border-gray-200 dark:border-gray-700'
      } ${recommended ? 'dark:bg-gradient-to-br dark:from-gray-800 dark:to-purple-900/20' : 'dark:bg-gray-800'}`}>
        <CardHeader className="text-center pb-3 md:pb-4">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 md:mb-3 rounded-2xl flex items-center justify-center bg-gradient-to-br p-1">
            {plan.plan_type === 'free' ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center">
                <span className="text-3xl md:text-4xl">🚀</span>
              </div>
            ) : plan.plan_type === 'pro' ? (
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 rounded-2xl flex items-center justify-center">
                <span className="text-3xl md:text-4xl">💎</span>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-2xl flex items-center justify-center">
                <span className="text-3xl md:text-4xl">👑</span>
              </div>
            )}
          </div>
          
          <CardTitle className="text-xl md:text-2xl font-bold dark:text-white flex items-center justify-center gap-2">
            {plan.name}
            {plan.plan_type === 'pro' && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">Pro</Badge>
            )}
            {plan.plan_type === 'pro_plus' && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">Pro+</Badge>
            )}
          </CardTitle>
          
          {isCurrentPlan && (
            <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
              התוכנית הנוכחית שלך
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 md:gap-2">
              <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                ₪{price}
              </span>
              <div className="text-right">
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {billingCycle === 'monthly' ? 'לחודש' : 'לשנה'}
                </div>
                {billingCycle === 'yearly' && (
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    ₪{pricePerMonth}/חודש
                  </div>
                )}
              </div>
            </div>
            
            {billingCycle === 'yearly' && plan.price_yearly > 0 && (
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                  חיסכון של {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.key}
                className={`flex items-start gap-3 ${
                  !feature.included ? 'opacity-40' : ''
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    feature.included
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature.label}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => onSelect(plan)}
            disabled={isCurrentPlan}
            className={`w-full md-ripple mobile-touch-target ${
              recommended && !isCurrentPlan
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                : isCurrentPlan
                ? 'bg-green-600'
                : isDowngrade
                ? 'bg-gray-500 hover:bg-gray-600'
                : ''
            }`}
            variant={isCurrentPlan ? 'secondary' : 'default'}
          >
            {isCurrentPlan 
              ? 'התוכנית הנוכחית' 
              : isDowngrade
                ? 'עבור לתוכנית זו'
                : isUpgrade
                  ? 'שדרג עכשיו'
                  : 'התחל בחינם'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}