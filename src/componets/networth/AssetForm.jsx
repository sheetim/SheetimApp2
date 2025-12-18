import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const assetTypes = ["דירה", "רכב", "תכולה", "חשבון_בנק", "קופת_גמל", "ביטוח_מנהלים", "זהב", "אחר"];

export default function AssetForm({ asset, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(asset || {
    name: '',
    type: '',
    current_value: '',
    purchase_value: '',
    purchase_date: new Date().toISOString().split('T')[0],
    is_liquid: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      current_value: parseFloat(formData.current_value),
      purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם הנכס</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="לדוגמה: דירה בתל אביב, רכב טויוטה"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">סוג הנכס</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_value">ערך נוכחי (₪)</Label>
          <Input
            id="current_value"
            type="number"
            step="0.01"
            value={formData.current_value}
            onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_value">ערך רכישה (₪)</Label>
          <Input
            id="purchase_value"
            type="number"
            step="0.01"
            value={formData.purchase_value}
            onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">תאריך רכישה</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="is_liquid">נכס נזיל</Label>
            <p className="text-xs text-gray-500">האם ניתן להמיר במהירות למזומן?</p>
          </div>
          <Switch
            id="is_liquid"
            checked={formData.is_liquid}
            onCheckedChange={(checked) => setFormData({ ...formData, is_liquid: checked })}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-teal-600 hover:bg-teal-700">
          {asset ? 'עדכן' : 'הוסף'} נכס
        </Button>
      </div>
    </form>
  );
}