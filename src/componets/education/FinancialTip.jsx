import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, ChevronLeft, ChevronRight, BookOpen, 
  Star, Share2, Bookmark, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FINANCIAL_TIPS = [
  {
    id: 1,
    title: "כלל 50/30/20",
    content: "חלק את ההכנסה שלך: 50% לצרכים בסיסיים, 30% לרצונות, ו-20% לחיסכון והשקעות.",
    category: "תקציב",
    difficulty: "מתחיל",
    readTime: "2 דק׳",
    actionable: "הגדר תקציב לפי הכלל הזה"
  },
  {
    id: 2,
    title: "קרן חירום",
    content: "שמור 3-6 חודשי הוצאות בחשבון נזיל. זה יגן עליך במקרה של אובדן הכנסה או הוצאות בלתי צפויות.",
    category: "חיסכון",
    difficulty: "מתחיל",
    readTime: "2 דק׳",
    actionable: "התחל לבנות קרן חירום"
  },
  {
    id: 3,
    title: "ריבית דריבית",
    content: "השקעה של ₪1,000 בחודש עם תשואה של 7% תהפוך ל-₪173,000 תוך 10 שנים. ככל שמתחילים מוקדם יותר, הקסם גדול יותר.",
    category: "השקעות",
    difficulty: "מתקדם",
    readTime: "3 דק׳",
    actionable: "התחל להשקיע היום"
  },
  {
    id: 4,
    title: "פרע חובות יקרים קודם",
    content: "השתמש בשיטת Avalanche - פרע קודם את החוב עם הריבית הגבוהה ביותר. זה יחסוך לך הכי הרבה כסף.",
    category: "חובות",
    difficulty: "בינוני",
    readTime: "3 דק׳",
    actionable: "דרג את החובות לפי ריבית"
  },
  {
    id: 5,
    title: "אוטומציה היא המפתח",
    content: "הגדר העברה אוטומטית לחיסכון ביום קבלת המשכורת. מה שלא רואים - לא מבזבזים.",
    category: "חיסכון",
    difficulty: "מתחיל",
    readTime: "1 דק׳",
    actionable: "הגדר הוראת קבע לחיסכון"
  },
  {
    id: 6,
    title: "בדוק עמלות",
    content: "עמלות של 1% לשנה על השקעות יכולות להפחית את הרווח שלך ב-30% על פני 30 שנה. בדוק תמיד את העמלות.",
    category: "השקעות",
    difficulty: "מתקדם",
    readTime: "2 דק׳",
    actionable: "השווה עמלות בין קרנות"
  },
  {
    id: 7,
    title: "כלל 72",
    content: "חלק 72 בשיעור התשואה השנתית כדי לדעת תוך כמה שנים הכסף יכפיל את עצמו. לדוגמה: 72÷8%=9 שנים.",
    category: "השקעות",
    difficulty: "בינוני",
    readTime: "2 דק׳"
  },
  {
    id: 8,
    title: "הימנע מאינפלציה של אורח חיים",
    content: "כשהמשכורת עולה, אל תעלה את ההוצאות באותו שיעור. השקע את העלייה בהכנסה במקום לבזבז אותה.",
    category: "תקציב",
    difficulty: "בינוני",
    readTime: "2 דק׳",
    actionable: "תכנן מה תעשה עם העלאה הבאה"
  }
];

const categoryColors = {
  "תקציב": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  "חיסכון": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "השקעות": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "חובות": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
};

const difficultyColors = {
  "מתחיל": "bg-green-100 text-green-700",
  "בינוני": "bg-yellow-100 text-yellow-700",
  "מתקדם": "bg-red-100 text-red-700"
};

export default function FinancialTip({ category = null, compact = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedTips, setSavedTips] = useState([]);
  const [direction, setDirection] = useState(0);

  // Filter tips by category if specified
  const filteredTips = category 
    ? FINANCIAL_TIPS.filter(t => t.category === category)
    : FINANCIAL_TIPS;

  const currentTip = filteredTips[currentIndex];

  const nextTip = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filteredTips.length);
  };

  const prevTip = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filteredTips.length) % filteredTips.length);
  };

  const toggleSave = (tipId) => {
    setSavedTips(prev => 
      prev.includes(tipId) 
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
    );
  };

  // Auto-advance every 30 seconds
  useEffect(() => {
    const timer = setInterval(nextTip, 30000);
    return () => clearInterval(timer);
  }, []);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{currentTip.title}</h3>
                <Badge className={`text-[10px] ${categoryColors[currentTip.category]}`}>
                  {currentTip.category}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{currentTip.content}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {filteredTips.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-800'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevTip}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextTip}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-slate-800 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500" />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">טיפ פיננסי</h3>
              <p className="text-[10px] text-gray-500">{currentIndex + 1} מתוך {filteredTips.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevTip}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextTip}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentTip.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={categoryColors[currentTip.category]}>
                  {currentTip.category}
                </Badge>
                <Badge className={difficultyColors[currentTip.difficulty]}>
                  {currentTip.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="w-3 h-3 ml-1" />
                  {currentTip.readTime}
                </Badge>
              </div>

              <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                {currentTip.title}
              </h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentTip.content}
              </p>

              {currentTip.actionable && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    פעולה מומלצת: {currentTip.actionable}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  {filteredTips.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDirection(idx > currentIndex ? 1 : -1);
                        setCurrentIndex(idx);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'bg-amber-500 w-4' 
                          : 'bg-amber-200 dark:bg-amber-800 hover:bg-amber-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => toggleSave(currentTip.id)}
                  >
                    <Bookmark className={`w-4 h-4 ${savedTips.includes(currentTip.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}