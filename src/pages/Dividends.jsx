import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, TrendingUp, Calendar, Check, Loader2, Info, RefreshCw, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfYear, endOfYear } from "date-fns";
import { he } from "date-fns/locale";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import DividendForecast from "../components/dividends/DividendForecast";
import PageHeader from "../components/common/PageHeader";
import ProBadge from "../components/common/ProBadge";

const TAX_RATE = 0.25; // 25% מס על דיבידנדים

export default function DividendsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({
    investment_id: "",
    gross_amount: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    receipt_type: "cash" // "cash" or "reinvested"
  });
  const [showForecast, setShowForecast] = useState(true);
  const [isFetchingDividend, setIsFetchingDividend] = useState(false);
  const [pendingDividends, setPendingDividends] = useState([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  // Fetch pending dividends when investment changes
  useEffect(() => {
    const fetchDividendInfo = async () => {
      if (!formData.investment_id) return;
      
      const investment = investments.find(inv => inv.id === formData.investment_id);
      if (!investment?.symbol || (investment.type !== 'מניות')) return;
      
      setIsFetchingDividend(true);
      try {
        // Simulate fetching dividend data - in real app would call API
        const mockDividendData = {
          per_share: (Math.random() * 2 + 0.5).toFixed(2),
          ex_date: format(new Date(), 'yyyy-MM-dd'),
          currency: investment.currency || 'USD'
        };
        
        const grossAmount = investment.quantity * parseFloat(mockDividendData.per_share);
        setFormData(prev => ({
          ...prev,
          gross_amount: grossAmount.toFixed(2)
        }));
      } catch (error) {
        console.error("Failed to fetch dividend info", error);
      } finally {
        setIsFetchingDividend(false);
      }
    };
    
    if (formData.investment_id) {
      fetchDividendInfo();
    }
  }, [formData.investment_id, investments]);

  // חישוב דיבידנדים מתוך ההשקעות - כולל היסטוריה מפורטת
  const allDividends = investments.flatMap(inv => {
    const history = inv.dividend_history || [];
    if (history.length > 0) {
      return history.map((div, idx) => ({
        id: `${inv.id}-dividend-${idx}`,
        investment_id: inv.id,
        investment_name: inv.name,
        symbol: inv.symbol,
        currency: inv.currency || 'ILS',
        gross_amount: div.gross_amount,
        tax_amount: div.tax_amount,
        net_amount: div.net_amount,
        date: div.date,
        receipt_type: div.receipt_type || 'cash',
        shares_added: div.shares_added || 0,
        confirmed: true
      }));
    }
    // Fallback for old data without history
    const dividendAmount = inv.dividends || 0;
    if (dividendAmount > 0) {
      const grossAmount = dividendAmount / (1 - TAX_RATE);
      return [{
        id: `${inv.id}-dividend`,
        investment_id: inv.id,
        investment_name: inv.name,
        symbol: inv.symbol,
        currency: inv.currency || 'ILS',
        gross_amount: grossAmount,
        tax_amount: grossAmount * TAX_RATE,
        net_amount: dividendAmount,
        date: inv.purchase_date || format(new Date(), 'yyyy-MM-dd'),
        receipt_type: 'cash',
        confirmed: true
      }];
    }
    return [];
  });

  // פילטר לפי שנה
  const filteredDividends = selectedYear === 'all' 
    ? allDividends 
    : allDividends.filter(div => div.date && div.date.startsWith(selectedYear));

  // סיכומים
  const currentYear = new Date().getFullYear().toString();
  const thisYearDividends = allDividends.filter(div => div.date && div.date.startsWith(currentYear));
  const totalNetThisYear = thisYearDividends.reduce((sum, div) => sum + (div.net_amount || 0), 0);
  const totalGrossThisYear = thisYearDividends.reduce((sum, div) => sum + (div.gross_amount || 0), 0);
  const totalTaxThisYear = thisYearDividends.reduce((sum, div) => sum + (div.tax_amount || 0), 0);
  const totalNetAllTime = allDividends.reduce((sum, div) => sum + (div.net_amount || 0), 0);
  const dividendCount = allDividends.length;

  // נתונים לגרף - דיבידנדים לפי חודש
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const yearToUse = selectedYear === 'all' ? currentYear : selectedYear;
    const monthKey = `${yearToUse}-${month.toString().padStart(2, '0')}`;
    
    // When "all" is selected, sum from all years for this month
    let monthDividends;
    if (selectedYear === 'all') {
      monthDividends = allDividends.filter(div => {
        if (!div.date) return false;
        const divMonth = parseInt(div.date.substring(5, 7));
        return divMonth === month;
      });
    } else {
      monthDividends = allDividends.filter(div => div.date && div.date.startsWith(monthKey));
    }
    
    const totalNet = monthDividends.reduce((sum, div) => sum + (div.net_amount || 0), 0);
    
    return {
      month: format(new Date(2024, i, 1), 'MMM', { locale: he }),
      'נטו': totalNet
    };
  });

  // רשימת שנים זמינות
  const availableYears = ['all', ...Array.from(new Set(allDividends.map(div => div.date?.substring(0, 4)).filter(Boolean)))];

  const addDividendMutation = useMutation({
    mutationFn: async (data) => {
      const investment = investments.find(inv => inv.id === data.investment_id);
      if (!investment) throw new Error("השקעה לא נמצאה");
      
      const grossAmount = parseFloat(data.gross_amount);
      const taxAmount = grossAmount * TAX_RATE;
      const netAmount = grossAmount - taxAmount;
      const isReinvested = data.receipt_type === 'reinvested';
      
      // Calculate shares added if reinvested
      const sharesAdded = isReinvested && investment.current_price > 0 
        ? netAmount / investment.current_price 
        : 0;
      
      // Add to dividend history
      const newDividendEntry = {
        date: data.date,
        gross_amount: grossAmount,
        tax_amount: taxAmount,
        net_amount: netAmount,
        receipt_type: data.receipt_type,
        shares_added: sharesAdded
      };
      
      const newHistory = [...(investment.dividend_history || []), newDividendEntry];
      const newDividendTotal = (investment.dividends || 0) + netAmount;
      const newQuantity = isReinvested ? investment.quantity + sharesAdded : investment.quantity;
      
      return base44.entities.Investment.update(investment.id, {
        dividends: newDividendTotal,
        dividend_history: newHistory,
        quantity: newQuantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setShowForm(false);
      setFormData({
        investment_id: "",
        gross_amount: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        receipt_type: "cash"
      });
      toast({
        title: "✅ דיבידנד אושר",
        description: formData.receipt_type === 'reinvested' 
          ? "הדיבידנד הושקע מחדש והתווסף לכמות המניות" 
          : "הדיבידנד נרשם בהצלחה",
      });
    },
  });

  const handleConfirmDividend = () => {
    if (!formData.investment_id || !formData.gross_amount) {
      toast({
        title: "⚠️ שדות חסרים",
        description: "יש לבחור השקעה",
        variant: "destructive",
      });
      return;
    }
    addDividendMutation.mutate(formData);
  };

  const grossAmount = parseFloat(formData.gross_amount) || 0;
  const taxAmount = grossAmount * TAX_RATE;
  const netAmount = grossAmount - taxAmount;
  const selectedInvestment = investments.find(inv => inv.id === formData.investment_id);
  const currencySymbol = selectedInvestment?.currency === 'USD' ? '$' : selectedInvestment?.currency === 'EUR' ? '€' : '₪';

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir="rtl">
      {/* Header */}
      <PageHeader 
        title="דיבידנדים" 
        icon={DollarSign}
        pageName="Dividends"
        badge="Pro"
        badgeVariant="default"
      >
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="h-10 bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 ml-2" />
          רשום דיבידנד
        </Button>
      </PageHeader>

      {/* Explanation Card */}
      {allDividends.length === 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">מה זה דיבידנד?</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  דיבידנד הוא חלק מהרווחים שחברה מחלקת לבעלי המניות שלה. זה כסף שאתה מקבל רק כי אתה מחזיק במניה - הכנסה פסיבית אמיתית! 💰
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
          <CardContent className="p-3">
            <p className="text-[10px] text-gray-500">קיבלתי השנה (נטו)</p>
            <p className="text-sm sm:text-lg font-bold text-green-600">₪{totalNetThisYear.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400">אחרי מס</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="p-3">
            <p className="text-[10px] text-gray-500">חולק השנה (ברוטו)</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">₪{totalGrossThisYear.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400">לפני מס</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
          <CardContent className="p-3">
            <p className="text-[10px] text-gray-500">שולם למס הכנסה</p>
            <p className="text-sm sm:text-lg font-bold text-red-600">₪{totalTaxThisYear.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400">25% מהברוטו</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
          <CardContent className="p-3">
            <p className="text-[10px] text-gray-500">סה״כ מכל הזמנים</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">₪{totalNetAllTime.toLocaleString()}</p>
            <p className="text-[9px] text-gray-400">{dividendCount} תשלומים</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              אישור דיבידנד
              {isFetchingDividend && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <Label className="text-sm">בחר השקעה</Label>
              <Select value={formData.investment_id} onValueChange={(value) => setFormData({...formData, investment_id: value, gross_amount: ''})}>
                <SelectTrigger className="h-10"><SelectValue placeholder="בחר נייר ערך" /></SelectTrigger>
                <SelectContent>
                  {investments.filter(inv => inv.type === 'מניות').map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.name} ({inv.symbol || 'N/A'}) - {inv.quantity} יח׳
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.investment_id && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">תאריך חלוקה</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-10" />
                  </div>
                  <div>
                    <Label className="text-sm">סכום ברוטו ({currencySymbol})</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.gross_amount} 
                      onChange={(e) => setFormData({...formData, gross_amount: e.target.value})} 
                      placeholder="סכום לפני מס" 
                      className="h-10" 
                    />
                  </div>
                </div>

                {grossAmount > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Info className="w-4 h-4" />
                      <span>חישוב מס (25%)</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-1">ברוטו</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{currencySymbol}{grossAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                        <p className="text-[10px] text-red-600 mb-1">מס (25%)</p>
                        <p className="text-sm font-bold text-red-600">-{currencySymbol}{taxAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                        <p className="text-[10px] text-green-600 mb-1">נטו</p>
                        <p className="text-sm font-bold text-green-600">{currencySymbol}{netAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Receipt Type Selection */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <Label className="text-xs text-gray-600 mb-2 block">אופן קבלת הדיבידנד</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, receipt_type: 'cash'})}
                          className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                            formData.receipt_type === 'cash' 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/30' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <Banknote className={`w-4 h-4 ${formData.receipt_type === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${formData.receipt_type === 'cash' ? 'text-green-600' : 'text-gray-500'}`}>מזומן</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, receipt_type: 'reinvested'})}
                          className={`p-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                            formData.receipt_type === 'reinvested' 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <RefreshCw className={`w-4 h-4 ${formData.receipt_type === 'reinvested' ? 'text-indigo-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${formData.receipt_type === 'reinvested' ? 'text-indigo-600' : 'text-gray-500'}`}>השקעה מחדש</span>
                        </button>
                      </div>
                      {formData.receipt_type === 'reinvested' && selectedInvestment?.current_price > 0 && (
                        <p className="text-[10px] text-indigo-600 mt-2 text-center">
                          יתווספו {(netAmount / selectedInvestment.current_price).toFixed(4)} יחידות לתיק
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>ביטול</Button>
                  <Button 
                    onClick={handleConfirmDividend} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    disabled={!grossAmount || addDividendMutation.isPending}
                  >
                    <Check className="w-4 h-4 ml-1" />
                    אישור קבלת דיבידנד
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dividend Forecast */}
      {investments.some(inv => inv.type === 'מניות' && inv.annual_dividend_per_share > 0) && (
        <DividendForecast investments={investments} />
      )}

      {allDividends.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-5">
            <EmptyState 
              icon={DollarSign} 
              title="אין דיבידנדים רשומים" 
              description="כשתקבל דיבידנדים מהשקעות, תוכל לתעד אותם כאן." 
              actionLabel="רשום דיבידנד" 
              onAction={() => setShowForm(true)} 
              illustration="financial" 
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Year Filter */}
          <div className="flex items-center gap-3">
            <Label className="text-sm">שנה:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {availableYears.filter(y => y !== 'all').map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                דיבידנדים שקיבלתי לפי חודש {selectedYear !== 'all' ? `(${selectedYear})` : `(${currentYear})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {monthlyData.some(d => d['נטו'] > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₪${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }} formatter={(value) => [`₪${value.toLocaleString()}`, 'קיבלתי']} />
                    <Bar dataKey="נטו" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                  <Calendar className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-sm">אין דיבידנדים בשנה זו</p>
                  <p className="text-xs text-gray-400">בחר שנה אחרת או הוסף דיבידנד</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dividend List - Mobile friendly */}
          <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">היסטוריית דיבידנדים</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {filteredDividends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">אין דיבידנדים בתקופה זו</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDividends.map((div, idx) => {
                    const symbol = div.currency === 'USD' ? '$' : div.currency === 'EUR' ? '€' : '₪';
                    return (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{div.investment_name}</span>
                            {div.symbol && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">{div.symbol}</span>}
                          </div>
                          <span className="text-xs text-gray-500">{format(new Date(div.date), 'dd/MM/yy')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500">ברוטו: {symbol}{div.gross_amount?.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span className="text-red-500">מס: -{symbol}{div.tax_amount?.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">+{symbol}{div.net_amount?.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        {div.receipt_type === 'reinvested' && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                              ↻ הושקע מחדש - נוספו {div.shares_added?.toFixed(4)} יחידות
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}