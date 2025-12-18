import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { AIService } from "../ai/AIService";
import DatePicker from "../common/DatePicker";
import { base44 } from "@/api/base44Client";

const incomeCategories = ["משכורת", "עסק_עצמאי", "השקעות", "אחר_הכנסה"];
const expenseCategories = [
  "מזון_ומשקאות", "קניות", "תחבורה", "בילויים", "שירותים",
  "בריאות", "חינוך", "דיור", "חובות", "חיסכון", "אחר_הוצאה"
];

export default function TransactionForm({ transaction, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(transaction || {
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'מזומן',
    billing_date: '',
    is_recurring: false,
    recurring_frequency: 'monthly'
  });

  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [userPrefs, setUserPrefs] = useState({ credit_card_billing_day: 10 });

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const prefs = await base44.entities.UserPreferences.list();
        if (prefs.length > 0) {
          setUserPrefs(prefs[0]);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };
    fetchPrefs();
  }, []);

  useEffect(() => {
    const getSuggestion = async () => {
      if (formData.description && formData.description.length > 3 && formData.amount && !formData.category) {
        setIsLoadingSuggestion(true);
        const suggestion = await AIService.suggestCategory(formData.description, formData.amount);
        if (suggestion) {
          setSuggestedCategory(suggestion);
        }
        setIsLoadingSuggestion(false);
      }
    };

    const timeoutId = setTimeout(getSuggestion, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.description, formData.amount]);

  // Auto-calculate billing_date when payment_method or date changes
  useEffect(() => {
    if (formData.payment_method === 'כרטיס_אשראי' && formData.date) {
      const transactionDate = new Date(formData.date);
      const billingDay = userPrefs.credit_card_billing_day || 10;
      
      let billingDate = new Date(transactionDate);
      billingDate.setDate(billingDay);
      
      // If transaction is after billing day, move to next month
      if (transactionDate.getDate() >= billingDay) {
        billingDate.setMonth(billingDate.getMonth() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        billing_date: billingDate.toISOString().split('T')[0]
      }));
    } else if (formData.payment_method !== 'כרטיס_אשראי') {
      setFormData(prev => ({ ...prev, billing_date: '' }));
    }
  }, [formData.payment_method, formData.date, userPrefs.credit_card_billing_day]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      setFormData({ ...formData, category: suggestedCategory });
      setSuggestedCategory(null);
    }
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm md:text-base">סוג עסקה</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}
          >
            <SelectTrigger className="h-11 md:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">הכנסה</SelectItem>
              <SelectItem value="expense">הוצאה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm md:text-base">סכום (₪)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="h-11 md:h-10 text-base"
            inputMode="decimal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm md:text-base flex items-center gap-2">
            קטגוריה
            {isLoadingSuggestion && (
              <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
            )}
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData({ ...formData, category: value });
              setSuggestedCategory(null);
            }}
          >
            <SelectTrigger className="h-11 md:h-10">
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {suggestedCategory && !formData.category && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applySuggestedCategory}
              className="w-full text-xs"
            >
              <Sparkles className="w-3 h-3 ml-1" />
              המלצת AI: {suggestedCategory.replace(/_/g, ' ')}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm md:text-base">תאריך</Label>
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            placeholder="בחר תאריך"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method" className="text-sm md:text-base">אמצעי תשלום</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger className="h-11 md:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="מזומן">מזומן</SelectItem>
              <SelectItem value="כרטיס_אשראי">כרטיס אשראי</SelectItem>
              <SelectItem value="העברה_בנקאית">העברה בנקאית</SelectItem>
              <SelectItem value="צ'ק">צ'ק</SelectItem>
              <SelectItem value="אחר">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.payment_method === 'כרטיס_אשראי' && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billing_date" className="text-sm md:text-base">
              תאריך חיוב (אוטומטי - יום {userPrefs.credit_card_billing_day})
            </Label>
            <DatePicker
              value={formData.billing_date}
              onChange={(date) => setFormData({ ...formData, billing_date: date })}
              placeholder="בחר תאריך חיוב"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💳 החיוב יופיע בתזרים המזומנים בתאריך זה במקום תאריך ביצוע העסקה
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm md:text-base">תיאור</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="תיאור העסקה..."
          className="min-h-[88px] text-base resize-none"
        />
      </div>

      <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="space-y-1 flex-1">
          <Label htmlFor="recurring" className="text-sm md:text-base">עסקה חוזרת</Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">האם זו עסקה שחוזרת על עצמה?</p>
        </div>
        <Switch
          id="recurring"
          checked={formData.is_recurring}
          onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          className="shrink-0"
        />
      </div>

      {formData.is_recurring && (
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-sm md:text-base">תדירות</Label>
          <Select
            value={formData.recurring_frequency}
            onValueChange={(value) => setFormData({ ...formData, recurring_frequency: value })}
          >
            <SelectTrigger className="h-11 md:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">יומי</SelectItem>
              <SelectItem value="weekly">שבועי</SelectItem>
              <SelectItem value="monthly">חודשי</SelectItem>
              <SelectItem value="yearly">שנתי</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 md:gap-3 justify-end pt-2 md:pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple h-11 md:h-10">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-blue-600 hover:bg-blue-700 h-11 md:h-10">
          {transaction ? 'עדכן' : 'הוסף'} עסקה
        </Button>
      </div>
    </form>
  );
}