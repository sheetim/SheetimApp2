import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function DebtCalculator({ onAddDebt }) {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    if (loanAmount && interestRate && loanPeriod) {
      const principal = parseFloat(loanAmount);
      const monthlyRate = parseFloat(interestRate) / 100 / 12;
      const months = parseFloat(loanPeriod) * 12;

      if (monthlyRate === 0) {
        const payment = principal / months;
        setMonthlyPayment(payment);
        setTotalInterest(0);
      } else {
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        const total = payment * months;
        setMonthlyPayment(payment);
        setTotalInterest(total - principal);
      }
    }
  }, [loanAmount, interestRate, loanPeriod]);

  const handleAddAsDebt = () => {
    if (loanAmount && interestRate && loanPeriod && monthlyPayment) {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + parseFloat(loanPeriod));

      onAddDebt({
        name: 'הלוואה מחושבת',
        type: 'הלוואה_בנק',
        original_amount: parseFloat(loanAmount),
        current_balance: parseFloat(loanAmount),
        interest_rate: parseFloat(interestRate),
        monthly_payment: monthlyPayment,
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        lender: ''
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loanAmount">סכום ההלוואה (₪)</Label>
          <Input
            id="loanAmount"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="לדוגמה: 500000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">ריבית שנתית (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="לדוגמה: 3.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanPeriod">תקופת ההלוואה (שנים)</Label>
          <Input
            id="loanPeriod"
            type="number"
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(e.target.value)}
            placeholder="לדוגמה: 20"
          />
        </div>
      </div>

      {monthlyPayment > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="md-card md-elevation-1 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">תשלום חודשי</p>
                  <p className="text-2xl font-bold text-gray-900">₪{monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md-card md-elevation-1 border-0 bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">סה״כ ריבית</p>
                  <p className="text-2xl font-bold text-gray-900">₪{totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {monthlyPayment > 0 && (
        <Button onClick={handleAddAsDebt} className="w-full md-ripple bg-red-600 hover:bg-red-700">
          הוסף כחוב חדש
        </Button>
      )}
    </div>
  );
}