import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, DollarSign, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DividendTracker({ investments, onClose, onUpdateInvestment }) {
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [dividendAmount, setDividendAmount] = useState('');

  const handleAddDividend = () => {
    if (selectedInvestment && dividendAmount) {
      const newDividends = (selectedInvestment.dividends || 0) + parseFloat(dividendAmount);
      onUpdateInvestment(selectedInvestment.id, {
        ...selectedInvestment,
        dividends: newDividends
      });
      setDividendAmount('');
      setSelectedInvestment(null);
    }
  };

  const totalDividends = investments.reduce((sum, inv) => sum + (inv.dividends || 0), 0);
  const investmentsWithDividends = investments.filter(inv => (inv.dividends || 0) > 0);

  return (
    <Card className="md-card md-elevation-3 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          מעקב דיבידנדים
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="md-ripple">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-lg md-elevation-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סה״כ דיבידנדים</p>
                <p className="text-2xl font-bold text-gray-900">₪{totalDividends.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg md-elevation-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">מניות משלמות</p>
                <p className="text-2xl font-bold text-gray-900">{investmentsWithDividends.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 md-elevation-1">
          <h3 className="font-semibold mb-4">הוסף דיבידנד חדש</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>בחר השקעה</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {investments.map(inv => (
                  <Button
                    key={inv.id}
                    variant={selectedInvestment?.id === inv.id ? 'default' : 'outline'}
                    onClick={() => setSelectedInvestment(inv)}
                    className="md-ripple justify-start"
                  >
                    {inv.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedInvestment && (
              <div className="space-y-2">
                <Label htmlFor="dividendAmount">סכום דיבידנד (₪)</Label>
                <div className="flex gap-2">
                  <Input
                    id="dividendAmount"
                    type="number"
                    step="0.01"
                    value={dividendAmount}
                    onChange={(e) => setDividendAmount(e.target.value)}
                    placeholder="הכנס סכום"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddDividend}
                    disabled={!dividendAmount}
                    className="md-ripple bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 md-elevation-1">
          <h3 className="font-semibold mb-4">דיבידנדים לפי מניה</h3>
          <div className="space-y-3">
            {investments.filter(inv => (inv.dividends || 0) > 0).map(inv => {
              const invested = inv.quantity * inv.purchase_price;
              const yieldPercent = invested > 0 ? (inv.dividends / invested) * 100 : 0;
              
              return (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{inv.name}</span>
                      <Badge variant="outline" className="text-xs">{inv.symbol}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      תשואה: {yieldPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-purple-600">₪{inv.dividends.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">דיבידנדים</p>
                  </div>
                </div>
              );
            })}
            {investmentsWithDividends.length === 0 && (
              <p className="text-center text-gray-500 py-4">אין דיבידנדים רשומים</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}