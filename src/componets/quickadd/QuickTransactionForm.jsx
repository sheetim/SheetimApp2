import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { format } from "date-fns";

const expenseCategories = [
  { id: 'מזון_ומשקאות', emoji: '🍕', label: 'אוכל' },
  { id: 'תחבורה', emoji: '🚗', label: 'תחבורה' },
  { id: 'קניות', emoji: '🛒', label: 'קניות' },
  { id: 'בילויים', emoji: '☕', label: 'בילויים' },
  { id: 'בריאות', emoji: '💊', label: 'בריאות' },
  { id: 'דיור', emoji: '🏠', label: 'דיור' },
  { id: 'שירותים', emoji: '📱', label: 'שירותים' },
  { id: 'אחר_הוצאה', emoji: '📦', label: 'אחר' },
];

const incomeCategories = [
  { id: 'משכורת', emoji: '💰', label: 'משכורת' },
  { id: 'עסק_עצמאי', emoji: '💼', label: 'עסק' },
  { id: 'השקעות', emoji: '📈', label: 'השקעות' },
  { id: 'אחר_הכנסה', emoji: '💵', label: 'אחר' },
];

export default function QuickTransactionForm({ type, onComplete }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const amountRef = useRef(null);
  const queryClient = useQueryClient();

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    // Focus amount input on mount
    setTimeout(() => amountRef.current?.focus(), 100);
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(type === 'expense' ? '💸 הוצאה נוספה!' : '💰 הכנסה נוספה!');
      onComplete?.();
    },
    onError: () => {
      toast.error('שגיאה בשמירה');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('הזן סכום תקין');
      return;
    }

    createMutation.mutate({
      type,
      amount: parseFloat(amount),
      category: category || (type === 'expense' ? 'אחר_הוצאה' : 'אחר_הכנסה'),
      description: description || undefined,
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 space-y-4 pb-4" dir="rtl">
      {/* Header */}
      <div className="text-center pb-2">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2 ${
          type === 'expense' 
            ? 'bg-red-100 dark:bg-red-900/30' 
            : 'bg-green-100 dark:bg-green-900/30'
        }`}>
          <span className="text-2xl">{type === 'expense' ? '💸' : '💰'}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {type === 'expense' ? 'הוצאה מהירה' : 'הכנסה מהירה'}
        </h3>
      </div>

      {/* Amount Input */}
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₪</div>
        <Input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-center text-2xl font-bold h-14 pr-10 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-xl"
        />
      </div>

      {/* Quick Category Selection */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">בחר קטגוריה</p>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                category === cat.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <span className="text-2xl mb-1">{cat.emoji}</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Description */}
      <Input
        placeholder="תיאור (אופציונלי)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
      />

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={createMutation.isPending || !amount}
        className={`w-full h-12 text-base font-semibold rounded-xl ${
          type === 'expense'
            ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        }`}
      >
        {createMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5 ml-2" />
            שמור
          </>
        )}
      </Button>
    </form>
  );
}