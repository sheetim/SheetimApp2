import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DateRangeExport({ 
  transactions, 
  budgets, 
  savingsGoals, 
  debts, 
  investments, 
  assets 
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedData, setSelectedData] = useState({
    transactions: true,
    budgets: false,
    savingsGoals: false,
    debts: false,
    investments: false,
    assets: false
  });

  const handleExport = () => {
    const data = {};
    
    // סינון עסקאות לפי טווח תאריכים
    if (selectedData.transactions && transactions) {
      const filtered = transactions.filter(t => {
        if (!t.date) return false;
        const date = new Date(t.date);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return date >= start && date <= end;
      });
      data.transactions = filtered;
    }

    // סינון תקציבים לפי טווח תאריכים
    if (selectedData.budgets && budgets) {
      const filtered = budgets.filter(b => {
        if (!b.month) return false;
        const date = new Date(b.month + '-01');
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return date >= start && date <= end;
      });
      data.budgets = filtered;
    }

    // יעדי חיסכון - ללא סינון תאריכים
    if (selectedData.savingsGoals && savingsGoals) {
      data.savingsGoals = savingsGoals;
    }

    // חובות - ללא סינון תאריכים
    if (selectedData.debts && debts) {
      data.debts = debts;
    }

    // השקעות - ללא סינון תאריכים
    if (selectedData.investments && investments) {
      data.investments = investments;
    }

    // נכסים - ללא סינון תאריכים
    if (selectedData.assets && assets) {
      data.assets = assets;
    }

    if (Object.keys(data).length === 0) {
      toast.error('לא נבחר מידע לייצוא');
      return;
    }

    // הוספת מטא-דאטה
    data.exportDate = new Date().toISOString();
    data.dateRange = {
      start: startDate || 'הכל',
      end: endDate || 'הכל'
    };

    // יצירת הקובץ
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = `sheetim-export-${startDate || 'all'}-to-${endDate || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('הנתונים יוצאו בהצלחה!');
  };

  const handleCSVExport = () => {
    if (!selectedData.transactions || !transactions) {
      toast.error('ייצוא CSV זמין רק לעסקאות');
      return;
    }

    // סינון עסקאות
    const filtered = transactions.filter(t => {
      if (!t.date) return false;
      const date = new Date(t.date);
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      return date >= start && date <= end;
    });

    if (filtered.length === 0) {
      toast.error('אין עסקאות בטווח התאריכים שנבחר');
      return;
    }

    // יצירת CSV
    const headers = ['תאריך', 'תיאור', 'קטגוריה', 'סוג', 'סכום'];
    const rows = filtered.map(t => [
      t.date || '',
      t.description || '',
      t.category?.replace(/_/g, ' ') || '',
      t.type === 'income' ? 'הכנסה' : 'הוצאה',
      t.amount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // הוספת BOM לתמיכה בעברית
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('הקובץ CSV יוצא בהצלחה!');
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Calendar className="w-5 h-5" />
          ייצוא לפי טווח תאריכים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">💡 מה יכלל בייצוא?</p>
            <ul className="text-xs space-y-0.5 mr-4 list-disc">
              <li>עסקאות - יסוננו לפי טווח התאריכים שתבחר</li>
              <li>תקציבים - יכללו תקציבים מהחודשים בטווח</li>
              <li>שאר הנתונים - יוצאו במלואם ללא סינון</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-gray-200">מתאריך</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 dark:bg-gray-700"
            />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-gray-200">עד תאריך</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2 dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white">בחר נתונים לייצוא</h4>
          
          {[
            { key: 'transactions', label: 'עסקאות', count: transactions?.length || 0, filterable: true },
            { key: 'budgets', label: 'תקציבים', count: budgets?.length || 0, filterable: true },
            { key: 'savingsGoals', label: 'יעדי חיסכון', count: savingsGoals?.length || 0, filterable: false },
            { key: 'debts', label: 'חובות', count: debts?.length || 0, filterable: false },
            { key: 'investments', label: 'השקעות', count: investments?.length || 0, filterable: false },
            { key: 'assets', label: 'נכסים', count: assets?.length || 0, filterable: false }
          ].map(({ key, label, count, filterable }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedData[key]}
                  onCheckedChange={(checked) => 
                    setSelectedData({...selectedData, [key]: checked})
                  }
                />
                <Label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  {label}
                </Label>
                {!filterable && (
                  <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                    הכל
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {count} רשומות
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            className="flex-1 md-ripple bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 ml-2" />
            ייצא JSON
          </Button>
          
          <Button
            onClick={handleCSVExport}
            variant="outline"
            className="flex-1 md-ripple"
            disabled={!selectedData.transactions}
          >
            <Download className="w-4 h-4 ml-2" />
            ייצא CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}