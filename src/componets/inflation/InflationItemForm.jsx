import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["מזון", "דלק", "דיור", "חשמל", "מים", "ביגוד", "בריאות", "חינוך", "תחבורה", "אחר"];

export default function InflationItemForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(item || {
    item_name: '',
    category: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    unit: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item_name">שם המוצר/שירות</Label>
          <Input
            id="item_name"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            placeholder="לדוגמה: לחם, בנזין 95, חשבון חשמל"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">קטגוריה</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">יחידת מידה</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="לדוגמה: ק״ג, ליטר, חודש"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">תאריך</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-pink-600 hover:bg-pink-700">
          {item ? 'עדכן' : 'הוסף'} מוצר
        </Button>
      </div>
    </form>
  );
}