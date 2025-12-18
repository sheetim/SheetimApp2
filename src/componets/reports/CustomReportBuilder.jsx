import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function CustomReportBuilder({ transactions, budgets, savingsGoals, debts, investments }) {
  const [reportName, setReportName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('csv');
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [includeSavings, setIncludeSavings] = useState(true);
  const [includeDebts, setIncludeDebts] = useState(true);
  const [includeInvestments, setIncludeInvestments] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);

    try {
      let reportData = [];
      const reportTitle = reportName || `דוח_פיננסי_${format(new Date(), 'yyyy-MM-dd')}`;

      // Filter by date range
      const filterByDate = (items) => {
        if (!dateFrom && !dateTo) return items;
        return items.filter(item => {
          const itemDate = new Date(item.date || item.target_date || item.start_date || item.purchase_date);
          const from = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
          const to = dateTo ? new Date(dateTo) : new Date('2100-01-01');
          return itemDate >= from && itemDate <= to;
        });
      };

      // Build report sections
      if (includeTransactions) {
        reportData.push(['=== עסקאות ===']);
        reportData.push(['תאריך', 'סוג', 'קטגוריה', 'תיאור', 'סכום']);
        const filtered = filterByDate(transactions);
        filtered.forEach(t => {
          reportData.push([
            t.date,
            t.type === 'income' ? 'הכנסה' : 'הוצאה',
            t.category?.replace(/_/g, ' '),
            t.description || '',
            t.amount
          ]);
        });
        reportData.push([]);
      }

      if (includeBudgets) {
        reportData.push(['=== תקציבים ===']);
        reportData.push(['חודש', 'קטגוריה', 'תקציב', 'סף התראה']);
        budgets.forEach(b => {
          reportData.push([
            b.month,
            b.category?.replace(/_/g, ' '),
            b.monthly_limit,
            `${b.alert_threshold}%`
          ]);
        });
        reportData.push([]);
      }

      if (includeSavings) {
        reportData.push(['=== יעדי חיסכון ===']);
        reportData.push(['שם היעד', 'סכום נוכחי', 'סכום יעד', 'תאריך יעד', 'אחוז השגה']);
        savingsGoals.forEach(g => {
          const progress = (g.current_amount / g.target_amount * 100).toFixed(1);
          reportData.push([
            g.name,
            g.current_amount,
            g.target_amount,
            g.target_date,
            `${progress}%`
          ]);
        });
        reportData.push([]);
      }

      if (includeDebts) {
        reportData.push(['=== חובות ===']);
        reportData.push(['שם', 'סוג', 'יתרה נוכחית', 'סכום מקורי', 'ריבית', 'תשלום חודשי']);
        debts.forEach(d => {
          reportData.push([
            d.name,
            d.type?.replace(/_/g, ' '),
            d.current_balance,
            d.original_amount,
            `${d.interest_rate}%`,
            d.monthly_payment
          ]);
        });
        reportData.push([]);
      }

      if (includeInvestments) {
        reportData.push(['=== השקעות ===']);
        reportData.push(['שם', 'סוג', 'כמות', 'מחיר רכישה', 'מחיר נוכחי', 'שווי נוכחי', 'רווח/הפסד']);
        investments.forEach(inv => {
          const currentValue = inv.quantity * inv.current_price;
          const purchaseValue = inv.quantity * inv.purchase_price;
          const gainLoss = currentValue - purchaseValue;
          const gainLossPercent = ((gainLoss / purchaseValue) * 100).toFixed(2);
          
          reportData.push([
            inv.name,
            inv.type?.replace(/_/g, ' '),
            inv.quantity,
            inv.purchase_price,
            inv.current_price,
            currentValue,
            `${gainLoss} (${gainLossPercent}%)`
          ]);
        });
        reportData.push([]);
      }

      // Generate file
      if (format === 'csv') {
        const csvContent = reportData.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${reportTitle}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'json') {
        const jsonData = {
          reportName: reportTitle,
          generatedAt: new Date().toISOString(),
          dateRange: { from: dateFrom, to: dateTo },
          data: {
            transactions: includeTransactions ? filterByDate(transactions) : [],
            budgets: includeBudgets ? budgets : [],
            savingsGoals: includeSavings ? savingsGoals : [],
            debts: includeDebts ? debts : [],
            investments: includeInvestments ? investments : []
          }
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${reportTitle}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('אירעה שגיאה ביצירת הדוח');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          בונה דוחות מותאם אישית
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            שם הדוח
          </label>
          <Input
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="דוח חודשי - ינואר 2025"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              מתאריך
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              עד תאריך
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            פורמט הדוח
          </label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Excel)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
            נתונים לכלול בדוח
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="transactions"
                checked={includeTransactions}
                onCheckedChange={setIncludeTransactions}
              />
              <label htmlFor="transactions" className="text-sm text-gray-900 dark:text-white">
                עסקאות ({transactions.length})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="budgets"
                checked={includeBudgets}
                onCheckedChange={setIncludeBudgets}
              />
              <label htmlFor="budgets" className="text-sm text-gray-900 dark:text-white">
                תקציבים ({budgets.length})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="savings"
                checked={includeSavings}
                onCheckedChange={setIncludeSavings}
              />
              <label htmlFor="savings" className="text-sm text-gray-900 dark:text-white">
                יעדי חיסכון ({savingsGoals.length})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="debts"
                checked={includeDebts}
                onCheckedChange={setIncludeDebts}
              />
              <label htmlFor="debts" className="text-sm text-gray-900 dark:text-white">
                חובות ({debts.length})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="investments"
                checked={includeInvestments}
                onCheckedChange={setIncludeInvestments}
              />
              <label htmlFor="investments" className="text-sm text-gray-900 dark:text-white">
                השקעות ({investments.length})
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 ml-2 border-2 border-white border-t-transparent rounded-full" />
              יוצר דוח...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 ml-2" />
              צור והורד דוח
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}