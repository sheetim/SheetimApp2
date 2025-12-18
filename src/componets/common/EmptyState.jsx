import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Predefined empty state content for each screen
const emptyStateContent = {
  transactions: {
    title: "עדיין אין תנועות",
    description: "התחל להוסיף הוצאות והכנסות כדי לראות תמונה מלאה.",
    actionLabel: "הוסף תנועה ראשונה"
  },
  budgets: {
    title: "אין תקציבים מוגדרים",
    description: "הגדר תקציב חודשי לכל קטגוריה כדי לשלוט בהוצאות.",
    actionLabel: "הגדר תקציב ראשון"
  },
  savings: {
    title: "אין יעדי חיסכון",
    description: "הגדר יעדי חיסכון ועקוב אחרי ההתקדמות שלך.",
    actionLabel: "הגדר יעד חיסכון"
  },
  debts: {
    title: "אין חובות במעקב",
    description: "אם יש לך הלוואות או חובות, הוסף אותם כדי לתכנן איך לסיים אותם.",
    actionLabel: "הוסף חוב"
  },
  investments: {
    title: "תיק ההשקעות שלך עדיין ריק",
    description: "הוסף מניות, קרנות או נכסים כדי לעקוב אחרי התשואה והדיבידנדים.",
    actionLabel: "הוסף השקעה"
  },
  dividends: {
    title: "אין דיבידנדים רשומים",
    description: "כשתקבל דיבידנדים מהשקעות, תוכל לתעד אותם כאן.",
    actionLabel: "רשום דיבידנד"
  },
  networth: {
    title: "עוד לא חישבנו שווי נקי",
    description: "הוסף נכסים והתחייבויות כדי לראות את התמונה המלאה שלך.",
    actionLabel: "התחל לבנות את השווי הנקי"
  },
  inflation: {
    title: "אין פריטים במעקב",
    description: "עקוב אחרי מחירי מוצרים לאורך זמן כדי להבין איך האינפלציה משפיעה עליך.",
    actionLabel: "הוסף פריט למעקב"
  },
  aiinsights: {
    title: "אין תובנות עדיין",
    description: "הוסף נתונים פיננסיים כדי שה-AI יוכל לנתח ולתת המלצות.",
    actionLabel: "התחל לנתח"
  },
  reports: {
    title: "אין דוחות להצגה",
    description: "צור דוחות מותאמים אישית על ההוצאות, ההכנסות וההשקעות שלך.",
    actionLabel: "צור דוח"
  },
  goals: {
    title: "אין יעדים פיננסיים",
    description: "הגדר יעדים פיננסיים כדי לתכנן את העתיד הכלכלי שלך.",
    actionLabel: "הגדר יעד"
  }
};

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration = "default",
  preset // New prop to use predefined content
}) {
  // Use preset content if provided
  const content = preset ? emptyStateContent[preset] : {};
  const finalTitle = title || content.title || "אין נתונים להצגה";
  const finalDescription = description || content.description || "התחל להוסיף נתונים כדי לראות תוכן כאן.";
  const finalActionLabel = actionLabel || content.actionLabel;

  const illustrations = {
    default: (
      <motion.svg 
        className="w-28 h-28 mx-auto mb-4" 
        viewBox="0 0 200 200" 
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <motion.circle 
          cx="100" cy="100" r="80" 
          fill="currentColor" 
          className="text-gray-100 dark:text-gray-700"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.path 
          d="M70 90 L80 100 L110 70" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-gray-300 dark:text-gray-600"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.circle 
          cx="140" cy="60" r="8" 
          fill="currentColor" 
          className="text-blue-200 dark:text-blue-800"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        />
        <motion.circle 
          cx="60" cy="140" r="6" 
          fill="currentColor" 
          className="text-purple-200 dark:text-purple-800"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
        />
      </motion.svg>
    ),
    financial: (
      <motion.svg 
        className="w-28 h-28 mx-auto mb-4" 
        viewBox="0 0 200 200" 
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <motion.rect 
          x="40" y="60" width="120" height="100" rx="8" 
          fill="currentColor" 
          className="text-gray-100 dark:text-gray-700"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.rect 
          x="60" y="100" width="20" height="40" rx="4" 
          fill="currentColor" 
          className="text-blue-300 dark:text-blue-700"
          initial={{ height: 0, y: 140 }}
          animate={{ height: 40, y: 100 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />
        <motion.rect 
          x="90" y="80" width="20" height="60" rx="4" 
          fill="currentColor" 
          className="text-green-300 dark:text-green-700"
          initial={{ height: 0, y: 140 }}
          animate={{ height: 60, y: 80 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        />
        <motion.rect 
          x="120" y="90" width="20" height="50" rx="4" 
          fill="currentColor" 
          className="text-purple-300 dark:text-purple-700"
          initial={{ height: 0, y: 140 }}
          animate={{ height: 50, y: 90 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        />
        <motion.circle 
          cx="180" cy="40" r="12" 
          fill="currentColor" 
          className="text-yellow-200 dark:text-yellow-800"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </motion.svg>
    ),
    savings: (
      <motion.svg 
        className="w-28 h-28 mx-auto mb-4" 
        viewBox="0 0 200 200" 
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <motion.circle 
          cx="100" cy="120" r="60" 
          fill="currentColor" 
          className="text-orange-100 dark:text-orange-900"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.path 
          d="M80 120 L100 100 L120 120 L100 140 Z" 
          fill="currentColor" 
          className="text-orange-300 dark:text-orange-700"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        <motion.circle 
          cx="100" cy="60" r="15" 
          fill="currentColor" 
          className="text-yellow-300 dark:text-yellow-700"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        />
        <motion.path 
          d="M95 50 L100 40 L105 50" 
          stroke="currentColor" 
          strokeWidth="3" 
          className="text-yellow-400 dark:text-yellow-600"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </motion.svg>
    ),
  };

  return (
    <motion.div 
      className="text-center py-8 md:py-12 px-4 max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {illustrations[illustration] || illustrations.default}
      
      {Icon && (
        <motion.div 
          className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </motion.div>
      )}
      
      <motion.h3 
        className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {finalTitle}
      </motion.h3>
      <motion.p 
        className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {finalDescription}
      </motion.p>
      
      {finalActionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onAction}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
            size="lg"
            aria-label={finalActionLabel}
          >
            {finalActionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}