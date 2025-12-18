import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Sparkles, Crown, Receipt, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PricingCard from "../components/subscription/PricingCard";
import PaymentIntegration from "../components/subscription/PaymentIntegration";
import TrialBanner from "../components/subscription/TrialBanner";
import PlanComparison from "../components/subscription/PlanComparison";
import { useSubscription } from "../components/subscription/SubscriptionGuard";
import { NotificationService } from "../components/notifications/NotificationService";

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const queryClient = useQueryClient();
  const { subscriptionPlan, user, isPremium } = useSubscription();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
    initialData: [],
  });

  const { data: billingHistory = [] } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => base44.entities.BillingHistory.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ plan, paymentData }) => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
      
      let billingRecord = null;
      // יצירת רשומת חיוב
      if (paymentData) {
        billingRecord = await base44.entities.BillingHistory.create({
          transaction_id: paymentData.transaction_id,
          amount: paymentData.amount,
          currency: 'ILS',
          plan_type: plan.plan_type,
          billing_cycle: billingCycle,
          status: paymentData.status,
          payment_method: paymentData.payment_method,
          payment_date: new Date().toISOString().split('T')[0],
          description: `שדרוג למנוי ${plan.name}`
        });
      }
      
      // עדכון פרטי המשתמש
      const result = await base44.auth.updateMe({
        subscription_plan: plan.plan_type,
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_end_date: endDate.toISOString().split('T')[0],
        billing_cycle: billingCycle,
        payment_provider: paymentData?.payment_method,
        auto_renew: true
      });

      return { result, plan, billingRecord };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['billingHistory']);
      queryClient.invalidateQueries(['notifications']);
      setShowPayment(false);
      setSelectedPlan(null);
      
      const planNames = { free: 'חינם', pro: 'Pro', pro_plus: 'Pro+' };
      
      if (data.billingRecord) {
        await NotificationService.notifyPaymentSuccess(data.billingRecord);
      }
      await NotificationService.notifySubscriptionUpgrade(planNames[data.plan.plan_type]);
      
      toast.success(`🎉 שודרגת ל-${planNames[variables.plan.plan_type]} בהצלחה!`);
    },
    onError: () => {
      toast.error('שגיאה בשינוי התוכנית');
    }
  });

  const handleSelectPlan = (plan) => {
    if (plan.plan_type === subscriptionPlan) {
      return;
    }

    const currentPlanIndex = ['free', 'pro', 'pro_plus'].indexOf(subscriptionPlan);
    const newPlanIndex = ['free', 'pro', 'pro_plus'].indexOf(plan.plan_type);
    const isDowngrade = newPlanIndex < currentPlanIndex;

    if (plan.plan_type === 'free') {
      if (window.confirm('האם אתה בטוח שברצונך לשנות לתוכנית החינם? תאבד גישה לתכונות Premium.')) {
        upgradeMutation.mutate({ plan, paymentData: null });
      }
    } else {
      // פתיחת חלון תשלום
      setSelectedPlan(plan);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    upgradeMutation.mutate({ plan: selectedPlan, paymentData });
  };

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await base44.auth.updateMe({
        subscription_plan: 'free',
        subscription_end_date: new Date().toISOString().split('T')[0],
        auto_renew: false
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['notifications']);
      setShowCancelDialog(false);
      await NotificationService.notifySubscriptionCancellation();
      toast.success('המנוי בוטל בהצלחה. תוכל להמשיך להשתמש עד תום תקופת המנוי.');
    },
    onError: () => {
      toast.error('שגיאה בביטול המנוי');
    }
  });

  const pauseSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await base44.auth.updateMe({
        auto_renew: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setShowPauseDialog(false);
      toast.success('המנוי הושהה. לא יחויב אוטומטית בתום התקופה.');
    },
    onError: () => {
      toast.error('שגיאה בהשהיית המנוי');
    }
  });

  // Filter active plans and remove duplicates by plan_type (keep one of each type)
  const activePlans = useMemo(() => {
    const plansByType = {};
    plans.filter(p => p.is_active).forEach(plan => {
      // Keep only one plan per type (prefer the one with newer created_date)
      if (!plansByType[plan.plan_type] || 
          new Date(plan.created_date) > new Date(plansByType[plan.plan_type].created_date)) {
        plansByType[plan.plan_type] = plan;
      }
    });
    
    // Return only the 3 plan types we want, in order
    return ['free', 'pro', 'pro_plus']
      .map(type => plansByType[type])
      .filter(Boolean);
  }, [plans]);

  const currentPlanDetails = plans.find(p => p.plan_type === subscriptionPlan);
  const planNames = { free: 'חינם', pro: 'Pro', pro_plus: 'Pro+', premium: 'Premium' };
  
  const subscriptionHistory = billingHistory.filter(h => h.status === 'completed').slice(0, 5);

  return (
    <div className="page-container" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">שדרג את החוויה שלך</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-1">
            בחר את התוכנית שמתאימה לך. ביטול בכל עת ללא שאלות.
          </p>
        </div>
        <Link to={createPageUrl('BillingHistory')}>
          <Button variant="outline" className="md-ripple mobile-touch-target">
            <Receipt className="w-4 h-4 ml-2" />
            היסטוריית חיובים
          </Button>
        </Link>
      </div>

      {currentPlanDetails && (
        <Card className="md-card md-elevation-2 mb-6 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between dark:text-white">
              <div className="flex items-center gap-2">
                {subscriptionPlan === 'free' ? '🚀' : subscriptionPlan === 'pro' ? '💎' : '👑'}
                <span>התוכנית הנוכחית שלך: {currentPlanDetails.name}</span>
              </div>
              {isPremium && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  פעיל
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">תאריך תחילה</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user?.subscription_start_date ? format(new Date(user.subscription_start_date), 'd MMMM yyyy', { locale: he }) : 'לא זמין'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">תאריך סיום</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user?.subscription_end_date ? format(new Date(user.subscription_end_date), 'd MMMM yyyy', { locale: he }) : 'לא זמין'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">מחזור חיוב</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user?.billing_cycle === 'monthly' ? 'חודשי' : user?.billing_cycle === 'yearly' ? 'שנתי' : 'לא זמין'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">חידוש אוטומטי</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {user?.auto_renew ? 'פעיל' : 'כבוי'}
                  </div>
                </div>
              </div>
            </div>

            {isPremium && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="md-ripple"
                  onClick={() => setShowPauseDialog(true)}
                  disabled={!user?.auto_renew}
                >
                  <ArrowDownCircle className="w-4 h-4 ml-2" />
                  השהה חידוש
                </Button>
                <Button 
                  variant="outline" 
                  className="md-ripple text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <AlertCircle className="w-4 h-4 ml-2" />
                  בטל מנוי
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subscriptionHistory.length > 0 && (
        <Card className="md-card md-elevation-2 mb-6 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Receipt className="w-5 h-5" />
              היסטוריית מנויים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionHistory.map((history, index) => (
                <div key={history.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      history.plan_type === 'pro_plus' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      history.plan_type === 'pro' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {history.plan_type === 'pro_plus' ? '👑' : history.plan_type === 'pro' ? '💎' : '🚀'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {planNames[history.plan_type]} - {history.billing_cycle === 'monthly' ? 'חודשי' : 'שנתי'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(history.payment_date), 'd MMMM yyyy', { locale: he })}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 dark:text-white">₪{history.amount}</div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                      שולם
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {billingHistory.length > 5 && (
              <div className="mt-4 text-center">
                <Link to={createPageUrl('BillingHistory')}>
                  <Button variant="outline" size="sm" className="md-ripple">
                    צפה בהיסטוריה המלאה
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center items-center gap-3 md:gap-4 mb-6 md:mb-8 px-2">
        <Label 
          className={`text-sm md:text-base font-medium transition-colors cursor-pointer ${
            billingCycle === 'monthly' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setBillingCycle('monthly')}
        >
          חודשי
        </Label>
        <Switch
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <Label 
          className={`text-sm md:text-base font-medium flex items-center gap-2 transition-colors cursor-pointer ${
            billingCycle === 'yearly' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setBillingCycle('yearly')}
        >
          שנתי
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs whitespace-nowrap">
            חסוך 17%
          </Badge>
        </Label>
      </div>

      {/* Trial Banner */}
      <TrialBanner user={user} isPremium={isPremium} />

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-xl" />
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-xl" />
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-xl" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {activePlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={subscriptionPlan === plan.plan_type}
              onSelect={handleSelectPlan}
              billingCycle={billingCycle}
              recommended={plan.plan_type === 'pro'}
            />
          ))}
        </div>
      )}

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">השלמת תשלום - {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PaymentIntegration
              plan={selectedPlan}
              billingCycle={billingCycle}
              onSuccess={handlePaymentSuccess}
              onCancel={() => {
                setShowPayment(false);
                setSelectedPlan(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 max-w-3xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CreditCard className="w-5 h-5" />
            אמצעי תשלום מקובלים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              💳 אנו מקבלים תשלומים באמצעות PayPal, Tranzila, כרטיסי אשראי ישראליים, והעברה בנקאית.
              כל התשלומים מאובטחים ומוצפנים.
            </AlertDescription>
          </Alert>

          <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              למה לבחור ב-Premium?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>ניהול כספי חכם:</strong> קבל המלצות מותאמות אישית מבוססות AI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>אוטומציה מלאה:</strong> חיבור ישיר לבנק עם Open Banking</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>דוחות מתקדמים:</strong> ניתוח עמוק של ההוצאות וההכנסות שלך</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>ללא הגבלות:</strong> עסקאות ותקציבים ללא הגבלה</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ביטול מנוי</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                <strong>שים לב:</strong> ביטול המנוי יגרום לאובדן גישה לכל התכונות Premium בתום תקופת המנוי הנוכחית.
              </AlertDescription>
            </Alert>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-2">בביטול המנוי:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>תשמור על גישה עד {user?.subscription_end_date && format(new Date(user.subscription_end_date), 'd MMMM yyyy', { locale: he })}</li>
                <li>לא תחויב יותר בעתיד</li>
                <li>תעבור לתוכנית החינם בתום התקופה</li>
                <li>תוכל לשדרג שוב בכל עת</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                אולי לא
              </Button>
              <Button 
                variant="destructive"
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isPending}
                className="flex-1"
              >
                {cancelSubscriptionMutation.isPending ? 'מבטל...' : 'אישור ביטול'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>השהיית חידוש אוטומטי</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                השהיית החידוש האוטומטי תגרום לכך שהמנוי שלך לא יתחדש אוטומטית בתום התקופה.
              </AlertDescription>
            </Alert>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-2">לאחר ההשהיה:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>המנוי יישאר פעיל עד {user?.subscription_end_date && format(new Date(user.subscription_end_date), 'd MMMM yyyy', { locale: he })}</li>
                <li>לא תחויב אוטומטית בתום התקופה</li>
                <li>תצטרך לחדש ידנית אם תרצה להמשיך</li>
                <li>תוכל לבטל את ההשהיה בכל עת</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPauseDialog(false)}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button 
                onClick={() => pauseSubscriptionMutation.mutate()}
                disabled={pauseSubscriptionMutation.isPending}
                className="flex-1"
              >
                {pauseSubscriptionMutation.isPending ? 'משהה...' : 'אישור השהייה'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Comparison */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
          השוואת תכניות
        </h2>
        <PlanComparison currentPlan={subscriptionPlan} onSelectPlan={handleSelectPlan} />
      </div>

      {/* Trust Section */}
      <div className="max-w-3xl mx-auto mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>ביטול בכל עת</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>החזר כספי תוך 14 יום</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>תשלום מאובטח</span>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>יש לך שאלות? <a href="mailto:support@sheetim.app" className="text-blue-600 dark:text-blue-400 hover:underline">צור קשר עם התמיכה</a></p>
        <p className="text-xs">💳 תשלום מאובטח | 🔒 פרטיותך מוגנת | ❌ ביטול ללא עלות</p>
      </div>
    </div>
  );
}