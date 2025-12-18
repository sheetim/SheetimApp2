import React from "react";
import { motion } from "framer-motion";
import ProBadge from "./ProBadge";

const pageDescriptions = {
  Transactions: "עקוב אחרי כל התנועות הכספיות שלך – הכנסות והוצאות במקום אחד.",
  Budgets: "הגדר תקציב חודשי לכל קטגוריה וקבל התראות כשאתה מתקרב לתקרה.",
  Savings: "הגדר יעדי חיסכון, עקוב אחרי ההתקדמות וחגוג כל הצלחה.",
  Debts: "נהל את כל החובות שלך ותכנן אסטרטגיה לפירעון מהיר יותר.",
  Investments: "עקוב אחרי תיק ההשקעות, התשואות והדיבידנדים שלך.",
  Dividends: "ראה את כל הדיבידנדים שקיבלת ותחזיות להכנסה פסיבית.",
  Forecast: "תחזית הכנסות והוצאות לחודשים הקרובים על בסיס הנתונים שלך.",
  NetWorth: "ראה את השווי הנקי שלך – כל הנכסים פחות כל החובות.",
  Inflation: "הבן איך האינפלציה משפיעה על ההוצאות שלך לאורך זמן.",
  AIInsights: "כאן תמצא סיכומים חכמים, תובנות והזדמנויות שמבוססים על כל המידע הפיננסי שלך.",
  Reports: "דוחות מפורטים ומותאמים אישית על המצב הפיננסי.",
  Retirement: "תכנן את העתיד – חישובי פנסיה ופרישה מותאמים אישית.",
  UserSettings: "הגדרות חשבון, התראות ופרטיות.",
};

export default function PageHeader({ 
  title, 
  description, 
  icon: Icon, 
  pageName,
  badge,
  badgeVariant = "secondary",
  children 
}) {
  const desc = description || pageDescriptions[pageName];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {title}
              </h1>
              {badge === 'Pro' && <ProBadge size="xs" />}
              {badge && badge !== 'Pro' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  badgeVariant === 'default' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {badge}
                </span>
              )}
            </div>
            {desc && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 leading-relaxed line-clamp-2">
                {desc}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}