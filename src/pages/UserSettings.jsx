import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, Bell, Shield, CreditCard, HelpCircle, Database,
  Mail, Lock, Save, ExternalLink, Sparkles, Download, Upload,
  CheckCircle, CheckCircle2, AlertTriangle, Trash2, Receipt,
  XCircle, Clock, RefreshCw, Palette, Moon, Sun, Plus, Building2, LogOut, MessageCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useTheme } from "../components/ThemeProvider";
import { useSubscription } from "../components/subscription/SubscriptionGuard";
import PricingCard from "../components/subscription/PricingCard";
import PaymentIntegration from "../components/subscription/PaymentIntegration";
import BankConnectionForm from "../components/banking/BankConnectionForm";
import BankConnectionCard from "../components/banking/BankConnectionCard";
import OpenBankingInfo from "../components/banking/OpenBankingInfo";
import EmptyState from "../components/common/EmptyState";
import ImportWizard from "../components/imports/ImportWizard";
import DateRangeExport from "../components/exports/DateRangeExport";
import AIChatSupport from "../components/support/AIChatSupport";
import SmartAlertSettings from "../components/alerts/SmartAlertSettings";

export default function UserSettingsPage() {
  const queryClient = useQueryClient();
  const { subscriptionPlan, isPremium, user } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({ full_name: '', email: '' });
  const [notificationSettings, setNotificationSettings] = useState({
    budgetAlerts: true, goalAlerts: true, weeklyReport: true, monthlyReport: true, frequency: 'immediate'
  });
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: false, allowDataExport: true, twoFactorEnabled: false
  });
  const [userPrefs, setUserPrefs] = useState({ credit_card_billing_day: 10 });
  const [saving, setSaving] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelStep, setCancelStep] = useState('confirm'); // 'confirm' | 'offer' | 'final'

  // Data queries
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (userData?.notification_settings) setNotificationSettings(userData.notification_settings);
      if (userData?.privacy_settings) setPrivacySettings(userData.privacy_settings);
      return userData;
    }
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    initialData: [],
  });

  React.useEffect(() => {
    if (preferences.length > 0) {
      setUserPrefs(preferences[0]);
    }
  }, [preferences]);

  // Set profile data only once when user data loads
  React.useEffect(() => {
    if (currentUser && !profileData.email) {
      setProfileData({ 
        full_name: currentUser.full_name || '', 
        email: currentUser.email || '' 
      });
    }
  }, [currentUser]);

  const { data: billingHistory = [] } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => base44.entities.BillingHistory.list('-payment_date'),
    initialData: [],
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
    initialData: [],
  });

  const { data: bankConnections = [] } = useQuery({
    queryKey: ['bankConnections'],
    queryFn: () => base44.entities.BankConnection.list(),
    initialData: [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
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

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  // Mutations
  const bankConnectionMutation = useMutation({
    mutationFn: (data) => base44.entities.BankConnection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bankConnections']);
      setShowBankForm(false);
      toast.success('החשבון חובר בהצלחה!');
    }
  });

  const deleteBankMutation = useMutation({
    mutationFn: (id) => base44.entities.BankConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bankConnections']);
      toast.success('החשבון נותק');
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ plan, paymentData }) => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
      
      if (paymentData) {
        await base44.entities.BillingHistory.create({
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
      
      return await base44.auth.updateMe({
        subscription_plan: plan.plan_type,
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_end_date: endDate.toISOString().split('T')[0],
        billing_cycle: billingCycle,
        auto_renew: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['billingHistory']);
      setShowPayment(false);
      setSelectedPlan(null);
      toast.success('המנוי שודרג בהצלחה!');
    }
  });

  // Handlers
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = { full_name: profileData.full_name };
      if (profileData.age !== undefined) updateData.age = profileData.age;
      if (profileData.family_status) updateData.family_status = profileData.family_status;
      if (profileData.monthly_income !== undefined) updateData.monthly_income = profileData.monthly_income;
      if (profileData.risk_tolerance) updateData.risk_tolerance = profileData.risk_tolerance;
      if (profileData.financial_goal) updateData.financial_goal = profileData.financial_goal;
      
      await base44.auth.updateMe(updateData);
      
      // Update user preferences for credit card billing day
      if (preferences.length > 0) {
        await base44.entities.UserPreferences.update(preferences[0].id, {
          credit_card_billing_day: userPrefs.credit_card_billing_day
        });
      } else {
        await base44.entities.UserPreferences.create({
          credit_card_billing_day: userPrefs.credit_card_billing_day
        });
      }
      
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['userPreferences']);
      toast.success('הפרופיל עודכן בהצלחה');
    } catch { toast.error('שגיאה בעדכון הפרופיל'); }
    finally { setSaving(false); }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ notification_settings: notificationSettings });
      toast.success('הגדרות ההתראות נשמרו');
    } catch { toast.error('שגיאה בשמירת ההגדרות'); }
    finally { setSaving(false); }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ privacy_settings: privacySettings });
      toast.success('הגדרות הפרטיות נשמרו');
    } catch { toast.error('שגיאה בשמירת ההגדרות'); }
    finally { setSaving(false); }
  };

  const handleExportData = () => {
    const data = { transactions, budgets, savingsGoals, debts, investments, assets, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sheetim-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('הנתונים יוצאו בהצלחה!');
  };

  const handleSelectPlan = (plan) => {
    if (plan.plan_type === subscriptionPlan) return;
    
    const planOrder = { free: 1, pro: 2, pro_plus: 3 };
    const isDowngrade = planOrder[plan.plan_type] < planOrder[subscriptionPlan || 'free'];
    
    if (isDowngrade) {
      // Downgrade - no payment needed, just confirm
      if (window.confirm(`האם אתה בטוח שברצונך לעבור לתוכנית ${plan.name}? השינוי ייכנס לתוקף בסוף תקופת החיוב הנוכחית.`)) {
        downgradePlan(plan);
      }
    } else {
      // Upgrade - need payment
      setSelectedPlan(plan);
      setShowPayment(true);
    }
  };

  const downgradePlan = async (plan) => {
    try {
      await base44.auth.updateMe({
        pending_plan_change: plan.plan_type,
        pending_plan_change_date: user?.subscription_end_date || new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries(['currentUser']);
      toast.success(`המנוי ישתנה ל-${plan.name} בסוף תקופת החיוב`);
    } catch (e) {
      toast.error('שגיאה בשינוי התוכנית');
    }
  };

  const handleStartTrial = async () => {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 5);
      
      await base44.auth.updateMe({
        subscription_plan: 'pro',
        is_trial: true,
        trial_start_date: new Date().toISOString().split('T')[0],
        trial_end_date: trialEndDate.toISOString().split('T')[0],
        subscription_end_date: trialEndDate.toISOString().split('T')[0]
      });
      
      queryClient.invalidateQueries(['currentUser']);
      toast.success('תקופת הניסיון הופעלה! 🎉 יש לך 5 ימים לנסות את כל התכונות');
    } catch (e) {
      toast.error('שגיאה בהפעלת תקופת הניסיון');
    }
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  const planNames = { free: 'חינמי', pro: 'Pro', pro_plus: 'Pro Plus' };
  const activePlans = plans.filter(p => p.is_active).sort((a, b) => {
    const order = { free: 1, pro: 2, pro_plus: 3 };
    return order[a.plan_type] - order[b.plan_type];
  });

  const totalPaid = billingHistory.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0);

  const getStatusBadge = (status) => {
    const config = {
      completed: { label: 'הושלם', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      failed: { label: 'נכשל', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      pending: { label: 'ממתין', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      refunded: { label: 'הוחזר', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' }
    }[status] || { label: 'ממתין', className: 'bg-gray-100 text-gray-700' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="page-container" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto" dir="rtl">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">הגדרות משתמש</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">נהל את כל ההגדרות שלך במקום אחד</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          <TabsList className="inline-flex gap-1 h-auto p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl min-w-max">
            <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <User className="w-4 h-4" />
              <span className="text-xs sm:text-sm">פרופיל</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="text-xs sm:text-sm">התראות</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4" />
              <span className="text-xs sm:text-sm">פרטיות</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Database className="w-4 h-4" />
              <span className="text-xs sm:text-sm">נתונים</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs sm:text-sm">מנוי</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4" />
              <span className="text-xs sm:text-sm">בנקאות</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs sm:text-sm">תמיכה</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-4">
            {/* Profile Card - Combined */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              <CardContent className="p-4 md:p-6">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg flex-shrink-0">
                    {profileData.full_name?.charAt(0) || profileData.email?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                      {profileData.full_name || 'משתמש'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profileData.email}</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {planNames[subscriptionPlan] || 'חינמי'}
                    </Badge>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">שם מלא</Label>
                    <Input
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="h-12 text-base bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
                      placeholder="הזן את שמך המלא"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">אימייל</Label>
                    <Input 
                      value={profileData.email} 
                      disabled 
                      className="h-12 text-base bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-600 rounded-xl text-gray-500" 
                    />
                    <p className="text-xs text-gray-400 mt-1">לא ניתן לשנות את כתובת האימייל</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">גיל</Label>
                      <Input
                        type="number"
                        value={profileData.age ?? currentUser?.age ?? ''}
                        onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || null })}
                        className="h-12 text-base bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl"
                        placeholder="לדוג׳ 35"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">מצב משפחתי</Label>
                      <Select 
                        value={profileData.family_status ?? currentUser?.family_status ?? ''} 
                        onValueChange={(v) => setProfileData({ ...profileData, family_status: v })}
                      >
                        <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl">
                          <SelectValue placeholder="בחר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="רווק">רווק/ה</SelectItem>
                          <SelectItem value="נשוי">נשוי/אה</SelectItem>
                          <SelectItem value="גרוש">גרוש/ה</SelectItem>
                          <SelectItem value="אלמן">אלמן/ה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Credit Card Billing Day */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-900 dark:text-white mb-1 block">
                            💳 יום חיוב כרטיס אשראי
                          </Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            באיזה יום בחודש נגבה החיוב מהחשבון? זה ישפיע על תחזית התזרים שלך
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            value={userPrefs.credit_card_billing_day || 10}
                            onChange={(e) => {
                              const day = Math.max(1, Math.min(31, parseInt(e.target.value) || 10));
                              setUserPrefs({ ...userPrefs, credit_card_billing_day: day });
                            }}
                            className="h-12 text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl w-24"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">בכל חודש</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          ℹ️ עסקאות בכרטיס אשראי יופיעו בתזרים בתאריך החיוב (יום {userPrefs.credit_card_billing_day || 10}) במקום תאריך הקנייה
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">הכנסה חודשית</Label>
                      <Input
                        type="number"
                        value={profileData.monthly_income ?? currentUser?.monthly_income ?? ''}
                        onChange={(e) => setProfileData({ ...profileData, monthly_income: parseInt(e.target.value) || null })}
                        className="h-12 text-base bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl"
                        placeholder="₪"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">רמת סיכון</Label>
                      <Select 
                        value={profileData.risk_tolerance ?? currentUser?.risk_tolerance ?? 'מתון'} 
                        onValueChange={(v) => setProfileData({ ...profileData, risk_tolerance: v })}
                      >
                        <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl">
                          <SelectValue placeholder="בחר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="שמרני">שמרני</SelectItem>
                          <SelectItem value="מתון">מתון</SelectItem>
                          <SelectItem value="אגרסיבי">אגרסיבי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">יעד פיננסי עיקרי</Label>
                    <Select 
                      value={profileData.financial_goal ?? currentUser?.financial_goal ?? ''} 
                      onValueChange={(v) => setProfileData({ ...profileData, financial_goal: v })}
                    >
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl">
                        <SelectValue placeholder="מה המטרה שלך?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="חיסכון_לפרישה">חיסכון לפרישה</SelectItem>
                        <SelectItem value="קניית_דירה">קניית דירה</SelectItem>
                        <SelectItem value="חופשה">חופשה</SelectItem>
                        <SelectItem value="השכלה">השכלה</SelectItem>
                        <SelectItem value="פירעון_חובות">פירעון חובות</SelectItem>
                        <SelectItem value="קרן_חירום">קרן חירום</SelectItem>
                        <SelectItem value="השקעות">השקעות</SelectItem>
                        <SelectItem value="אחר">אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving} 
                    className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </Button>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    className="h-12 text-base text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <LogOut className="w-5 h-5 ml-2" />
                    התנתק
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Display Settings Card */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  הגדרות תצוגה
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-amber-100'}`}>
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <Sun className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">מצב {theme === 'dark' ? 'כהה' : 'בהיר'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">לחץ להחלפה</p>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="scale-110" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  הגדרות התראות
                </h3>
                <div className="space-y-3">
                  {[
                    { key: 'budgetAlerts', title: 'התראות תקציב', desc: 'קבל התראה כשמתקרבים לגבול' },
                    { key: 'goalAlerts', title: 'התראות יעדים', desc: 'קבל התראה על התקדמות' },
                    { key: 'weeklyReport', title: 'דוח שבועי', desc: 'קבל סיכום שבועי במייל' },
                    { key: 'monthlyReport', title: 'דוח חודשי', desc: 'קבל סיכום חודשי' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="min-w-0 flex-1 ml-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notificationSettings[item.key]}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [item.key]: checked })}
                        className="flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveNotifications} disabled={saving} className="w-full h-12 mt-4 bg-purple-600 hover:bg-purple-700 rounded-xl">
                  <Save className="w-4 h-4 ml-2" />
                  {saving ? 'שומר...' : 'שמור הגדרות'}
                </Button>
              </CardContent>
            </Card>

            {/* Smart Alerts */}
            <SmartAlertSettings 
              initialAlerts={currentUser?.custom_alerts || []}
              onSave={async (alerts) => {
                await base44.auth.updateMe({ custom_alerts: alerts });
                queryClient.invalidateQueries(['currentUser']);
              }}
            />
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardContent className="p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                הגדרות פרטיות
              </h3>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                <p className="text-sm text-green-800 dark:text-green-300">🔒 המידע שלך מאובטח ומוצפן</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'shareAnalytics', title: 'שיתוף נתונים אנונימיים', desc: 'עזור לנו לשפר את השירות' },
                  { key: 'allowDataExport', title: 'אפשר ייצוא נתונים', desc: 'אפשר לייצא את הנתונים' },
                  { key: 'twoFactorEnabled', title: 'אימות דו-שלבי', desc: 'שכבת אבטחה נוספת' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="min-w-0 flex-1 ml-3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <Switch
                      checked={privacySettings[item.key]}
                      onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, [item.key]: checked })}
                      className="flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSavePrivacy} disabled={saving} className="w-full h-12 mt-4 bg-green-600 hover:bg-green-700 rounded-xl">
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'שומר...' : 'שמור הגדרות'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data">
          <div className="space-y-6">
            <DateRangeExport transactions={transactions} budgets={budgets} savingsGoals={savingsGoals} debts={debts} investments={investments} assets={assets} />
            
            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Database className="w-5 h-5" />
                  ניהול נתונים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleExportData} className="md-ripple bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 ml-2" />
                    ייצא גיבוי מהיר
                  </Button>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-3">
                    <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                      ⚠️ מחיקת המידע היא פעולה בלתי הפיכה
                    </AlertDescription>
                  </Alert>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      const verification = window.prompt('הקלד DELETE לאישור המחיקה:');
                      if (verification === 'DELETE') {
                        await Promise.all([
                          ...transactions.map(t => base44.entities.Transaction.delete(t.id)),
                          ...budgets.map(b => base44.entities.Budget.delete(b.id)),
                          ...savingsGoals.map(s => base44.entities.SavingsGoal.delete(s.id)),
                          ...debts.map(d => base44.entities.Debt.delete(d.id)),
                          ...investments.map(i => base44.entities.Investment.delete(i.id)),
                          ...assets.map(a => base44.entities.Asset.delete(a.id))
                        ]);
                        queryClient.invalidateQueries();
                        toast.success('כל המידע נמחק');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק את כל המידע
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CSV Importer replaced with new wizard */}
            <ImportWizard 
              onComplete={() => { 
                queryClient.invalidateQueries(); 
              }} 
              onCancel={() => {}}
            />
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="space-y-6">
            {/* Current Plan */}
            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  המנוי הנוכחי
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 md:p-6 rounded-xl ${isPremium 
                  ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-purple-200 dark:border-purple-700' 
                  : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">תוכנית</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {planNames[subscriptionPlan] || 'חינמי'}
                        {isPremium && <Sparkles className="w-4 h-4 text-purple-600" />}
                      </p>
                    </div>
                    {isPremium ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-amber-500" />}
                  </div>
                  
                  {/* Trial info */}
                  {user?.is_trial && user?.trial_end_date && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        🎁 תקופת ניסיון - נותרו {Math.max(0, Math.ceil((new Date(user.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)))} ימים
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        עד {new Date(user.trial_end_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  )}

                  {isPremium && user?.subscription_end_date && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        תוקף: {new Date(user.subscription_end_date).toLocaleDateString('he-IL')}
                      </p>
                      {user?.cancel_at_period_end && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          ⚠️ המנוי יבוטל בסיום התקופה
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cancel subscription button */}
                {isPremium && !user?.cancel_at_period_end && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    בטל מנוי
                  </Button>
                )}

                {/* Payment failed status */}
                {user?.subscription_status === 'payment_failed' && (
                  <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      התשלום האחרון נכשל. אנא עדכן את פרטי התשלום כדי למנוע ביטול המנוי.
                    </AlertDescription>
                  </Alert>
                )}

                {user?.subscription_status === 'suspended' && (
                  <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      המנוי שלך הושהה בגלל בעיית תשלום. אנא עדכן את פרטי התשלום.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Reactivate subscription */}
                {isPremium && user?.cancel_at_period_end && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        await base44.auth.updateMe({ cancel_at_period_end: false });
                        queryClient.invalidateQueries(['currentUser']);
                        toast.success('המנוי הופעל מחדש!');
                      } catch (e) {
                        toast.error('שגיאה בהפעלת המנוי');
                      }
                    }}
                  >
                    הפעל מנוי מחדש
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Trial Banner */}
            {!isPremium && !user?.is_trial && !user?.used_trial && (
              <Card className="bg-gradient-to-r from-purple-500 to-blue-500 border-0 text-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold mb-1">🎁 נסה 5 ימים חינם!</h3>
                      <p className="text-sm opacity-90">גישה לכל תכונות הפרימיום בלי כרטיס אשראי</p>
                    </div>
                    <Button 
                      onClick={handleStartTrial}
                      className="bg-white text-purple-600 hover:bg-gray-100 flex-shrink-0"
                    >
                      התחל ניסיון חינם
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Cards */}
            <div className="flex justify-center items-center gap-3 mb-4">
              <Label className={billingCycle === 'monthly' ? 'text-blue-600 font-medium text-sm' : 'text-gray-500 text-sm'}>חודשי</Label>
              <Switch checked={billingCycle === 'yearly'} onCheckedChange={(c) => setBillingCycle(c ? 'yearly' : 'monthly')} />
              <Label className={billingCycle === 'yearly' ? 'text-blue-600 font-medium text-sm' : 'text-gray-500 text-sm'}>
                שנתי <Badge className="bg-green-100 text-green-700 text-xs mr-1">חסוך 17%</Badge>
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePlans.map(plan => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={subscriptionPlan === plan.plan_type}
                  currentPlanType={subscriptionPlan || 'free'}
                  onSelect={handleSelectPlan}
                  billingCycle={billingCycle}
                  recommended={plan.plan_type === 'pro'}
                />
              ))}
            </div>

            {/* Billing History */}
            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Receipt className="w-5 h-5" />
                  היסטוריית חיובים
                </CardTitle>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">אין היסטוריית חיובים</p>
                ) : (
                  <div className="space-y-3">
                    {billingHistory.slice(0, 5).map(billing => (
                      <div key={billing.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {billing.description || `מנוי ${planNames[billing.plan_type]}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(billing.payment_date), 'd MMMM yyyy', { locale: he })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(billing.status)}
                          <span className="font-bold text-gray-900 dark:text-white">₪{billing.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking">
          <div className="space-y-6">
            {/* Open Banking Info Component */}
            <OpenBankingInfo />

            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    חשבונות מחוברים
                  </CardTitle>
                  <Button onClick={() => setShowBankForm(true)} className="md-ripple w-full sm:w-auto" disabled={!isPremium}>
                    <Plus className="w-4 h-4 ml-2" />
                    חבר חשבון בנק
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!isPremium && (
                  <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-300">
                      <strong>Open Banking זמין למנויי Pro Plus</strong> - שדרג עכשיו לסנכרון אוטומטי של כל העסקאות שלך!
                    </AlertDescription>
                  </Alert>
                )}
                
                {bankConnections.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">אין חשבונות מחוברים</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                      חבר את חשבון הבנק שלך וכל העסקאות יסונכרנו אוטומטית - בלי להזין ידנית!
                    </p>
                    {isPremium && (
                      <Button onClick={() => setShowBankForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 ml-2" />
                        חבר חשבון ראשון
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {bankConnections.map(conn => (
                      <BankConnectionCard
                        key={conn.id}
                        connection={conn}
                        onSync={() => toast.info('מסנכרן...')}
                        onDisconnect={() => deleteBankMutation.mutate(conn.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {showBankForm && (
              <BankConnectionForm
                onConnect={(data) => bankConnectionMutation.mutate(data)}
                onCancel={() => setShowBankForm(false)}
              />
            )}

            {/* Security & Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">SSL/TLS</p>
                <p className="text-[10px] text-gray-500">הצפנה מלאה</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">PSD2</p>
                <p className="text-[10px] text-gray-500">תקן אירופי</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">רשות ני"ע</p>
                <p className="text-[10px] text-gray-500">רישיון מאושר</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">GDPR</p>
                <p className="text-[10px] text-gray-500">הגנת פרטיות</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <div className="space-y-6">
            {/* AI Support Card */}
            <Card className="bg-gradient-to-r from-purple-500 to-blue-500 border-0 text-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">🤖 רובוט תמיכה AI</h3>
                      <p className="text-sm opacity-90">קבל תשובות מיידיות לשאלות שלך</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowAIChat(true)}
                    className="bg-white text-purple-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    התחל צ'אט
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <HelpCircle className="w-5 h-5 text-cyan-600" />
                  תמיכה ועזרה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="mailto:sheetimsz@gmail.com" className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <Mail className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">צור קשר</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">sheetimsz@gmail.com</p>
                  </a>
                  <button 
                    onClick={() => setShowAIChat(true)}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-right"
                  >
                    <MessageCircle className="w-8 h-8 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">צ'אט עם רובוט</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">תמיכה מיידית 24/7</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="dark:text-white">שאלות נפוצות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { q: 'איך מוסיפים עסקה חדשה?', a: 'לחץ על "הכנסות והוצאות" בתפריט הראשי, ואז על כפתור "הוסף עסקה". בחר סוג (הכנסה/הוצאה), הזן סכום, בחר קטגוריה ותאריך.' },
                    { q: 'איך מגדירים תקציב?', a: 'עבור לדף "תקציבים" בתפריט, לחץ על "הוסף תקציב". בחר קטגוריה, הגדר סכום מקסימלי לחודש. תקבל התראה כשתתקרב לגבול.' },
                    { q: 'איך מוסיפים השקעה?', a: 'עבור לדף "תיק השקעות", לחץ על "הוסף השקעה". הזן שם, סמל מסחר, כמות ומחיר רכישה. המחירים מתעדכנים אוטומטית.' },
                    { q: 'מה ההבדל בין התוכניות?', a: 'חינמי - ניהול בסיסי. Pro (₪29/חודש) - יועץ AI, דוחות מתקדמים, התראות חכמות. Pro Plus (₪49/חודש) - כל הנ"ל + Open Banking לסנכרון אוטומטי.' },
                    { q: 'איך מבטלים מנוי?', a: 'עבור להגדרות > מנוי > לחץ על "בטל מנוי". תוכל להמשיך להשתמש בתכונות הפרימיום עד סוף תקופת החיוב ששולמה.' },
                    { q: 'איך מייצאים את הנתונים?', a: 'עבור להגדרות > נתונים. תוכל לייצא גיבוי מלא בפורמט JSON, או לייצא לפי טווח תאריכים לקובץ CSV.' },
                    { q: 'האם המידע שלי מאובטח?', a: 'בהחלט! כל המידע מוצפן בהצפנת AES-256, מאובטח בשרתים מוגנים ועומד בתקני GDPR. אנחנו לא שומרים פרטי כרטיס אשראי.' },
                    { q: 'איך מחברים חשבון בנק?', a: 'זמין למנויי Pro Plus. עבור להגדרות > בנקאות > "חבר חשבון", בחר את הבנק שלך והתחבר בצורה מאובטחת. העסקאות יסונכרנו אוטומטית.' },
                    { q: 'מה זה תקופת הניסיון?', a: 'אנו מציעים 5 ימי ניסיון חינם לכל תכונות Pro ללא צורך בכרטיס אשראי. בסוף התקופה תוכל להחליט אם לשדרג.' },
                    { q: 'איך יוצרים יעד חיסכון?', a: 'עבור לדף "יעדי חיסכון", לחץ על "הוסף יעד". הגדר שם, סכום יעד ותאריך. תוכל לעדכן את ההתקדמות ולקבל תזכורות.' }
                  ].map((faq, i) => (
                    <details key={i} className="group p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">{faq.q}</summary>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>השלמת תשלום - {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PaymentIntegration
              plan={selectedPlan}
              billingCycle={billingCycle}
              onSuccess={(paymentData) => upgradeMutation.mutate({ plan: selectedPlan, paymentData })}
              onCancel={() => { setShowPayment(false); setSelectedPlan(null); }}
              userDiscount={user}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat Support */}
      {showAIChat && <AIChatSupport onClose={() => setShowAIChat(false)} />}

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => { setShowCancelDialog(open); if (!open) setCancelStep('confirm'); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {cancelStep === 'confirm' && 'ביטול מנוי'}
              {cancelStep === 'offer' && '🎁 הצעה מיוחדת בשבילך!'}
              {cancelStep === 'final' && 'אישור ביטול'}
            </DialogTitle>
          </DialogHeader>
          
          {cancelStep === 'confirm' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                האם אתה בטוח שברצונך לבטל את המנוי? תוכל להמשיך להשתמש בתכונות הפרימיום עד סוף תקופת החיוב.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                  השאר מנוי
                </Button>
                <Button variant="destructive" onClick={() => setCancelStep('offer')} className="flex-1">
                  המשך לביטול
                </Button>
              </div>
            </div>
          )}

          {cancelStep === 'offer' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl text-center">
                <p className="text-2xl font-bold text-purple-600 mb-2">5% הנחה</p>
                <p className="text-gray-700 dark:text-gray-300">על החודשיים הקרובים!</p>
                <p className="text-sm text-gray-500 mt-2">במקום לבטל, קבל הנחה מיוחדת</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={async () => {
                    try {
                      const discountEndDate = new Date();
                      discountEndDate.setMonth(discountEndDate.getMonth() + 2);
                      await base44.auth.updateMe({ 
                        has_discount: true,
                        discount_percent: 5,
                        discount_end_date: discountEndDate.toISOString().split('T')[0]
                      });
                      await queryClient.invalidateQueries(['currentUser']);
                      setShowCancelDialog(false);
                      setCancelStep('confirm');
                      toast.success('ההנחה הופעלה! 5% הנחה לחודשיים הקרובים 🎉');
                    } catch (e) {
                      toast.error('שגיאה בהפעלת ההנחה');
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  קבל הנחה 🎁
                </Button>
                <Button variant="outline" onClick={() => setCancelStep('final')} className="flex-1">
                  לא תודה
                </Button>
              </div>
            </div>
          )}

          {cancelStep === 'final' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                המנוי יבוטל בסוף תקופת החיוב הנוכחית ({user?.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('he-IL') : 'לא ידוע'}).
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancelStep('confirm'); }} className="flex-1">
                  חזור
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    try {
                      // Cancel via PayPal if subscription exists
                      if (user?.paypal_subscription_id) {
                        await base44.functions.invoke('cancelPayPalSubscription', { reason: 'User requested cancellation' });
                      }
                      await base44.auth.updateMe({ cancel_at_period_end: true });
                      queryClient.invalidateQueries(['currentUser']);
                      toast.success('המנוי יבוטל בסוף תקופת החיוב');
                      setShowCancelDialog(false);
                      setCancelStep('confirm');
                    } catch (e) {
                      toast.error('שגיאה בביטול המנוי');
                    }
                  }}
                  className="flex-1"
                >
                  אשר ביטול
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}