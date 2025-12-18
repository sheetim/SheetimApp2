import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const categories = [
  { value: "חיסכון_לפרישה", label: "חיסכון לפרישה", icon: "🏖️" },
  { value: "קניית_דירה", label: "קניית דירה", icon: "🏠" },
  { value: "חופשה", label: "חופשה", icon: "✈️" },
  { value: "השכלה", label: "השכלה", icon: "🎓" },
  { value: "פירעון_חובות", label: "פירעון חובות", icon: "💳" },
  { value: "קרן_חירום", label: "קרן חירום", icon: "🛡️" },
  { value: "השקעות", label: "השקעות", icon: "📈" },
  { value: "עצמאות_פיננסית", label: "עצמאות פיננסית", icon: "🎯" },
  { value: "שיפוץ", label: "שיפוץ", icon: "🔨" },
  { value: "אחר", label: "אחר", icon: "📝" }
];

export default function PersonalGoalForm({ goal, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(goal || {
    title: "",
    description: "",
    category: "",
    target_amount: "",
    current_progress: 0,
    priority: "בינונית",
    priority_rank: "",
    time_frame: "בינוני",
    target_date: null,
    monthly_allocation: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      target_amount: parseFloat(formData.target_amount) || 0,
      current_progress: parseFloat(formData.current_progress) || 0,
      monthly_allocation: parseFloat(formData.monthly_allocation) || 0,
      priority_rank: parseInt(formData.priority_rank) || 99,
      target_date: formData.target_date ? format(formData.target_date, 'yyyy-MM-dd') : null
    });
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          {goal ? 'עריכת יעד אישי' : 'יעד פיננסי אישי חדש'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-300">כותרת היעד *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="למשל: קניית דירה ראשונה"
              required
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-300">קטגוריה *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700">
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="dark:text-white">
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-300">תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תאר את היעד שלך..."
              rows={3}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">סכום יעד (₪)</Label>
              <Input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                placeholder="0"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">התקדמות נוכחית (₪)</Label>
              <Input
                type="number"
                value={formData.current_progress}
                onChange={(e) => setFormData({ ...formData, current_progress: e.target.value })}
                placeholder="0"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">עדיפות *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value="גבוהה" className="dark:text-white">🔴 גבוהה</SelectItem>
                  <SelectItem value="בינונית" className="dark:text-white">🟡 בינונית</SelectItem>
                  <SelectItem value="נמוכה" className="dark:text-white">🟢 נמוכה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">דירוג עדיפות (1 = הכי חשוב)</Label>
              <Input
                type="number"
                min="1"
                max="99"
                value={formData.priority_rank}
                onChange={(e) => setFormData({ ...formData, priority_rank: e.target.value })}
                placeholder="1"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">היועץ הפיננסי ייתן עדיפות ליעדים לפי דירוג זה</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label className="dark:text-gray-300">טווח זמן *</Label>
              <Select
                value={formData.time_frame}
                onValueChange={(value) => setFormData({ ...formData, time_frame: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value="קצר_טווח" className="dark:text-white">⚡ קצר טווח (עד שנה)</SelectItem>
                  <SelectItem value="בינוני" className="dark:text-white">📅 בינוני (1-3 שנים)</SelectItem>
                  <SelectItem value="ארוך_טווח" className="dark:text-white">🎯 ארוך טווח (3+ שנים)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">תאריך יעד *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.target_date ? format(formData.target_date, 'PPP', { locale: he }) : 'בחר תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-700">
                  <Calendar
                    mode="single"
                    selected={formData.target_date}
                    onSelect={(date) => setFormData({ ...formData, target_date: date })}
                    initialFocus
                    locale={he}
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-300">הקצאה חודשית מומלצת (₪)</Label>
            <Input
              type="number"
              value={formData.monthly_allocation}
              onChange={(e) => setFormData({ ...formData, monthly_allocation: e.target.value })}
              placeholder="0"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-gray-300">הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות על היעד..."
              rows={2}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 md-ripple bg-purple-600 hover:bg-purple-700">
              {goal ? 'עדכן יעד' : 'הוסף יעד'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}