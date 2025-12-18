import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const categories = [
  "מזון_ומשקאות", "קניות", "תחבורה", "בילויים", "שירותים",
  "בריאות", "חינוך", "דיור", "חובות", "חיסכון", "אחר"
];

export default function BudgetForm({ budget, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(budget || {
    category: '',
    monthly_limit: '',
    month: format(new Date(), 'yyyy-MM'),
    alert_threshold: 80
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      monthly_limit: parseFloat(formData.monthly_limit),
      alert_threshold: parseFloat(formData.alert_threshold)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-gray-900 dark:text-white text-sm md:text-base">קטגוריה</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_limit" className="text-gray-900 dark:text-white text-sm md:text-base">תקציב חודשי (₪)</Label>
          <Input
            id="monthly_limit"
            type="number"
            step="0.01"
            value={formData.monthly_limit}
            onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
            required
            className="h-11 md:h-10 text-base"
            inputMode="decimal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="month" className="text-gray-900 dark:text-white text-sm md:text-base">חודש</Label>
          <Input
            id="month"
            type="month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            required
            className="h-11 md:h-10 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alert_threshold" className="text-gray-900 dark:text-white text-sm md:text-base">אחוז התראה (%)</Label>
          <Input
            id="alert_threshold"
            type="number"
            min="0"
            max="100"
            value={formData.alert_threshold}
            onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
            required
            className="h-11 md:h-10 text-base"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 md:gap-3 justify-end pt-2 md:pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple h-11 md:h-10">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-purple-600 hover:bg-purple-700 h-11 md:h-10">
          {budget ? 'עדכן' : 'הוסף'} תקציב
        </Button>
      </div>
    </form>
  );
}