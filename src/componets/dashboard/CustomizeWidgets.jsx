import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

const availableWidgets = [
  { id: 'stats', label: 'כרטיסי סטטיסטיקה', description: 'הכנסות, הוצאות, תזרים' },
  { id: 'alerts', label: 'התראות והמלצות', description: 'התראות חכמות והמלצות אישיות' },
  { id: 'charts', label: 'גרפים', description: 'מגמות ותרשימים' },
  { id: 'quick_info', label: 'מידע מהיר', description: 'חיסכון, חובות, השקעות' }
];

export default function CustomizeWidgets({ onClose, onSave }) {
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await base44.entities.UserPreferences.list();
      if (prefs.length > 0) {
        setSelectedWidgets(prefs[0].dashboard_widgets || ['stats', 'alerts', 'charts', 'quick_info']);
      } else {
        setSelectedWidgets(['stats', 'alerts', 'charts', 'quick_info']);
      }
    } catch (error) {
      setSelectedWidgets(['stats', 'alerts', 'charts', 'quick_info']);
    }
  };

  const toggleWidget = (widgetId) => {
    setSelectedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const prefs = await base44.entities.UserPreferences.list();
      
      if (prefs.length > 0) {
        await base44.entities.UserPreferences.update(prefs[0].id, {
          dashboard_widgets: selectedWidgets
        });
      } else {
        await base44.entities.UserPreferences.create({
          dashboard_widgets: selectedWidgets
        });
      }

      toast.success('העדפות נשמרו בהצלחה!');
      onSave?.(selectedWidgets);
      onClose?.();
    } catch (error) {
      toast.error('שגיאה בשמירת העדפות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="md-card md-elevation-3 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Settings className="w-5 h-5" />
          התאמה אישית של הדשבורד
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          בחר אילו ווידג'טים להציג בדשבורד שלך
        </p>

        <div className="space-y-3">
          {availableWidgets.map(widget => (
            <div key={widget.id} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex-1">
                <label htmlFor={widget.id} className="block font-semibold text-gray-800 dark:text-white cursor-pointer">
                  {widget.label}
                </label>
                <span className="block text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {widget.description}
                </span>
              </div>
              <Switch
                id={widget.id}
                checked={selectedWidgets.includes(widget.id)}
                onCheckedChange={() => toggleWidget(widget.id)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={loading || selectedWidgets.length === 0}
            className="flex-1 md-ripple"
          >
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'שומר...' : 'שמור העדפות'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="md-ripple"
          >
            ביטול
          </Button>
        </div>

        {selectedWidgets.length === 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            יש לבחור לפחות ווידג'ט אחד
          </p>
        )}
      </CardContent>
    </Card>
  );
}