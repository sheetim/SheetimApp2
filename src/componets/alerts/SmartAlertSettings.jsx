import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bell, Plus, Trash2, Settings, AlertTriangle, 
  TrendingUp, TrendingDown, Target, CreditCard,
  Wallet, PiggyBank, Calendar, Zap
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ALERT_TYPES = [
  {
    id: "budget_threshold",
    name: "חריגה מתקציב",
    description: "התראה כשמתקרבים לגבול התקציב",
    icon: Wallet,
    color: "text-purple-600",
    hasCategory: true,
    hasThreshold: true,
    defaultThreshold: 80
  },
  {
    id: "expense_spike",
    name: "עלייה חדה בהוצאות",
    description: "התראה כשקטגוריה עולה משמעותית",
    icon: TrendingUp,
    color: "text-red-600",
    hasCategory: true,
    hasThreshold: true,
    defaultThreshold: 50
  },
  {
    id: "goal_deadline",
    name: "יעד מתקרב",
    description: "תזכורת לפני תאריך יעד חיסכון",
    icon: Target,
    color: "text-green-600",
    hasCategory: false,
    hasThreshold: false,
    hasDays: true,
    defaultDays: 30
  },
  {
    id: "debt_payment",
    name: "תשלום חוב",
    description: "תזכורת לפני מועד תשלום חוב",
    icon: CreditCard,
    color: "text-orange-600",
    hasCategory: false,
    hasThreshold: false,
    hasDays: true,
    defaultDays: 3
  },
  {
    id: "low_balance",
    name: "יתרה נמוכה",
    description: "התראה כשהחיסכון יורד מתחת לסכום",
    icon: AlertTriangle,
    color: "text-yellow-600",
    hasCategory: false,
    hasAmount: true,
    defaultAmount: 5000
  },
  {
    id: "savings_rate",
    name: "שיעור חיסכון",
    description: "התראה כששיעור החיסכון נמוך מהיעד",
    icon: PiggyBank,
    color: "text-teal-600",
    hasCategory: false,
    hasThreshold: true,
    defaultThreshold: 20
  },
  {
    id: "recurring_reminder",
    name: "הוצאה חוזרת",
    description: "תזכורת להוצאות קבועות",
    icon: Calendar,
    color: "text-blue-600",
    hasCategory: true,
    hasDays: true,
    defaultDays: 1
  }
];

const CATEGORIES = [
  "מזון_ומשקאות", "קניות", "תחבורה", "בילויים", 
  "שירותים", "בריאות", "חינוך", "דיור", "חובות", "חיסכון", "אחר"
];

export default function SmartAlertSettings({ onSave, initialAlerts = [] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "",
    category: "",
    threshold: 80,
    amount: 5000,
    days: 3,
    enabled: true
  });

  const handleAddAlert = () => {
    if (!newAlert.type) {
      toast({
        title: "שגיאה",
        description: "יש לבחור סוג התראה",
        variant: "destructive"
      });
      return;
    }

    const alertType = ALERT_TYPES.find(t => t.id === newAlert.type);
    const alertToAdd = {
      ...newAlert,
      id: Date.now().toString(),
      name: alertType.name,
      icon: alertType.id
    };

    setAlerts([...alerts, alertToAdd]);
    setNewAlert({
      type: "",
      category: "",
      threshold: 80,
      amount: 5000,
      days: 3,
      enabled: true
    });
    setIsAddingNew(false);
    
    toast({
      title: "התראה נוספה",
      description: `התראת "${alertType.name}" נוספה בהצלחה`
    });
  };

  const handleToggleAlert = (alertId) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    toast({
      title: "התראה נמחקה",
      description: "ההתראה הוסרה בהצלחה"
    });
  };

  const handleSave = () => {
    onSave?.(alerts);
    toast({
      title: "ההגדרות נשמרו",
      description: "הגדרות ההתראות עודכנו בהצלחה"
    });
  };

  const selectedAlertType = ALERT_TYPES.find(t => t.id === newAlert.type);

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            התראות חכמות
          </h3>
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 rounded-xl">
                <Plus className="w-4 h-4 ml-1" />
                הוסף
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת התראה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Alert Type Selection */}
                <div className="space-y-2">
                  <Label>סוג התראה</Label>
                  <Select 
                    value={newAlert.type} 
                    onValueChange={(val) => setNewAlert({ ...newAlert, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג התראה" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className={`w-4 h-4 ${type.color}`} />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAlertType && (
                    <p className="text-xs text-gray-500">{selectedAlertType.description}</p>
                  )}
                </div>

                {/* Category Selection (if applicable) */}
                {selectedAlertType?.hasCategory && (
                  <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    <Select 
                      value={newAlert.category} 
                      onValueChange={(val) => setNewAlert({ ...newAlert, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הקטגוריות</SelectItem>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Threshold (if applicable) */}
                {selectedAlertType?.hasThreshold && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>סף התראה</Label>
                      <span className="text-sm font-semibold text-blue-600">{newAlert.threshold}%</span>
                    </div>
                    <Slider
                      value={[newAlert.threshold]}
                      onValueChange={(val) => setNewAlert({ ...newAlert, threshold: val[0] })}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      התראה תישלח כשתגיע ל-{newAlert.threshold}%
                    </p>
                  </div>
                )}

                {/* Amount (if applicable) */}
                {selectedAlertType?.hasAmount && (
                  <div className="space-y-2">
                    <Label>סכום מינימלי (₪)</Label>
                    <Input
                      type="number"
                      value={newAlert.amount}
                      onChange={(e) => setNewAlert({ ...newAlert, amount: parseInt(e.target.value) || 0 })}
                      placeholder="5000"
                    />
                  </div>
                )}

                {/* Days before (if applicable) */}
                {selectedAlertType?.hasDays && (
                  <div className="space-y-2">
                    <Label>ימים לפני</Label>
                    <Input
                      type="number"
                      value={newAlert.days}
                      onChange={(e) => setNewAlert({ ...newAlert, days: parseInt(e.target.value) || 1 })}
                      placeholder="3"
                      min={1}
                      max={30}
                    />
                    <p className="text-xs text-gray-500">
                      התראה תישלח {newAlert.days} ימים לפני המועד
                    </p>
                  </div>
                )}

                <Button onClick={handleAddAlert} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף התראה
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              אין התראות מוגדרות
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              הוסף התראות כדי לקבל עדכונים חכמים
            </p>
          </div>
        ) : (
          <>
            {alerts.map(alert => {
              const alertType = ALERT_TYPES.find(t => t.id === alert.type);
              const Icon = alertType?.icon || Bell;
              
              return (
                <div 
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    alert.enabled 
                      ? 'bg-gray-50 dark:bg-gray-700/50'
                      : 'bg-gray-100 dark:bg-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      alert.enabled ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${alert.enabled ? alertType?.color : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alertType?.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {alert.category && alert.category !== 'all' && (
                          <Badge variant="outline" className="text-[10px]">
                            {alert.category.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {alert.threshold && (
                          <Badge variant="outline" className="text-[10px]">
                            {alert.threshold}%
                          </Badge>
                        )}
                        {alert.amount && (
                          <Badge variant="outline" className="text-[10px]">
                            ₪{alert.amount.toLocaleString()}
                          </Badge>
                        )}
                        {alert.days && (
                          <Badge variant="outline" className="text-[10px]">
                            {alert.days} ימים
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={() => handleToggleAlert(alert.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            <Button 
              onClick={handleSave}
              className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <Zap className="w-4 h-4 ml-2" />
              שמור הגדרות
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}