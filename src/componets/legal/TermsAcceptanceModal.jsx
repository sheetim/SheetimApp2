import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsAcceptanceModal({ onAccept }) {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ברוכים הבאים ל-Sheetim</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">לפני שנתחיל, יש לאשר את תנאי השימוש</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6" onScrollCapture={handleScroll}>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            {/* Important Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">הגבלת אחריות</h3>
                  <p className="text-amber-700 dark:text-amber-400 text-xs">
                    אפליקציה זו מספקת כלים לניהול פיננסי אישי בלבד. <strong>אין זו ייעוץ פיננסי, השקעות או מס.</strong> כל החלטה שתקבל היא באחריותך הבלעדית.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Points */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                עיקרי התנאים:
              </h3>
              
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>המידע באפליקציה הוא למטרות מידע כללי בלבד ואינו מחליף ייעוץ מקצועי</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>אנו לא אחראים לנזקים כלשהם הנובעים משימוש באפליקציה</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>תשואות עבר אינן מעידות על תוצאות עתידיות</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>המידע שלך נשמר בצורה מאובטחת ולא נמכר לצדדים שלישיים</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>אנו לא יועצי השקעות, מס או פנסיה מורשים</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <Link 
                to={createPageUrl("Terms")} 
                className="text-blue-600 hover:text-blue-700 underline text-xs"
                target="_blank"
              >
                לקריאת תנאי השימוש המלאים ומדיניות הפרטיות →
              </Link>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-start gap-3 mb-4">
            <Checkbox 
              id="accept-terms" 
              checked={accepted} 
              onCheckedChange={setAccepted}
              className="mt-0.5"
            />
            <label htmlFor="accept-terms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              קראתי והבנתי את תנאי השימוש, מדיניות הפרטיות וכתב הויתור. אני מסכים/ה שהאפליקציה אינה מספקת ייעוץ פיננסי וכל החלטה היא באחריותי.
            </label>
          </div>
          
          <Button 
            onClick={onAccept} 
            disabled={!accepted}
            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepted ? "אני מסכים/ה - המשך לאפליקציה" : "יש לסמן את תיבת האישור"}
          </Button>
        </div>
      </div>
    </div>
  );
}