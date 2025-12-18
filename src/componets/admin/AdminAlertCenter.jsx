import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, AlertTriangle, CreditCard, UserX, TrendingUp, 
  Shield, CheckCircle, Eye, Trash2, Settings, Mail
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const alertTypeConfig = {
  payment_failed: { icon: CreditCard, label: 'כישלון תשלום', color: 'text-red-600 bg-red-100' },
  subscription_cancelled: { icon: UserX, label: 'ביטול מנוי', color: 'text-orange-600 bg-orange-100' },
  revenue_milestone: { icon: TrendingUp, label: 'יעד הכנסות', color: 'text-green-600 bg-green-100' },
  suspicious_activity: { icon: Shield, label: 'פעילות חשודה', color: 'text-purple-600 bg-purple-100' },
  new_subscription: { icon: CheckCircle, label: 'מנוי חדש', color: 'text-blue-600 bg-blue-100' },
  trial_expired: { icon: AlertTriangle, label: 'סיום ניסיון', color: 'text-amber-600 bg-amber-100' }
};

const severityConfig = {
  low: { label: 'נמוך', color: 'bg-blue-100 text-blue-700' },
  medium: { label: 'בינוני', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'גבוה', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'קריטי', color: 'bg-red-100 text-red-700' }
};

export default function AdminAlertCenter({ userEmail }) {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['adminAlerts'],
    queryFn: async () => {
      try {
        return await base44.entities.AdminAlert.list('-created_date', 50);
      } catch (e) {
        console.error('Error loading admin alerts:', e);
        return [];
      }
    },
    refetchInterval: 30000
  });

  const { data: settings } = useQuery({
    queryKey: ['adminAlertSettings', userEmail],
    queryFn: async () => {
      try {
        if (!userEmail) return null;
        const existing = await base44.entities.AdminAlertSettings.filter({ admin_email: userEmail });
        if (existing.length > 0) return existing[0];
        // Create default settings
        return await base44.entities.AdminAlertSettings.create({
          admin_email: userEmail,
          payment_failed: true,
          subscription_cancelled: true,
          revenue_milestone: true,
          suspicious_activity: true,
          new_subscription: true,
          trial_expired: false,
          email_notifications: true,
          revenue_milestone_amount: 10000
        });
      } catch (e) {
        console.error('Error loading admin alert settings:', e);
        return null;
      }
    },
    enabled: !!userEmail
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminAlertSettings.update(settings.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAlertSettings']);
      toast.success('ההגדרות נשמרו');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminAlert.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['adminAlerts'])
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminAlert.update(id, { is_resolved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAlerts']);
      toast.success('ההתראה סומנה כטופלה');
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAlerts']);
      toast.success('ההתראה נמחקה');
    }
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">מרכז התראות מנהלים</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} לא נקראו • {unresolvedCount} ממתינות לטיפול
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="w-4 h-4 ml-2" />
          הגדרות
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && settings && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-lg">הגדרות התראות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(alertTypeConfig).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <config.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ [key]: checked })}
                  />
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">שליחת התראות למייל</span>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSettingsMutation.mutate({ email_notifications: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>יעד הכנסות להתראה (₪)</Label>
                <Input
                  type="number"
                  value={settings.revenue_milestone_amount}
                  onChange={(e) => updateSettingsMutation.mutate({ revenue_milestone_amount: parseInt(e.target.value) })}
                  className="w-48"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">הכל ({alerts.length})</TabsTrigger>
          <TabsTrigger value="unread">לא נקראו ({unreadCount})</TabsTrigger>
          <TabsTrigger value="unresolved">ממתינות ({unresolvedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AlertsList 
            alerts={alerts} 
            onMarkRead={(id) => markAsReadMutation.mutate(id)}
            onResolve={(id) => resolveAlertMutation.mutate(id)}
            onDelete={(id) => deleteAlertMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <AlertsList 
            alerts={alerts.filter(a => !a.is_read)} 
            onMarkRead={(id) => markAsReadMutation.mutate(id)}
            onResolve={(id) => resolveAlertMutation.mutate(id)}
            onDelete={(id) => deleteAlertMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="unresolved" className="mt-4">
          <AlertsList 
            alerts={alerts.filter(a => !a.is_resolved)} 
            onMarkRead={(id) => markAsReadMutation.mutate(id)}
            onResolve={(id) => resolveAlertMutation.mutate(id)}
            onDelete={(id) => deleteAlertMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertsList({ alerts, onMarkRead, onResolve, onDelete }) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>אין התראות</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => {
        const config = alertTypeConfig[alert.alert_type] || { icon: Bell, label: alert.alert_type, color: 'text-gray-600 bg-gray-100' };
        const severity = severityConfig[alert.severity] || severityConfig.medium;
        const Icon = config.icon;

        return (
          <Card 
            key={alert.id} 
            className={`transition-all ${!alert.is_read ? 'border-r-4 border-r-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : ''} ${alert.is_resolved ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{alert.title}</h4>
                    <Badge className={severity.color}>{severity.label}</Badge>
                    {alert.is_resolved && <Badge className="bg-green-100 text-green-700">טופל</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{format(new Date(alert.created_date), 'd MMM, HH:mm', { locale: he })}</span>
                    {alert.related_user_email && <span>משתמש: {alert.related_user_email}</span>}
                    {alert.related_amount && <span>סכום: ₪{alert.related_amount}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!alert.is_read && (
                    <Button size="icon" variant="ghost" onClick={() => onMarkRead(alert.id)} title="סמן כנקרא">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {!alert.is_resolved && (
                    <Button size="icon" variant="ghost" onClick={() => onResolve(alert.id)} title="סמן כטופל">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => onDelete(alert.id)} title="מחק">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}