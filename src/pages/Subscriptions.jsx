import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Repeat, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Edit2,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { motion } from "framer-motion";

const categoryConfig = {
  streaming: { label: 'סטרימינג', emoji: '🎬', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  software: { label: 'תוכנה', emoji: '💻', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  utilities: { label: 'שירותים', emoji: '⚡', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  fitness: { label: 'כושר', emoji: '💪', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  news: { label: 'חדשות', emoji: '📰', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  insurance: { label: 'ביטוח', emoji: '🛡️', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  telecom: { label: 'תקשורת', emoji: '📱', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  other: { label: 'אחר', emoji: '📦', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};



export default function SubscriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['recurringSubscriptions'],
    queryFn: () => base44.entities.RecurringSubscription.list(),
    initialData: [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecurringSubscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSubscriptions'] });
      setShowForm(false);
      setEditingSub(null);
      toast.success('מנוי נוסף בהצלחה');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecurringSubscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSubscriptions'] });
      setShowForm(false);
      setEditingSub(null);
      toast.success('מנוי עודכן');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringSubscription.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringSubscriptions'] });
      toast.success('מנוי נמחק');
    },
  });

  // Auto-detect subscriptions
  const detectSubscriptions = async () => {
    setIsDetecting(true);
    try {
      const { detectRecurringSubscriptions } = await import('../components/subscriptions/SubscriptionDetector');
      const detected = detectRecurringSubscriptions(transactions, subscriptions);

      if (detected.length > 0) {
        await base44.entities.RecurringSubscription.bulkCreate(detected);
        queryClient.invalidateQueries({ queryKey: ['recurringSubscriptions'] });
        toast.success(`🎉 זוהו ${detected.length} מנויים חדשים!`);
      } else {
        toast.info('לא נמצאו מנויים נוספים');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('שגיאה בזיהוי מנויים');
    } finally {
      setIsDetecting(false);
    }
  };

  // Calculate totals
  const activeSubscriptions = subscriptions.filter(s => s.is_active);
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalYearly = totalMonthly * 12;

  // Group by category
  const byCategory = useMemo(() => {
    const grouped = {};
    activeSubscriptions.forEach(s => {
      const cat = s.category || 'other';
      if (!grouped[cat]) grouped[cat] = { items: [], total: 0 };
      grouped[cat].items.push(s);
      grouped[cat].total += s.amount || 0;
    });
    return grouped;
  }, [activeSubscriptions]);

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      <PageHeader 
        title="מנויים קבועים" 
        icon={Repeat}
        description="כל ההוצאות החוזרות שלך במקום אחד"
      >
        <div className="flex gap-2">
          <Button
            onClick={detectSubscriptions}
            variant="outline"
            size="sm"
            disabled={isDetecting}
            className="h-10"
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 ml-2" />
            )}
            זהה אוטומטית
          </Button>
          <Button
            onClick={() => { setEditingSub(null); setShowForm(true); }}
            size="sm"
            className="h-10 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            מנוי חדש
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-0 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סה״כ חודשי</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-400">
              ₪{totalMonthly.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{activeSubscriptions.length} מנויים פעילים</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-0 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סה״כ שנתי</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-700 dark:text-orange-400">
              ₪{totalYearly.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">עלות שנתית כוללת</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Tip */}
      {activeSubscriptions.length >= 3 && (
        <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-purple-800 dark:text-purple-300">
            💡 <strong>טיפ:</strong> בדוק אם אתה משתמש בכל המנויים. ביטול מנוי אחד יכול לחסוך ₪{Math.round(totalMonthly / activeSubscriptions.length)} בחודש!
          </AlertDescription>
        </Alert>
      )}

      {/* Subscriptions List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl">
          <CardContent className="p-6">
            <EmptyState
              icon={Repeat}
              title="אין מנויים רשומים"
              description="הוסף מנויים ידנית או לחץ על 'זהה אוטומטית' כדי למצוא מנויים מהעסקאות שלך"
              actionLabel="זהה מנויים"
              onAction={detectSubscriptions}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, data]) => (
            <Card key={category} className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2 px-5 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryConfig[category]?.emoji || '📦'}</span>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                      {categoryConfig[category]?.label || 'אחר'}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {data.items.length}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ₪{data.total.toLocaleString()}/חודש
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4 pt-0">
                <div className="space-y-2">
                  {data.items.map((sub) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sub.logo_emoji || '📋'}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{sub.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {sub.billing_day ? `חיוב ביום ${sub.billing_day}` : 'חיוב חודשי'}
                            {sub.detected_automatically && ' • זוהה אוטומטית'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">
                          ₪{(sub.amount || 0).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditingSub(sub); setShowForm(true); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteMutation.mutate(sub.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSub ? 'עריכת מנוי' : 'מנוי חדש'}</DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            subscription={editingSub}
            onSubmit={(data) => {
              if (editingSub) {
                updateMutation.mutate({ id: editingSub.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => { setShowForm(false); setEditingSub(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionForm({ subscription, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    amount: subscription?.amount || '',
    category: subscription?.category || 'other',
    billing_day: subscription?.billing_day || '',
    logo_emoji: subscription?.logo_emoji || '📋',
    notes: subscription?.notes || '',
    is_active: subscription?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      billing_day: parseInt(formData.billing_day) || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">שם המנוי</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="לדוגמה: Netflix"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">סכום חודשי (₪)</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">קטגוריה</label>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.emoji} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">יום חיוב בחודש</label>
        <Input
          type="number"
          min="1"
          max="31"
          value={formData.billing_day}
          onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
          placeholder="1-31"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          ביטול
        </Button>
        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
          {subscription ? 'עדכן' : 'הוסף'}
        </Button>
      </div>
    </form>
  );
}