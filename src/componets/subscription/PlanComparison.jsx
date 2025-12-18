import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Sparkles, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const features = [
  { name: 'מעקב עסקאות', free: true, pro: true, proPlus: true },
  { name: 'תקציבים (עד 3)', free: true, pro: false, proPlus: false },
  { name: 'תקציבים ללא הגבלה', free: false, pro: true, proPlus: true },
  { name: 'יעדי חיסכון בסיסיים', free: true, pro: true, proPlus: true },
  { name: 'ניהול חובות', free: true, pro: true, proPlus: true },
  { name: 'דוחות בסיסיים', free: true, pro: true, proPlus: true },
  { name: 'יועץ AI מתקדם', free: false, pro: true, proPlus: true },
  { name: 'התראות חכמות AI', free: false, pro: true, proPlus: true },
  { name: 'דוחות מתקדמים', free: false, pro: true, proPlus: true },
  { name: 'היסטוריה ללא הגבלה', free: false, pro: true, proPlus: true },
  { name: 'Open Banking (חיבור לבנק)', free: false, pro: false, proPlus: true },
  { name: 'סנכרון בית השקעות', free: false, pro: false, proPlus: true },
  { name: 'תמיכה עדיפה', free: false, pro: false, proPlus: true },
];

export default function PlanComparison({ currentPlan = 'free', onSelectPlan }) {
  return (
    <div className="space-y-6">
      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
        {/* Free Plan */}
        <Card className={`border-2 ${currentPlan === 'free' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">חינם</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₪0</p>
              <p className="text-xs text-gray-500">לתמיד</p>
            </div>
            <div className="space-y-2">
              {features.filter(f => f.free).slice(0, 6).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`border-2 ${currentPlan === 'pro' ? 'border-purple-500' : 'border-purple-200 dark:border-purple-800'} relative`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3">
              הכי פופולרי
            </Badge>
          </div>
          <CardContent className="p-4 pt-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-2">₪29<span className="text-sm font-normal">/חודש</span></p>
            </div>
            <div className="space-y-2">
              {features.filter(f => f.pro).slice(0, 8).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro Plus Plan */}
        <Card className={`border-2 ${currentPlan === 'pro_plus' ? 'border-amber-500' : 'border-gray-200 dark:border-gray-700'}`}>
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro+</h3>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">₪49<span className="text-sm font-normal">/חודש</span></p>
            </div>
            <div className="space-y-2">
              {features.filter(f => f.proPlus).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Comparison Table */}
      <Card className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-0 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-right p-4 text-sm font-semibold text-gray-900 dark:text-white w-1/3">
                  תכונה
                </th>
                <th className="p-4 text-center">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">חינם</div>
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">₪0</div>
                </th>
                <th className="p-4 text-center bg-purple-50 dark:bg-purple-900/20">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mb-2">
                    הכי פופולרי
                  </Badge>
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Pro
                  </div>
                  <div className="text-lg font-bold text-purple-600 mt-1">₪29/חודש</div>
                </th>
                <th className="p-4 text-center">
                  <div className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
                    <Crown className="w-4 h-4" />
                    Pro+
                  </div>
                  <div className="text-lg font-bold text-amber-600 mt-1">₪49/חודש</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{feature.name}</td>
                  <td className="p-4 text-center">
                    {feature.free ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-900/10">
                    {feature.pro ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {feature.proPlus ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}