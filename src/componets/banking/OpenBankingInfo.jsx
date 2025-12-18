import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, CheckCircle2, Award, Building2, Clock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function OpenBankingInfo() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = () => {
    if (!email) return;
    setSubmitted(true);
    toast.success('נרשמת בהצלחה! נעדכן אותך כשהאינטגרציה תהיה זמינה');
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 mb-6 overflow-hidden">
      {/* Demo Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          בקרוב – החיבור האמיתי בדרך
        </span>
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200 text-[10px] mr-auto">
          Q2 2025
        </Badge>
      </div>

      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              מה זה Open Banking?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              שירות מידע פיננסי מאושר ומפוקח המאפשר לך לראות את כל המידע הפיננסי שלך במקום אחד
            </p>
          </div>
        </div>

        {/* Demo Info Box */}
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700 mb-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                מצב הדגמה – סימולציה בלבד
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                הנתונים המוצגים הם נתוני דוגמה להמחשה. בגרסה הבאה יהיה חיבור אמיתי לחשבון הבנק.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">אבטחה בנקאית</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">הצפנה 256-bit והגנה מלאה על המידע</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">ללא סיסמאות</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">לעולם לא נבקש סיסמת בנק</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">קריאה בלבד</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">אין גישה לביצוע פעולות בחשבון</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">מפוקח ומאושר</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">רישיון מרשות ני"ע ובנק ישראל</p>
            </div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          {submitted ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-sm text-green-700 dark:text-green-300">
                נרשמת! נעדכן אותך כשיהיה מוכן
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="השאר מייל לעדכון כשיהיה זמין"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-10 text-sm bg-white dark:bg-gray-700"
              />
              <Button
                onClick={handleNotify}
                disabled={!email}
                className="h-10 bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}