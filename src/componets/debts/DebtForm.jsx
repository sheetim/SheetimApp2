import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const debtTypes = ["משכנתא", "הלוואה_בנק", "כרטיס_אשראי", "הלוואה_פרטית", "אחר"];

export default function DebtForm({ debt, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(debt || {
    name: '',
    type: '',
    original_amount: '',
    current_balance: '',
    interest_rate: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    lender: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      original_amount: parseFloat(formData.original_amount),
      current_balance: parseFloat(formData.current_balance),
      interest_rate: parseFloat(formData.interest_rate),
      monthly_payment: parseFloat(formData.monthly_payment)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם החוב</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="לדוגמה: משכנתא דירה, הלוואת רכב"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">סוג החוב</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג" />
            </SelectTrigger>
            <SelectContent>
              {debtTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lender">שם המלווה</Label>
          <Input
            id="lender"
            value={formData.lender}
            onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
            placeholder="לדוגמה: בנק הפועלים"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_amount">סכום מקורי (₪)</Label>
          <Input
            id="original_amount"
            type="number"
            step="0.01"
            value={formData.original_amount}
            onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_balance">יתרה נוכחית (₪)</Label>
          <Input
            id="current_balance"
            type="number"
            step="0.01"
            value={formData.current_balance}
            onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest_rate">ריבית שנתית (%)</Label>
          <Input
            id="interest_rate"
            type="number"
            step="0.01"
            value={formData.interest_rate}
            onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_payment">תשלום חודשי (₪)</Label>
          <Input
            id="monthly_payment"
            type="number"
            step="0.01"
            value={formData.monthly_payment}
            onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">תאריך התחלה</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">תאריך סיום משוער</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-red-600 hover:bg-red-700">
          {debt ? 'עדכן' : 'הוסף'} חוב
        </Button>
      </div>
    </form>
  );
}