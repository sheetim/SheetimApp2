import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Scale } from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "3 בדצמבר 2025";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">תנאי שימוש ומדיניות פרטיות</h1>
        <p className="text-sm text-gray-500">עודכן לאחרונה: {lastUpdated}</p>
      </div>

      {/* Disclaimer - Most Important */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5" />
            כתב ויתור והגבלת אחריות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold">
            ⚠️ חשוב לקרוא בעיון:
          </p>
          <ul className="space-y-2 list-disc pr-5">
            <li>
              <strong>אין זו ייעוץ פיננסי:</strong> המידע המוצג באפליקציה זו הינו למטרות מידע כללי בלבד ואינו מהווה ייעוץ פיננסי, השקעות, מס, או כל ייעוץ מקצועי אחר.
            </li>
            <li>
              <strong>אין אחריות על החלטות:</strong> כל החלטה פיננסית שתקבל על בסיס המידע באפליקציה היא באחריותך הבלעדית. מומלץ להתייעץ עם יועץ פיננסי מוסמך.
            </li>
            <li>
              <strong>דיוק המידע:</strong> אנו עושים מאמץ להציג מידע מדויק, אך איננו מתחייבים לדיוק, שלמות או עדכניות המידע.
            </li>
            <li>
              <strong>הגבלת אחריות:</strong> בשום מקרה לא נהיה אחראים לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע משימוש באפליקציה.
            </li>
            <li>
              <strong>תשואות עבר:</strong> נתוני ביצועים והשקעות מהעבר אינם מעידים על תוצאות עתידיות.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Terms of Service */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <FileText className="w-5 h-5 text-blue-600" />
            תנאי שימוש
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-2">1. קבלת התנאים</h3>
            <p>בשימוש באפליקציה "Sheetim" (להלן: "האפליקציה"), הנך מסכים לתנאי שימוש אלו במלואם. אם אינך מסכים לתנאים אלו, אנא הימנע משימוש באפליקציה.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. תיאור השירות</h3>
            <p>האפליקציה מספקת כלים לניהול פיננסי אישי, כולל מעקב הוצאות והכנסות, תקציבים, השקעות, חובות ויעדי חיסכון. השירות מיועד לשימוש אישי בלבד.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. אחריות המשתמש</h3>
            <ul className="list-disc pr-5 space-y-1">
              <li>הנך אחראי לשמירה על סודיות פרטי ההתחברות שלך</li>
              <li>הנך אחראי לדיוק המידע שאתה מזין לאפליקציה</li>
              <li>הנך מתחייב לא להשתמש באפליקציה לכל מטרה בלתי חוקית</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. קניין רוחני</h3>
            <p>כל הזכויות באפליקציה, כולל עיצוב, קוד, ותוכן, שמורות לבעלי האפליקציה. אין להעתיק, לשכפל או להפיץ חלק כלשהו מהאפליקציה ללא אישור בכתב.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. שינויים בשירות</h3>
            <p>אנו שומרים לעצמנו את הזכות לשנות, להשעות או להפסיק את השירות בכל עת וללא הודעה מוקדמת.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">6. דין חל וסמכות שיפוט</h3>
            <p>תנאים אלו כפופים לחוקי מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים בישראל בלבד.</p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Shield className="w-5 h-5 text-green-600" />
            מדיניות פרטיות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-2">1. איסוף מידע</h3>
            <p>אנו אוספים מידע שאתה מספק לנו באופן ישיר, כגון:</p>
            <ul className="list-disc pr-5 space-y-1 mt-2">
              <li>פרטי הרשמה (שם, אימייל)</li>
              <li>נתונים פיננסיים שאתה מזין (הכנסות, הוצאות, השקעות וכו')</li>
              <li>העדפות שימוש</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. שימוש במידע</h3>
            <p>המידע שנאסף משמש אותנו למטרות הבאות:</p>
            <ul className="list-disc pr-5 space-y-1 mt-2">
              <li>אספקת השירות והתאמתו לצרכיך</li>
              <li>שיפור חווית המשתמש</li>
              <li>תקשורת עמך בנוגע לשירות</li>
              <li>ניתוח סטטיסטי אנונימי</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. אבטחת מידע</h3>
            <p>אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלך, כולל הצפנה ואחסון מאובטח. עם זאת, שום שיטת העברה או אחסון אלקטרוני אינה בטוחה ב-100%.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. שיתוף מידע</h3>
            <p>איננו מוכרים, משכירים או משתפים את המידע האישי שלך עם צדדים שלישיים, למעט:</p>
            <ul className="list-disc pr-5 space-y-1 mt-2">
              <li>ספקי שירות הנדרשים להפעלת האפליקציה</li>
              <li>כנדרש על פי חוק או צו בית משפט</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. זכויותיך</h3>
            <p>בהתאם לחוק הגנת הפרטיות, הנך זכאי:</p>
            <ul className="list-disc pr-5 space-y-1 mt-2">
              <li>לעיין במידע השמור עליך</li>
              <li>לבקש תיקון מידע שגוי</li>
              <li>לבקש מחיקת המידע שלך</li>
              <li>לייצא את הנתונים שלך</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">6. עוגיות (Cookies)</h3>
            <p>האפליקציה משתמשת בעוגיות לצורך תפעול תקין ושיפור חווית המשתמש. באפשרותך לשלוט בהגדרות העוגיות בדפדפן שלך.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">7. יצירת קשר</h3>
            <p>לכל שאלה בנוגע לפרטיות או לתנאי השימוש, ניתן לפנות אלינו דרך עמוד ההגדרות באפליקציה.</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Disclaimer */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Scale className="w-5 h-5" />
            גילוי נאות - שירותים פיננסיים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900 dark:text-blue-200">
          <p>
            <strong>אפליקציית Sheetim אינה:</strong>
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li>יועץ השקעות מורשה</li>
            <li>יועץ מס</li>
            <li>יועץ פנסיוני</li>
            <li>גוף פיננסי מפוקח</li>
          </ul>
          <p className="mt-3">
            לקבלת ייעוץ פיננסי מקצועי, אנא פנה לבעל מקצוע מורשה. אנו ממליצים להתייעץ עם יועץ מס מוסמך לפני קבלת החלטות מס, ועם יועץ השקעות מורשה לפני ביצוע השקעות.
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
        <p>© {new Date().getFullYear()} Sheetim. כל הזכויות שמורות.</p>
        <p className="mt-1">בשימוש באפליקציה הנך מאשר שקראת והסכמת לתנאים אלו.</p>
      </div>
    </div>
  );
}