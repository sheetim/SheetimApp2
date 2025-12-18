import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function useSubscription() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const subscriptionPlan = user?.subscription_plan || 'free';
  
  // TEMPORARY: All features unlocked for beta testing
  const hasFeature = (feature) => {
    return true; // All features open for testing
  };

  return {
    subscriptionPlan,
    isPremium: true, // TEMPORARY: Everyone is premium for testing
    isFree: false,
    isPro: true,
    isProPlus: true,
    hasFeature,
    isLoading,
    user
  };
}

export function SubscriptionGuard({ feature, fallback, children }) {
  const { hasFeature, isLoading } = useSubscription();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg" />;
  }

  if (!hasFeature(feature)) {
    return fallback || <PremiumFeatureCard feature={feature} />;
  }

  return <>{children}</>;
}

function PremiumFeatureCard({ feature }) {
  const featureNames = {
    ai_coaching: 'יועץ פיננסי AI',
    advanced_reports: 'דוחות מתקדמים',
    open_banking: 'אינטגרציית Open Banking',
    smart_alerts: 'התראות חכמות AI',
    unlimited_history: 'היסטוריה ללא הגבלה',
    priority_support: 'תמיכה עדיפה'
  };

  return (
    <Card className="md-card md-elevation-2 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardContent className="text-center py-8 px-6">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock className="w-7 h-7 text-white" />
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          פיצ'ר Pro – לפתיחה, עברו לתכנית המלאה
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          {featureNames[feature] || 'תכונה זו'} זמינה למנויי Sheetim Pro
        </p>
        
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link to={createPageUrl('Subscription')}>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Sparkles className="w-4 h-4 ml-2" />
              שדרג לתכנית Pro
            </Button>
          </Link>
          
          <Link to={createPageUrl('Subscription')}>
            <Button variant="ghost" className="w-full text-sm">
              למד עוד על Sheetim Pro
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubscriptionGuard;