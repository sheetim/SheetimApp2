import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, TrendingUp, Shield, Zap, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumBanner({ variant = "default", compact = false }) {
  if (variant === "compact") {
    return (
      <Card className="md-card md-elevation-2 border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-purple-900/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-2xl" />
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  שדרג ל-Premium
                  <Badge className="bg-yellow-400 text-yellow-900">חדש!</Badge>
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">קבל גישה לכל התכונות המתקדמות</p>
              </div>
            </div>
            <Link to={createPageUrl('Subscription')}>
              <Button className="md-ripple bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 whitespace-nowrap">
                שדרג עכשיו
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md-card md-elevation-3 border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/40 dark:via-blue-900/40 dark:to-indigo-900/40 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse-soft" />
      
      <CardContent className="p-8 relative">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 float-animation">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold gradient-text">שדרג ל-Premium</h2>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 border-0">
                🔥 מבצע מיוחד
              </Badge>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              פתח את מלוא הפוטנציאל הפיננסי שלך עם תכונות Premium בלעדיות
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">יועץ AI מתקדם</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">המלצות אישיות מבוססות למידת מכונה</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">דוחות מתקדמים</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">ניתוחים עמוקים וויזואליזציות מקצועיות</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Open Banking</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">חיבור אוטומטי לחשבון הבנק שלך</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">התראות חכמות</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">עדכונים בזמן אמת על ההוצאות שלך</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white">
          <div className="flex-1 text-center sm:text-right">
            <p className="text-sm opacity-90 mb-1">התחל היום ב</p>
            <p className="text-3xl font-bold">
              ₪49/חודש
              <span className="text-lg font-normal opacity-90 mr-2">או ₪490/שנה</span>
            </p>
            <p className="text-sm opacity-75 mt-1">💰 חסוך 17% בתשלום שנתי</p>
          </div>
          <Link to={createPageUrl('Subscription')}>
            <Button 
              size="lg" 
              className="md-ripple bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 py-6 shadow-xl"
            >
              <Crown className="w-5 h-5 ml-2" />
              שדרג עכשיו
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          🎁 ניסיון חינם ל-7 ימים • ✨ ללא התחייבות • 💳 ביטול בכל עת
        </p>
      </CardContent>
    </Card>
  );
}