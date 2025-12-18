import { format } from "date-fns";

/**
 * Export data to CSV file
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportTransactionsToCSV(transactions) {
  const formattedData = transactions.map(t => ({
    'תאריך': t.date ? format(new Date(t.date), 'dd/MM/yyyy') : '',
    'תיאור': t.description || '',
    'קטגוריה': t.category?.replace(/_/g, ' ') || '',
    'סוג': t.type === 'income' ? 'הכנסה' : 'הוצאה',
    'סכום': t.amount || 0,
    'חוזר': t.is_recurring ? 'כן' : 'לא',
  }));

  const filename = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  exportToCSV(formattedData, filename);
}

export function exportBudgetsToCSV(budgets, transactions) {
  const formattedData = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category && t.date?.startsWith(budget.month))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      'חודש': budget.month,
      'קטגוריה': budget.category?.replace(/_/g, ' ') || '',
      'תקציב': budget.monthly_limit || 0,
      'נוצל': spent,
      'נותר': (budget.monthly_limit || 0) - spent,
      'אחוז ניצול': budget.monthly_limit ? `${((spent / budget.monthly_limit) * 100).toFixed(1)}%` : '0%',
    };
  });

  const filename = `budgets_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  exportToCSV(formattedData, filename);
}

export function exportSavingsGoalsToCSV(goals) {
  const formattedData = goals.map(goal => ({
    'שם היעד': goal.name,
    'סכום יעד': goal.target_amount || 0,
    'סכום נוכחי': goal.current_amount || 0,
    'נותר': (goal.target_amount || 0) - (goal.current_amount || 0),
    'התקדמות': goal.target_amount ? `${((goal.current_amount / goal.target_amount) * 100).toFixed(1)}%` : '0%',
    'תאריך יעד': goal.target_date ? format(new Date(goal.target_date), 'dd/MM/yyyy') : '',
  }));

  const filename = `savings_goals_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  exportToCSV(formattedData, filename);
}

export function exportDebtsToCSV(debts) {
  const formattedData = debts.map(debt => ({
    'שם החוב': debt.name,
    'סוג': debt.type?.replace(/_/g, ' ') || '',
    'סכום מקורי': debt.original_amount || 0,
    'יתרה נוכחית': debt.current_balance || 0,
    'ריבית': `${debt.interest_rate || 0}%`,
    'תשלום חודשי': debt.monthly_payment || 0,
    'מלווה': debt.lender || '',
    'תאריך התחלה': debt.start_date ? format(new Date(debt.start_date), 'dd/MM/yyyy') : '',
    'תאריך סיום': debt.end_date ? format(new Date(debt.end_date), 'dd/MM/yyyy') : '',
  }));

  const filename = `debts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  exportToCSV(formattedData, filename);
}

export function exportInvestmentsToCSV(investments) {
  const formattedData = investments.map(inv => {
    const totalValue = (inv.quantity || 0) * (inv.current_price || 0);
    const totalCost = (inv.quantity || 0) * (inv.purchase_price || 0);
    const profit = totalValue - totalCost;
    const profitPercent = totalCost ? ((profit / totalCost) * 100).toFixed(2) : 0;

    return {
      'שם': inv.name,
      'סוג': inv.type?.replace(/_/g, ' ') || '',
      'סימול': inv.symbol || '',
      'כמות': inv.quantity || 0,
      'מחיר רכישה': inv.purchase_price || 0,
      'מחיר נוכחי': inv.current_price || 0,
      'שווי כולל': totalValue,
      'רווח/הפסד': profit,
      'אחוז רווח': `${profitPercent}%`,
      'דיבידנדים': inv.dividends || 0,
      'תאריך רכישה': inv.purchase_date ? format(new Date(inv.purchase_date), 'dd/MM/yyyy') : '',
    };
  });

  const filename = `investments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  exportToCSV(formattedData, filename);
}