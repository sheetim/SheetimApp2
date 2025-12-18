import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2 } from "lucide-react";

const investmentTypes = ["מניות", "אג״ח", "קרנות_נאמנות", "קריפטו", "נדל״ן", "פיקדונות", "אחר"];

export default function InvestmentForm({ investment, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(investment || {
    name: '',
    type: '',
    symbol: '',
    quantity: '',
    purchase_price: '',
    current_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    currency: 'ILS'
  });
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceFetched, setPriceFetched] = useState(false);

  // Auto-fetch current price when symbol changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!formData.symbol || formData.symbol.length < 2) return;
      if (formData.type !== 'מניות' && formData.type !== 'קריפטו') return;
      
      setIsFetchingPrice(true);
      setPriceFetched(false);
      
      try {
        const type = formData.type === 'קריפטו' ? 'crypto' : 'stock';
        const symbol = formData.type === 'קריפטו' ? formData.symbol.toLowerCase() : formData.symbol.toUpperCase();
        
        const { data } = await base44.functions.invoke('getStockPrices', { 
          symbols: [symbol], 
          type 
        });
        
        if (data?.prices?.[symbol]) {
          const priceInfo = data.prices[symbol];
          // Use the price based on the selected currency
          let price;
          if (formData.currency === 'USD') {
            price = priceInfo.price_usd;
          } else if (formData.currency === 'ILS') {
            price = priceInfo.price_ils;
          } else {
            // For EUR or other currencies, convert from USD
            price = priceInfo.price_usd * 0.92; // approximate EUR rate
          }
          
          if (price) {
            setFormData(prev => ({ 
              ...prev, 
              current_price: price.toFixed(2)
            }));
            setPriceFetched(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch price", error);
      } finally {
        setIsFetchingPrice(false);
      }
    };

    const timeoutId = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.symbol, formData.type, formData.currency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentPrice = formData.current_price || formData.purchase_price;
    onSubmit({
      ...formData,
      quantity: parseFloat(formData.quantity),
      purchase_price: parseFloat(formData.purchase_price),
      current_price: parseFloat(currentPrice),
      currency: formData.currency || 'ILS',
      dividends: investment?.dividends || 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם ההשקעה</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="לדוגמה: Apple Inc., קרן מדד"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">סוג ההשקעה</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג" />
            </SelectTrigger>
            <SelectContent>
              {investmentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symbol">סימול/קוד</Label>
          <Input
            id="symbol"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            placeholder="לדוגמה: AAPL, BTC"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">כמות יחידות</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">מטבע</Label>
          <Select
            value={formData.currency || 'ILS'}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ILS">₪ שקל</SelectItem>
              <SelectItem value="USD">$ דולר</SelectItem>
              <SelectItem value="EUR">€ יורו</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">מחיר רכישה ליחידה ({formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₪'})</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_price" className="flex items-center gap-2">
            מחיר נוכחי ליחידה ({formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₪'})
            {isFetchingPrice && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
            {priceFetched && <CheckCircle2 className="w-3 h-3 text-green-600" />}
          </Label>
          <Input
            id="current_price"
            type="number"
            step="0.01"
            value={formData.current_price}
            onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
            placeholder={formData.type === 'מניות' || formData.type === 'קריפטו' ? 'יתמלא אוטומטית' : ''}
            className={priceFetched ? 'border-green-300 bg-green-50' : ''}
          />
          {(formData.type === 'מניות' || formData.type === 'קריפטו') && formData.symbol && (
            <p className="text-[10px] text-gray-500">המחיר יתעדכן אוטומטית לפי הסימול</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">תאריך רכישה</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            required
          />
        </div>

      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="md-ripple">
          ביטול
        </Button>
        <Button type="submit" className="md-ripple bg-indigo-600 hover:bg-indigo-700">
          {investment ? 'עדכן' : 'הוסף'} השקעה
        </Button>
      </div>
    </form>
  );
}