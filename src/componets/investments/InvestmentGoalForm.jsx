import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function InvestmentGoalForm({ goal, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(goal || {
    name: "",
    goal_type: "פרישה",
    target_amount: "",
    current_amount: 0,
    target_date: "",
    risk_profile: "מתון",
    monthly_contribution: "",
    expected_return: 5,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      target_amount: parseFloat(formData.target_amount) || 0,
      current_amount: parseFloat(formData.current_amount) || 0,
      monthly_contribution: parseFloat(formData.monthly_contribution) || 0,
      expected_return: parseFloat(formData.expected_return) || 5
    });
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="dark:text-white">
          {goal ? "עריכת יעד השקעה" : "יעד השקעה חדש"}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="dark:text-gray-200">שם היעד *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="לדוגמה: פרישה בגיל 65"
                required
                className="dark:bg-gray-700"
              />
            </div>

            <div>
              <Label className="dark:text-gray-200">סוג יעד *</Label>
              <Select value={formData.goal_type} onValueChange={(val) => setFormData({...formData, goal_type: val})}>
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="פרישה">פרישה</SelectItem>
                  <SelectItem value="רכישת_דירה">רכישת דירה</SelectItem>
                  <SelectItem value="חינוך_ילדים">חינוך ילדים</SelectItem>
                  <SelectItem value="חירום">קרן חירום</SelectItem>
                  <SelectItem value="נסיעה">נסיעה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="dark:text-gray-200">סכום יעד (₪) *</Label>
              <Input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                placeholder="1000000"
                required
                className="dark:bg-gray-700"
              />
            </div>

            <div>
              <Label className="dark:text-gray-200">סכום נוכחי (₪)</Label>
              <Input
                type="number"
                value={formData.current_amount}
                onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                placeholder="0"
                className="dark:bg-gray-700"
              />
            </div>

            <div>
              <Label className="dark:text-gray-200">תאריך יעד *</Label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                required
                className="dark:bg-gray-700"
              />
            </div>

            <div>
              <Label className="dark:text-gray-200">פרופיל סיכון *</Label>
              <Select value={formData.risk_profile} onValueChange={(val) => setFormData({...formData, risk_profile: val})}>
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="שמרני">שמרני (סיכון נמוך)</SelectItem>
                  <SelectItem value="מתון">מתון (סיכון בינוני)</SelectItem>
                  <SelectItem value="אגרסיבי">אגרסיבי (סיכון גבוה)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="dark:text-gray-200">הפקדה חודשית מתוכננת (₪)</Label>
              <Input
                type="number"
                value={formData.monthly_contribution}
                onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                placeholder="1000"
                className="dark:bg-gray-700"
              />
            </div>

            <div>
              <Label className="dark:text-gray-200">תשואה צפויה שנתית (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.expected_return}
                onChange={(e) => setFormData({...formData, expected_return: e.target.value})}
                placeholder="5"
                className="dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-200">הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="הערות נוספות על היעד..."
              className="dark:bg-gray-700"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit">
              {goal ? "עדכן יעד" : "צור יעד"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}