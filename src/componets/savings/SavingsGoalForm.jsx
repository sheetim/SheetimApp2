import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const iconOptions = ["Home", "Car", "Plane", "GraduationCap", "Heart", "Gift", "Sparkles", "Trophy"];
const colorOptions = ["blue", "green", "purple", "orange", "pink", "teal", "red", "indigo"];

export default function SavingsGoalForm({ goal, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(goal || {
    name: '',
    target_amount: '',
    current_amount: 0,
    target_date: '',
    icon: 'Target',
    color: 'blue'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount || 0)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">שם היעד</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="לדוגמה: קרן חירום, טיול לחו״ל, דירה חדשה"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_amount">סכום יעד (₪)</Label>
          <Input
            id="target_amount"
            type="number"
            step="0.01"
            value={formData.target_amount}
            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_amount">סכום נוכחי (₪)</Label>
          <Input
            id="current_amount"
            type="number"
            step="0.01"
            value={formData.current_amount}
            onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_date">תאריך יעד</Label>
          <Input
            id="target_date"
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>צבע</Label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full bg-${color}-500 ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                } transition-all md-ripple`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-orange-600 hover:bg-orange-700">
          {goal ? 'עדכן' : 'הוסף'} יעד
        </Button>
      </div>
    </form>
  );
}