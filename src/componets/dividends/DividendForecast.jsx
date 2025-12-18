import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format, addMonths } from "date-fns";
import { he } from "date-fns/locale";

const TAX_RATE = 0.25;

const frequencyMonths = {
  monthly: 1,
  quarterly: 3,
  semi_annual: 6,
  annual: 12
};

const frequencyLabels = {
  monthly: "חודשי",
  quarterly: "רבעוני",
  semi_annual: "חצי שנתי",
  annual: "שנתי"
};

export default function DividendForecast({ investments }) {
  // Calculate upcoming dividends for next 12 months
  const today = new Date();
  const upcomingDividends = [];
  
  investments
    .filter(inv => inv.type === 'מניות' && inv.annual_dividend_per_share > 0)
    .forEach(inv => {
      const freq = inv.dividend_frequency || 'quarterly';
      const monthsBetween = frequencyMonths[freq];
      const annualDPS = inv.annual_dividend_per_share || 0;
      const dividendPerPayment = annualDPS / (12 / monthsBetween);
      const grossPerPayment = dividendPerPayment * inv.quantity;
      const netPerPayment = grossPerPayment * (1 - TAX_RATE);
      const currencySymbol = inv.currency === 'USD' ? '$' : inv.currency === 'EUR' ? '€' : '₪';
      
      // Find last dividend date or use purchase date
      const lastDivDate = inv.dividend_history?.length > 0 
        ? new Date(inv.dividend_history[inv.dividend_history.length - 1].date)
        : new Date(inv.purchase_date);
      
      // Generate next payments
      let nextDate = addMonths(lastDivDate, monthsBetween);
      while (nextDate <= addMonths(today, 12)) {
        if (nextDate >= today) {
          upcomingDividends.push({
            date: nextDate,
            investment_name: inv.name,
            symbol: inv.symbol,
            gross_amount: grossPerPayment,
            net_amount: netPerPayment,
            currency: inv.currency || 'ILS',
            currencySymbol,
            frequency: freq
          });
        }
        nextDate = addMonths(nextDate, monthsBetween);
      }
    });
  
  // Sort by date
  upcomingDividends.sort((a, b) => a.date - b.date);
  
  // Group by month for summary
  const monthlyForecast = {};
  upcomingDividends.forEach(div => {
    const monthKey = format(div.date, 'yyyy-MM');
    if (!monthlyForecast[monthKey]) {
      monthlyForecast[monthKey] = { gross: 0, net: 0, count: 0 };
    }
    monthlyForecast[monthKey].gross += div.gross_amount;
    monthlyForecast[monthKey].net += div.net_amount;
    monthlyForecast[monthKey].count += 1;
  });
  
  const totalForecastNet = upcomingDividends.reduce((sum, d) => sum + d.net_amount, 0);
  const totalForecastGross = upcomingDividends.reduce((sum, d) => sum + d.gross_amount, 0);
  const avgMonthlyNet = totalForecastNet / 12;

  if (upcomingDividends.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-800">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          תחזית דיבידנדים - 12 חודשים הבאים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500">צפי שנתי נטו</p>
            <p className="text-sm font-bold text-indigo-600">₪{totalForecastNet.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500">ממוצע חודשי</p>
            <p className="text-sm font-bold text-green-600">₪{avgMonthlyNet.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500">תשלומים צפויים</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{upcomingDividends.length}</p>
          </div>
        </div>

        {/* Upcoming dividends list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {upcomingDividends.slice(0, 6).map((div, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{div.investment_name}</p>
                  <p className="text-[10px] text-gray-500">
                    {format(div.date, 'dd MMM yyyy', { locale: he })} • {frequencyLabels[div.frequency]}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-green-600">{div.currencySymbol}{div.net_amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className="text-[10px] text-gray-400">נטו</p>
              </div>
            </div>
          ))}
          {upcomingDividends.length > 6 && (
            <p className="text-center text-[10px] text-gray-500 py-1">
              +{upcomingDividends.length - 6} תשלומים נוספים
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}