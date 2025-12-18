import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DemoIntegrationCard({ 
  icon: Icon,
  title,
  description,
  features = [],
  estimatedDate = "Q1 2025",
  gradient = "from-blue-500 to-indigo-600",
  isDemo = true
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotifyMe = () => {
    if (!email) {
      toast.error('הזן כתובת מייל');
      return;
    }
    setSubmitted(true);
    toast.success('נרשמת בהצלחה! נעדכן אותך כשהאינטגרציה תהיה זמינה');
  };

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            בקרוב – החיבור האמיתי בדרך
          </span>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200 text-[10px] mr-auto">
            {estimatedDate}
          </Badge>
        </div>
      )}

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {/* Demo Info Box */}
        {isDemo && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  מצב הדגמה – סימולציה בלבד
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  הנתונים המוצגים הם נתוני דוגמה להמחשה. בגרסה הבאה יהיה חיבור אמיתי לחשבון/ברוקר.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <div className="space-y-2 mb-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Email Notification */}
        {isDemo && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
                  placeholder="השאר מייל לעדכון"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-10 text-sm bg-white dark:bg-gray-700"
                />
                <Button
                  onClick={handleNotifyMe}
                  disabled={!email}
                  className={`h-10 bg-gradient-to-r ${gradient} hover:opacity-90`}
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}