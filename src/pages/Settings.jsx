import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Upload, Download, Moon, Sun, Bell, Database, Palette, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "../components/ThemeProvider";
import { toast } from "sonner";
import SmartImport from "../components/imports/SmartImport";
import CSVImporter from "../components/imports/CSVImporter";
import DateRangeExport from "../components/exports/DateRangeExport";
import OpenBankingConnect from "../components/integrations/OpenBankingConnect";

export default function SettingsPage() {
  const [customAlerts, setCustomAlerts] = React.useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
    initialData: [],
  });

  React.useEffect(() => {
    loadCustomAlerts();
  }, []);

  const loadCustomAlerts = async () => {
    try {
      const prefs = await base44.entities.UserPreferences.list();
      if (prefs.length > 0 && prefs[0].custom_alerts) {
        setCustomAlerts(prefs[0].custom_alerts);
      }
    } catch (error) {
      // Ignore
    }
  };

  const addCustomAlert = () => {
    setCustomAlerts([...customAlerts, {
      type: 'expense',
      category: 'מזון_ומשקאות',
      threshold: 1000,
      enabled: true,
      frequency: 'immediate'
    }]);
  };

  const removeCustomAlert = (index) => {
    setCustomAlerts(customAlerts.filter((_, i) => i !== index));
  };

  const updateCustomAlert = (index, field, value) => {
    const updated = [...customAlerts];
    updated[index] = { ...updated[index], [field]: value };
    setCustomAlerts(updated);
  };

  const saveCustomAlerts = async () => {
    try {
      const prefs = await base44.entities.UserPreferences.list();
      
      if (prefs.length > 0) {
        await base44.entities.UserPreferences.update(prefs[0].id, {
          custom_alerts: customAlerts
        });
      } else {
        await base44.entities.UserPreferences.create({
          custom_alerts: customAlerts
        });
      }

      toast.success('התראות מותאמות נשמרו!');
    } catch (error) {
      toast.error('שגיאה בשמירת התראות');
    }
  };

  const handleExportData = () => {
    const data = {
      transactions,
      budgets,
      savingsGoals,
      debts,
      investments,
      assets,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sheetim-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('הנתונים יוצאו בהצלחה!');
  };

  const handleImportData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.transactions) {
          await Promise.all(data.transactions.map(t => 
            base44.entities.Transaction.create(t)
          ));
        }
        
        toast.success('הנתונים יובאו בהצלחה!');
        queryClient.invalidateQueries();
      } catch (error) {
        toast.error('שגיאה בייבוא הנתונים');
      } finally {
        setImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="page-container" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">הגדרות</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">התאם אישית את חווית השימוש שלך ב-Sheetim</p>
      </div>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Palette className="w-5 h-5" />
            תצוגה ונושא
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">מצב כהה</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">הפעל מצב כהה לנוחות העין</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>

          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              💡 השינויים נשמרים אוטומטית ויחולו בכל הדפים
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <DateRangeExport
        transactions={transactions}
        budgets={budgets}
        savingsGoals={savingsGoals}
        debts={debts}
        investments={investments}
        assets={assets}
      />

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Database className="w-5 h-5" />
            ניהול נתונים ופרטיות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              <strong className="font-semibold">זכויותיך:</strong> על פי חוק הגנת הפרטיות וחוק שירות מידע פיננסי, יש לך זכות מלאה לצפות, לייצא ולמחוק את כל המידע שלך בכל עת.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="importData"
                disabled={importing}
              />
              <Button
                onClick={() => document.getElementById('importData').click()}
                variant="outline"
                className="md-ripple w-full"
                disabled={importing}
              >
                <Upload className="w-4 h-4 ml-2" />
                {importing ? 'מייבא JSON...' : 'ייבא JSON'}
              </Button>
            </div>
            
            <Button
              onClick={handleExportData}
              className="md-ripple bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 ml-2" />
              ייצא גיבוי מהיר
            </Button>
          </div>

          <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              ⚠️ הגיבוי המהיר כולל את כל הנתונים שלך ללא סינון תאריכים
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">מחיקת מידע (זכות החרטה)</h4>
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-3">
              <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                <strong className="text-red-900 dark:text-red-200">אזהרה:</strong> מחיקת המידע היא פעולה בלתי הפיכה. וודא שיצאת גיבוי לפני המחיקה.
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              className="md-ripple"
              onClick={async () => {
                const confirmed = window.confirm(
                  'האם אתה בטוח שברצונך למחוק את כל המידע הפיננסי שנאסף?\n\n' +
                  'פעולה זו תמחק:\n' +
                  '• כל העסקאות\n' +
                  '• כל התקציבים\n' +
                  '• יעדי החיסכון\n' +
                  '• נתוני החובות\n' +
                  '• תיק ההשקעות\n' +
                  '• נכסים\n\n' +
                  'לא ניתן לבטל פעולה זו!\n\n' +
                  'לאישור הקלד: DELETE'
                );
                
                if (confirmed) {
                  const verification = window.prompt('אנא הקלד DELETE לאישור המחיקה:');
                  if (verification === 'DELETE') {
                    try {
                      // Delete all financial data
                      await Promise.all([
                        ...transactions.map(t => base44.entities.Transaction.delete(t.id)),
                        ...budgets.map(b => base44.entities.Budget.delete(b.id)),
                        ...savingsGoals.map(s => base44.entities.SavingsGoal.delete(s.id)),
                        ...debts.map(d => base44.entities.Debt.delete(d.id)),
                        ...investments.map(i => base44.entities.Investment.delete(i.id)),
                        ...assets.map(a => base44.entities.Asset.delete(a.id))
                      ]);
                      queryClient.invalidateQueries();
                      toast.success('כל המידע נמחק בהצלחה');
                    } catch (error) {
                      toast.error('שגיאה במחיקת המידע');
                    }
                  } else {
                    toast.error('המחיקה בוטלה - אימות שגוי');
                  }
                }
              }}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק את כל המידע הפיננסי
            </Button>
          </div>
        </CardContent>
      </Card>

      <CSVImporter onComplete={() => {
        queryClient.invalidateQueries();
      }} />

      <SmartImport onComplete={() => {
        queryClient.invalidateQueries();
        toast.success('העסקאות יובאו בהצלחה!');
      }} />

      <OpenBankingConnect onConnect={(provider) => {
        console.log('Connected to:', provider);
        queryClient.invalidateQueries();
      }} />

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Bell className="w-5 h-5" />
            התראות חכמות מותאמות אישית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              💡 המערכת תזהה אוטומטית חריגות משמעותיות בהוצאות ותשלח התראות חכמות מבוססות AI
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {customAlerts.map((alert, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-900 dark:text-gray-200">התראה #{idx + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomAlert(idx)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-300">קטגוריה</Label>
                    <Select
                      value={alert.category}
                      onValueChange={(value) => updateCustomAlert(idx, 'category', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="מזון_ומשקאות">מזון ומשקאות</SelectItem>
                        <SelectItem value="קניות">קניות</SelectItem>
                        <SelectItem value="תחבורה">תחבורה</SelectItem>
                        <SelectItem value="בילויים">בילויים</SelectItem>
                        <SelectItem value="שירותים">שירותים</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-700 dark:text-gray-300">סוג התראה</Label>
                    <Select
                      value={alert.type}
                      onValueChange={(value) => updateCustomAlert(idx, 'type', value)}
                    >
                      <SelectTrigger className="dark:bg-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">הוצאה חריגה</SelectItem>
                        <SelectItem value="portfolio">שינוי בתיק השקעות</SelectItem>
                        <SelectItem value="savings">יעד חיסכון</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-700 dark:text-gray-300">
                    {alert.type === 'portfolio' ? 'שינוי באחוזים' : 'סף סכום (₪)'}
                  </Label>
                  <Input
                    type="number"
                    value={alert.threshold}
                    onChange={(e) => updateCustomAlert(idx, 'threshold', parseFloat(e.target.value))}
                    placeholder={alert.type === 'portfolio' ? '5 = 5%' : '1000'}
                    className="dark:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-700 dark:text-gray-300">פעיל</Label>
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(checked) => updateCustomAlert(idx, 'enabled', checked)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addCustomAlert} variant="outline" className="md-ripple flex-1">
              <Plus className="w-4 h-4 ml-2" />
              הוסף התראה
            </Button>
            <Button onClick={saveCustomAlerts} className="md-ripple">
              שמור
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <CreditCard className="w-5 h-5" />
            חיבור לכרטיס אשראי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              ⚠️ תכונה זו דורשת הפעלת Backend Functions באפליקציה
            </AlertDescription>
          </Alert>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              איך זה עובד?
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                <span>הירשם לשירות Akaunting או Salt Edge</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                <span>קבל API key מהשירות</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                <span>הפעל Backend Functions והגדר את ה-API key</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                <span>חבר את חשבון הבנק/כרטיס האשראי</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">5.</span>
                <span>העסקאות יתעדכנו אוטומטית</span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}