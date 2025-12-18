import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertCircle, Building2, Info, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const israeliBanks = [
  { value: "בנק הפועלים", label: "בנק הפועלים", logo: "🏦" },
  { value: "בנק לאומי", label: "בנק לאומי", logo: "🏦" },
  { value: "בנק דיסקונט", label: "בנק דיסקונט", logo: "🏦" },
  { value: "בנק מזרחי טפחות", label: "בנק מזרחי טפחות", logo: "🏦" },
  { value: "בנק יהב", label: "בנק יהב", logo: "🏦" },
  { value: "בנק איגוד", label: "בנק איגוד", logo: "🏦" },
  { value: "בנק מרכנתיל דיסקונט", label: "בנק מרכנתיל דיסקונט", logo: "🏦" },
  { value: "בנק ירושלים", label: "בנק ירושלים", logo: "🏦" },
  { value: "בנק מסד", label: "בנק מסד", logo: "🏦" },
  { value: "בנק אוצר החייל", label: "בנק אוצר החייל", logo: "🏦" },
  { value: "First International Bank", label: "First International Bank", logo: "🏦" },
  { value: "בנק פועלי אגודת ישראל", label: "בנק פועלי אגודת ישראל", logo: "🏦" }
];

export default function BankConnectionForm({ onConnect, onCancel, isConnecting }) {
  const [selectedBank, setSelectedBank] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConnect = () => {
    if (!selectedBank) {
      toast.error('נא לבחור בנק');
      return;
    }
    
    if (!agreedToTerms) {
      toast.error('יש לאשר את תנאי השימוש והסכמה להעברת מידע');
      return;
    }
    
    // Open bank's authentication page in a popup
    const width = 500;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      '',
      'BankAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (popup) {
      popup.document.write(`
        <html dir="rtl">
          <head>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .container {
                background: white;
                color: #333;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              .icon {
                font-size: 60px;
                margin-bottom: 20px;
              }
              h2 {
                margin: 0 0 10px 0;
                color: #667eea;
              }
              p {
                color: #666;
                margin: 10px 0;
              }
              .loader {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">🔐</div>
              <h2>מתחבר ל${selectedBank}</h2>
              <p>מעביר אותך לאתר הבנק לאימות מאובטח...</p>
              <div class="loader"></div>
              <p style="font-size: 14px; color: #f59e0b; margin-top: 20px; background: #fffbeb; padding: 10px; border-radius: 8px;">
                🧪 מצב הדגמה - סימולציה בלבד
              </p>
            </div>
          </body>
        </html>
      `);
      
      // Simulate bank authentication
      setTimeout(() => {
        popup.close();
        onConnect({
          bank_name: selectedBank,
          account_number: '****' + Math.floor(1000 + Math.random() * 9000),
          account_name: 'חשבון עו"ש',
          connection_status: 'connected',
          access_token: 'mock_token_' + Date.now(),
          refresh_token: 'mock_refresh_' + Date.now(),
          token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_sync_date: new Date().toISOString(),
          auto_sync: true,
          sync_frequency: 'daily'
        });
      }, 3000);
    }
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          חיבור חשבון בנק
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <strong>🧪 מצב הדגמה:</strong> זהו סימולציה של חיבור בנק. בגרסת הייצור, החיבור יתבצע דרך API אמיתי של הבנק.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label className="dark:text-gray-300">בחר בנק</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
              <SelectValue placeholder="בחר את הבנק שלך" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 max-h-64">
              {israeliBanks.map(bank => (
                <SelectItem key={bank.value} value={bank.value} className="dark:text-white">
                  {bank.logo} {bank.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="font-semibold text-blue-900 dark:text-blue-200">שקיפות מלאה:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>השירות מתבצע באמצעות Base44 - ספק מידע פיננסי מורשה</li>
              <li>החיבור באמצעות OAuth מאובטח ישירות מול הבנק</li>
              <li>המידע משמש אך ורק למעקב וניהול פיננסי אישי</li>
              <li><strong>לעולם לא נבקש ממך סיסמת בנק</strong></li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="font-semibold text-green-900 dark:text-green-200">אבטחת מידע:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>הצפנה מלאה (SSL/TLS) בהעברה ובאחסון</li>
              <li>הפרדת הרשאות - גישה למידע רק עבורך</li>
              <li>שמירת מינימום נתונים נדרש בלבד</li>
              <li>גישה לקריאה בלבד - אין אפשרות להעברות כספיות</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="font-semibold text-purple-900 dark:text-purple-200">זכויותיך:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>זכות החרטה:</strong> ניתוק חיבור בכל עת</li>
              <li><strong>מחיקת מידע:</strong> ניתן למחוק את כל המידע</li>
              <li><strong>שקיפות:</strong> ראייה מלאה של מה נאסף</li>
              <li><strong>ייעודיות:</strong> שימוש רק למטרה שהוצהרה</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-start gap-3">
            <Checkbox 
              id="terms-consent" 
              checked={agreedToTerms}
              onCheckedChange={setAgreedToTerms}
              className="mt-1"
            />
            <Label htmlFor="terms-consent" className="text-sm leading-relaxed cursor-pointer">
              <strong className="font-bold text-purple-900 dark:text-purple-200 block mb-2">
                הסכמה להעברת מידע (חובה על פי חוק שירות מידע פיננסי)
              </strong>
              <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
                <p>✓ אני מאשר/ת העברת מידע פיננסי מ{selectedBank || 'הבנק'} לאפליקציית Sheetim</p>
                <p>✓ המידע ישמש אך ורק למטרת <strong>מעקב וניהול פיננסי אישי</strong></p>
                <p>✓ הבנתי שהשירות מתבצע באמצעות Base44 - ספק מידע פיננסי מורשה</p>
                <p>✓ ידוע לי שאוכל לבטל הסכמה זו בכל עת על ידי ניתוק החשבון</p>
                <p>✓ ידוע לי שהמידע יישמר מוצפן ויהיה נגיש לי בלבד</p>
                <p>✓ ידוע לי שהאימות יתבצע ישירות מול הבנק ו<strong>לעולם לא תתבקש סיסמה</strong></p>
              </div>
              <p className="text-xs mt-3 pt-3 border-t border-purple-200 dark:border-purple-800 text-gray-600 dark:text-gray-400">
                השירות פועל על פי <strong>חוק שירות מידע פיננסי, התשפ"ב-2021</strong> וחוק הגנת הפרטיות
              </p>
            </Label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleConnect}
            disabled={!selectedBank || isConnecting}
            className="flex-1 md-ripple bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin w-4 h-4 ml-2 border-2 border-white border-t-transparent rounded-full" />
                מתחבר...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 ml-2" />
                חבר בצורה מאובטחת
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isConnecting}
            className="flex-1"
          >
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}