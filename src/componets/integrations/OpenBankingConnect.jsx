import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Mail, Clock, Sparkles, Shield, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionGuard, useSubscription } from "../subscription/SubscriptionGuard";

const BANKS = [
  { name: 'לאומי', logo: '🏦' },
  { name: 'הפועלים', logo: '🏛️' },
  { name: 'דיסקונט', logo: '💳' },
  { name: 'מזרחי טפחות', logo: '🏠' },
  { name: 'ישראכרט', logo: '💳' },
  { name: 'מקס', logo: '💳' },
];

export default function OpenBankingConnect({ onConnect }) {
  const { isPremium } = useSubscription();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSubmitted(true);
    toast.success('תודה! נעדכן אותך כשהאינטגרציה תהיה זמינה');
  };

  return (
    <SubscriptionGuard feature="open_banking">
      <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl shadow-sm border border-green-200 dark:border-green-800">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Building2 className="w-5 h-5 text-green-600" />
            חיבור אוטומטי לבנק
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
              בקרוב
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                בגרסה הבאה – סנכרון אוטומטי עם הבנק!
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                תחבר את חשבון הבנק שלך פעם אחת, וכל העסקאות יתעדכנו אוטומטית כל יום
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {BANKS.map((bank) => (
              <div
                key={bank.name}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <span className="text-sm">{bank.logo}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300">{bank.name}</span>
              </div>
            ))}
          </div>

          {submitted ? (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-green-700 dark:text-green-300">
                נרשמת בהצלחה! נעדכן אותך כשזה יהיה מוכן
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="השאר מייל לעדכון"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 text-sm bg-white dark:bg-gray-700"
              />
              <Button
                onClick={handleSubmit}
                disabled={!email}
                className="h-11 px-4 bg-green-600 hover:bg-green-700"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>צפוי להיות זמין ברבעון הראשון של 2025</span>
          </div>

          <div className="p-3 bg-white/70 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">אבטחה ופרטיות</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>הצפנה מקצה לקצה</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>תקן PSD2 אירופי</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>לא שומרים סיסמאות</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>ניתוק בכל עת</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SubscriptionGuard>
  );
}