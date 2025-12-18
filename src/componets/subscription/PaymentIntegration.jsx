import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Shield, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function PaymentIntegration({ plan, billingCycle, onSuccess, onCancel, userDiscount }) {
  const [paymentMethod, setPaymentMethod] = useState('tranzila');
  const [processing, setProcessing] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const basePrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  // Apply discount if user has one
  const discountPercent = userDiscount?.has_discount && new Date(userDiscount.discount_end_date) > new Date() 
    ? userDiscount.discount_percent 
    : 0;
  const price = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
  const priceUSD = (price / 3.7).toFixed(2); // Convert ILS to USD approximately
  const formattedPrice = new Intl.NumberFormat('he-IL', { 
    style: 'currency', 
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);

  // Handle PayPal Subscription
  const handlePayPalSubscription = async () => {
    setProcessing(true);
    try {
      const { data } = await base44.functions.invoke('createPayPalSubscription', {
        planType: plan.plan_type,
        billingCycle: billingCycle,
        returnUrl: `${window.location.origin}/UserSettings?subscription=success`,
        cancelUrl: `${window.location.origin}/UserSettings?subscription=cancelled`
      });

      if (data.approvalUrl) {
        // Redirect to PayPal for subscription approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received');
      }
    } catch (error) {
      console.error('PayPal Subscription Error:', error);
      toast.error('שגיאה ביצירת מנוי PayPal');
      setProcessing(false);
    }
  };



  const handleTranzila = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      // בגרסה אמיתית - פה יהיה חיבור ל-Tranzila API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // סימולציה של תשלום מוצלח
      const paymentData = {
        transaction_id: 'TR-' + Date.now(),
        payment_method: 'Tranzila',
        amount: price,
        status: 'completed'
      };
      
      onSuccess(paymentData);
      toast.success('התשלום בוצע בהצלחה! 🎉');
    } catch (error) {
      toast.error('שגיאה בעיבוד התשלום');
    } finally {
      setProcessing(false);
    }
  };



  return (
    <Card className="md-card md-elevation-3 border-0 dark:bg-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="dark:text-white">השלמת תשלום</CardTitle>
          <div className="text-left">
            {discountPercent > 0 && (
              <p className="text-sm text-gray-400 line-through">{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(basePrice)}</p>
            )}
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedPrice}</p>
            <p className="text-xs text-gray-500">
              {billingCycle === 'monthly' ? 'לחודש' : 'לשנה'}
              {discountPercent > 0 && <span className="text-green-600 mr-1">({discountPercent}% הנחה)</span>}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            🔒 <strong>תשלום מאובטח:</strong> הצפנה 256-bit בתקן PCI-DSS. אנו לא שומרים פרטי כרטיס.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-wrap items-center justify-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Shield className="w-3 h-3 text-green-500" />
            <span>הצפנת 256-bit</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>תקן PCI-DSS</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>ביטול בכל עת</span>
          </div>
        </div>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tranzila">כרטיס אשראי</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>

          <TabsContent value="tranzila" className="space-y-4">
            <form onSubmit={handleTranzila} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">מספר כרטיס</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                  maxLength={19}
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolder">שם בעל הכרטיס</Label>
                <Input
                  id="cardHolder"
                  placeholder="ישראל ישראלי"
                  value={cardDetails.cardHolder}
                  onChange={(e) => setCardDetails({...cardDetails, cardHolder: e.target.value})}
                  required
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">חודש</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={cardDetails.expiryMonth}
                    onChange={(e) => setCardDetails({...cardDetails, expiryMonth: e.target.value})}
                    maxLength={2}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">שנה</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    value={cardDetails.expiryYear}
                    onChange={(e) => setCardDetails({...cardDetails, expiryYear: e.target.value})}
                    maxLength={2}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    maxLength={3}
                    required
                    type="password"
                    className="text-base"
                  />
                </div>
              </div>

              <Button type="submit" disabled={processing} className="w-full md-ripple h-11">
                {processing ? 'מעבד תשלום...' : `שלם ${formattedPrice}`}
              </Button>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                💳 תשלום מאובטח | 🔒 ללא שמירת פרטים | ❌ ביטול ללא עלות
              </p>
            </form>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4">
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" 
                  alt="PayPal" 
                  className="h-12"
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-2">
                  <strong>מנוי חוזר דרך PayPal</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  התשלום יתבצע אוטומטית כל {billingCycle === 'yearly' ? 'שנה' : 'חודש'} (${priceUSD} / {billingCycle === 'yearly' ? 'year' : 'month'})
                </p>
              </div>

              {processing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="mr-2 text-sm text-gray-500">מעביר ל-PayPal...</span>
                </div>
              ) : (
                <Button 
                  onClick={handlePayPalSubscription} 
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  המשך לתשלום ב-PayPal
                </Button>
              )}

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 space-y-1">
                <p>תועבר לדף PayPal להשלמת המנוי</p>
                <p>🔒 תשלום מאובטח | ✓ ביטול בכל עת | 💰 החזר תוך 14 יום</p>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p>בלחיצה על "שלם" אתה מאשר את <a href="mailto:sheetimsz@gmail.com?subject=תנאי שימוש" className="underline hover:text-blue-600">תנאי השימוש</a> ו<a href="mailto:sheetimsz@gmail.com?subject=מדיניות פרטיות" className="underline hover:text-blue-600">מדיניות הפרטיות</a></p>
        </div>

        <Button variant="ghost" onClick={onCancel} className="w-full md-ripple h-11">
          ביטול
        </Button>
      </CardContent>
    </Card>
  );
}