import React, { useState, useMemo } from "react";
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
  Calendar, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Clock,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  parseISO
} from "date-fns";
import { he } from "date-fns/locale";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { motion } from "framer-motion";

const paymentTypeConfig = {
  check: { label: "צ'ק דחוי", emoji: '📝', color: 'bg-blue-100 text-blue-700' },
  credit_installment: { label: 'תשלומים', emoji: '💳', color: 'bg-purple-100 text-purple-700' },
  standing_order: { label: 'הוראת קבע', emoji: '🔄', color: 'bg-green-100 text-green-700' },
  loan_payment: { label: 'החזר הלוואה', emoji: '🏦', color: 'bg-orange-100 text-orange-700' },
  other: { label: 'אחר', emoji: '📋', color: 'bg-gray-100 text-gray-700' },
};

export default function CashFlowPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: futurePayments = [], isLoading } = useQuery({
    queryKey: ['futurePayments'],
    queryFn: () => base44.entities.FuturePayment.list('due_date'),
    initialData: [],
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FuturePayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futurePayments'] });
      setShowForm(false);
      setEditingPayment(null);
      toast.success('תשלום נוסף');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FuturePayment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futurePayments'] });
      setShowForm(false);
      setEditingPayment(null);
      toast.success('תשלום עודכן');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FuturePayment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futurePayments'] });
      toast.success('תשלום נמחק');
    },
  });

  const markAsPaid = useMutation({
    mutationFn: (payment) => base44.entities.FuturePayment.update(payment.id, { ...payment, is_paid: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['futurePayments'] });
      toast.success('✓ סומן כשולם');
    },
  });

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get unpaid payments for this month
    const monthPayments = futurePayments.filter(p => {
      if (!p.due_date) return false;
      const dueDate = parseISO(p.due_date);
      return isSameMonth(dueDate, selectedMonth) && !p.is_paid;
    });

    // Estimate current balance (simplified)
    let estimatedBalance = 10000; // This would come from actual bank data
    
    return days.map(day => {
      const dayPayments = monthPayments.filter(p => 
        isSameDay(parseISO(p.due_date), day)
      );
      const dayTotal = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Adjust balance
      if (isBefore(day, new Date()) || isSameDay(day, new Date())) {
        estimatedBalance -= dayTotal;
      }
      
      return {
        date: day,
        payments: dayPayments,
        total: dayTotal,
        balance: estimatedBalance,
        isNegative: estimatedBalance < 0
      };
    });
  }, [futurePayments, selectedMonth, monthStart, monthEnd]);

  // Monthly totals
  const monthlyTotal = calendarData.reduce((sum, day) => sum + day.total, 0);
  const upcomingPayments = futurePayments.filter(p => !p.is_paid && p.due_date && parseISO(p.due_date) >= new Date());
  const overduePayments = futurePayments.filter(p => !p.is_paid && p.due_date && isBefore(parseISO(p.due_date), new Date()));

  // Check for negative balance warning
  const negativeDay = calendarData.find(d => d.isNegative && !isBefore(d.date, new Date()));

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      <PageHeader 
        title="תזרים מזומנים" 
        icon={Calendar}
        description="צפה בתשלומים עתידיים ותכנן את התזרים"
      >
        <Button
          onClick={() => { setEditingPayment(null); setShowForm(true); }}
          size="sm"
          className="h-10 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          תשלום חדש
        </Button>
      </PageHeader>

      {/* Warning Alert */}
      {negativeDay && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            ⚠️ צפויה יתרה שלילית ב-{format(negativeDay.date, 'd בMMMM', { locale: he })}. 
            מומלץ לתכנן מראש!
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">החודש</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ₪{monthlyTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500">ממתינים</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {upcomingPayments.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">באיחור</span>
            </div>
            <p className={`text-xl font-bold ${overduePayments.length > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {overduePayments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {format(selectedMonth, 'MMMM yyyy', { locale: he })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm overflow-hidden">
        <CardContent className="p-3">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => (
              <div key={idx} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for start of month */}
            {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            
            {calendarData.map((day, idx) => {
              const hasPayments = day.payments.length > 0;
              const dayIsToday = isToday(day.date);
              const isPast = isBefore(day.date, new Date()) && !dayIsToday;
              
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => hasPayments && setSelectedDay(day)}
                  className={`aspect-square p-1 rounded-lg text-center transition-all ${
                    dayIsToday ? 'bg-blue-500 text-white' :
                    day.isNegative && !isPast ? 'bg-red-100 dark:bg-red-900/30' :
                    hasPayments ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100' :
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    dayIsToday ? 'text-white' :
                    isPast ? 'text-gray-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {format(day.date, 'd')}
                  </div>
                  {hasPayments && (
                    <div className={`text-[10px] font-semibold ${
                      dayIsToday ? 'text-white/80' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      ₪{day.total > 999 ? `${(day.total/1000).toFixed(1)}K` : day.total}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments List */}
      <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            תשלומים קרובים
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {upcomingPayments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="אין תשלומים קרובים"
              description="הוסף צ'קים דחויים, תשלומים באשראי או הוראות קבע"
              actionLabel="הוסף תשלום"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-2">
              {upcomingPayments.slice(0, 10).map((payment) => {
                const config = paymentTypeConfig[payment.type] || paymentTypeConfig.other;
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.emoji}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{payment.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(payment.due_date), 'd בMMMM', { locale: he })}
                          {payment.installment_number && ` • תשלום ${payment.installment_number}/${payment.total_installments}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        ₪{(payment.amount || 0).toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600"
                        onClick={() => markAsPaid.mutate(payment)}
                        title="סמן כשולם"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => deleteMutation.mutate(payment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay.date, 'd בMMMM yyyy', { locale: he })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-3">
              {selectedDay.payments.map((payment) => {
                const config = paymentTypeConfig[payment.type] || paymentTypeConfig.other;
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.emoji}</span>
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </div>
                    <span className="font-bold">₪{(payment.amount || 0).toLocaleString()}</span>
                  </div>
                );
              })}
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">סה״כ ביום זה</span>
                  <span className="font-bold">₪{selectedDay.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Payment Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'עריכת תשלום' : 'תשלום חדש'}</DialogTitle>
          </DialogHeader>
          <PaymentForm
            payment={editingPayment}
            debts={debts}
            onSubmit={(data) => {
              if (editingPayment) {
                updateMutation.mutate({ id: editingPayment.id, data });
              } else {
                createMutation.mutate(data);
              }
            }}
            onCancel={() => { setShowForm(false); setEditingPayment(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentForm({ payment, debts, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: payment?.description || '',
    amount: payment?.amount || '',
    due_date: payment?.due_date || format(new Date(), 'yyyy-MM-dd'),
    type: payment?.type || 'other',
    payee: payment?.payee || '',
    installment_number: payment?.installment_number || '',
    total_installments: payment?.total_installments || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      installment_number: formData.installment_number ? parseInt(formData.installment_number) : null,
      total_installments: formData.total_installments ? parseInt(formData.total_installments) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">תיאור</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="לדוגמה: צ'ק לחשמל"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">סכום (₪)</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">תאריך פירעון</label>
        <Input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">סוג תשלום</label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(paymentTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.emoji} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {formData.type === 'credit_installment' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">תשלום מס׳</label>
            <Input
              type="number"
              min="1"
              value={formData.installment_number}
              onChange={(e) => setFormData({ ...formData, installment_number: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">מתוך</label>
            <Input
              type="number"
              min="1"
              value={formData.total_installments}
              onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          ביטול
        </Button>
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          {payment ? 'עדכן' : 'הוסף'}
        </Button>
      </div>
    </form>
  );
}