import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, CreditCard, Minus } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { he } from "date-fns/locale";

const debtTypeColors = {
  'משכנתא': 'from-purple-400 to-purple-600',
  'הלוואה_בנק': 'from-blue-400 to-blue-600',
  'כרטיס_אשראי': 'from-red-400 to-red-600',
  'הלוואה_פרטית': 'from-orange-400 to-orange-600',
  'אחר': 'from-gray-400 to-gray-600'
};

export default function DebtCard({ debt, onEdit, onDelete, onUpdateBalance }) {
  const [payAmount, setPayAmount] = useState('');
  const [showPayInput, setShowPayInput] = useState(false);

  const percentagePaid = ((debt.original_amount - debt.current_balance) / debt.original_amount) * 100;
  const monthsLeft = debt.end_date ? differenceInMonths(new Date(debt.end_date), new Date()) : null;

  const handlePayment = () => {
    if (payAmount) {
      const newBalance = Math.max(0, debt.current_balance - parseFloat(payAmount));
      onUpdateBalance(newBalance);
      setPayAmount('');
      setShowPayInput(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${debtTypeColors[debt.type] || debtTypeColors['אחר']}`} />
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-8 h-8 bg-gradient-to-br ${debtTypeColors[debt.type] || debtTypeColors['אחר']} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{debt.name}</h3>
              <p className="text-xs text-gray-500">{debt.type?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 rounded-lg">
              <Pencil className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 rounded-lg">
              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-bold text-red-600 dark:text-red-400">₪{debt.current_balance?.toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ ₪{debt.original_amount?.toLocaleString()}</span>
        </div>

        {/* Progress */}
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className="absolute h-full rounded-full transition-all bg-green-500" style={{ width: `${percentagePaid}%` }} />
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-green-600">{percentagePaid.toFixed(0)}% שולם</span>
          {monthsLeft !== null && monthsLeft > 0 && <span className="text-xs text-gray-500">{monthsLeft} חודשים</span>}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
          <div>
            <p className="text-xs text-gray-500">תשלום חודשי</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">₪{debt.monthly_payment?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ריבית</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{debt.interest_rate}%</p>
          </div>
        </div>

        {/* Pay */}
        {!showPayInput ? (
          <Button onClick={() => setShowPayInput(true)} variant="outline" size="sm" className="w-full h-8 text-xs rounded-lg">
            <Minus className="w-3.5 h-3.5 ml-1" />רשום תשלום
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input type="number" placeholder="סכום" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 h-8 text-sm" autoFocus onKeyPress={(e) => e.key === 'Enter' && handlePayment()} />
            <Button onClick={handlePayment} size="sm" className="h-8 px-3">שלם</Button>
            <Button onClick={() => { setShowPayInput(false); setPayAmount(''); }} variant="outline" size="sm" className="h-8 px-2">✕</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}