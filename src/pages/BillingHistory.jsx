import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Receipt, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import EmptyState from "../components/common/EmptyState";

export default function BillingHistoryPage() {
  const { data: billingHistory = [], isLoading } = useQuery({
    queryKey: ['billingHistory'],
    queryFn: () => base44.entities.BillingHistory.list('-payment_date'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'הושלם', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      failed: { label: 'נכשל', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      pending: { label: 'ממתין', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
      refunded: { label: 'הוחזר', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPlanName = (planType) => {
    const names = {
      free: 'חינם',
      pro: 'Pro',
      pro_plus: 'Pro+'
    };
    return names[planType] || planType;
  };

  const totalPaid = billingHistory
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="page-container" dir="rtl">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">היסטוריית חיובים</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">כל התשלומים והחיובים שלך במקום אחד</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4 md:p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סך כל התשלומים</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">₪{totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4 md:p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">מנוי נוכחי</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {getPlanName(user?.subscription_plan)}
            </p>
          </CardContent>
        </Card>

        <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4 md:p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סה״כ חיובים</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{billingHistory.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader className="mobile-card-padding">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-gray-900 dark:text-white">רשימת חיובים</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="mobile-card-padding pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-lg" />
              ))}
            </div>
          ) : billingHistory.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="אין היסטוריית חיובים"
              description="עדיין לא ביצעת תשלומים. שדרג למנוי Pro או Pro+ כדי ליהנות מתכונות מתקדמות!"
              actionLabel="צפה בתוכניות"
              onAction={() => window.location.href = '/subscription'}
            />
          ) : (
            <div className="space-y-3">
              {billingHistory.map((billing) => (
                <Card 
                  key={billing.id} 
                  className="md-card md-elevation-1 border dark:border-gray-700 dark:bg-gray-750 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(billing.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {billing.description || `מנוי ${getPlanName(billing.plan_type)}`}
                            </h3>
                            {getStatusBadge(billing.status)}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            <span>📅 {format(new Date(billing.payment_date), 'd MMMM yyyy', { locale: he })}</span>
                            <span>💳 {billing.payment_method}</span>
                            <span>🆔 {billing.transaction_id}</span>
                            <span className={`font-semibold ${
                              billing.billing_cycle === 'yearly' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {billing.billing_cycle === 'yearly' ? '📆 שנתי' : '📅 חודשי'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          ₪{billing.amount?.toLocaleString()}
                        </p>
                        {billing.invoice_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="md-ripple whitespace-nowrap"
                            onClick={() => window.open(billing.invoice_url, '_blank')}
                          >
                            <Download className="w-3 h-3 ml-1" />
                            חשבונית
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}