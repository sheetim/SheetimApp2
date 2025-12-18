import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart3, 
  PieChart, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Receipt,
  Lightbulb,
  Activity,
  Save
} from "lucide-react";
import { toast } from "sonner";
import ProBadge from "../common/ProBadge";

const widgetGroups = {
  main: {
    title: "ראשי",
    widgets: [
      { id: 'net_worth', label: 'שווי נקי', icon: PieChart, description: 'כמה אני שווה – נכסים פחות חובות', default: true },
      { id: 'monthly_expenses', label: 'הוצאות חודשיות', icon: TrendingUp, description: 'סיכום הוצאות החודש', default: true },
      { id: 'monthly_income', label: 'הכנסות חודשיות', icon: BarChart3, description: 'סיכום הכנסות החודש', default: true },
      { id: 'recent_transactions', label: 'תנועות אחרונות', icon: Receipt, description: '3 התנועות האחרונות', default: true },
    ]
  },
  tracking: {
    title: "מעקב ויעדים",
    widgets: [
      { id: 'savings_progress', label: 'התקדמות חיסכון', icon: Target, description: 'יעדי חיסכון והתקדמות', default: false },
      { id: 'alerts', label: 'התראות והמלצות', icon: AlertTriangle, description: 'התראות חכמות על תקציב', default: false },
      { id: 'financial_health', label: 'בריאות פיננסית', icon: Activity, description: 'ציון בריאות פיננסית', default: false, pro: true },
    ]
  },
  tools: {
    title: "כלים חכמים",
    widgets: [
      { id: 'ai_tip', label: 'טיפ חכם מה-AI', icon: Lightbulb, description: 'טיפ פיננסי יומי', default: true },
      { id: 'ai_insights', label: 'תובנות AI', icon: Sparkles, description: 'ניתוח מעמיק והמלצות', default: false, pro: true },
    ]
  }
};

const allWidgets = Object.values(widgetGroups).flatMap(g => g.widgets);

export default function AddWidgetsModal({ open, onOpenChange, currentWidgets, onSave }) {
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentWidgets && currentWidgets.length > 0) {
      setSelectedWidgets(currentWidgets);
    } else {
      setSelectedWidgets(allWidgets.filter(w => w.default).map(w => w.id));
    }
  }, [currentWidgets, open]);

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

      localStorage.setItem('dashboardWidgets', JSON.stringify(selectedWidgets));
      toast.success('העדפות נשמרו בהצלחה!');
      onSave?.(selectedWidgets);
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בשמירת העדפות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ערוך את הדשבורד</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">בחר אילו ווידג׳טים יופיעו בלוח הבקרה שלך</p>
        </DialogHeader>
        
        <div className="space-y-5 overflow-y-auto max-h-[50vh] py-2">
          {Object.entries(widgetGroups).map(([groupKey, group]) => (
            <div key={groupKey}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.widgets.map(widget => {
                  const Icon = widget.icon;
                  const isSelected = selectedWidgets.includes(widget.id);
                  
                  return (
                    <button 
                      key={widget.id}
                      type="button"
                      onClick={() => toggleWidget(widget.id)}
                      className={`w-full flex items-center justify-between p-3 min-h-[56px] rounded-xl border transition-all touch-manipulation ${
                        isSelected 
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-right">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'bg-purple-100 dark:bg-purple-900/40' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{widget.label}</span>
                            {widget.pro && <ProBadge size="xs" />}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{widget.description}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pointer-events-none">
                        <Switch
                          checked={isSelected}
                          tabIndex={-1}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={loading || selectedWidgets.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'שומר...' : 'שמור'}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}