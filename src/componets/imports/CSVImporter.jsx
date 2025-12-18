import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, X, Loader2, Sparkles, Brain, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

// קטגוריות נתמכות מהסכמה
const EXPENSE_CATEGORIES = [
  "מזון_ומשקאות", "קניות", "תחבורה", "בילויים", "שירותים", 
  "בריאות", "חינוך", "דיור", "חובות", "חיסכון", "אחר_הוצאה"
];

const INCOME_CATEGORIES = ["משכורת", "עסק_עצמאי", "השקעות", "אחר_הכנסה"];

// מיפוי קטגוריות נפוצות
const CATEGORY_MAPPINGS = {
  // מזון
  'מזון': 'מזון_ומשקאות', 'אוכל': 'מזון_ומשקאות', 'מסעדות': 'מזון_ומשקאות', 
  'סופר': 'מזון_ומשקאות', 'מכולת': 'מזון_ומשקאות', 'food': 'מזון_ומשקאות',
  // קניות
  'קניות': 'קניות', 'ביגוד': 'קניות', 'shopping': 'קניות',
  // תחבורה
  'תחבורה': 'תחבורה', 'דלק': 'תחבורה', 'רכב': 'תחבורה', 'transport': 'תחבורה',
  // בילויים
  'בילויים': 'בילויים', 'פנאי': 'בילויים', 'entertainment': 'בילויים',
  // שירותים
  'שירותים': 'שירותים', 'חשמל': 'שירותים', 'מים': 'שירותים', 'גז': 'שירותים', 'utilities': 'שירותים',
  // בריאות
  'בריאות': 'בריאות', 'רפואה': 'בריאות', 'תרופות': 'בריאות', 'health': 'בריאות',
  // חינוך
  'חינוך': 'חינוך', 'לימודים': 'חינוך', 'education': 'חינוך',
  // דיור
  'דיור': 'דיור', 'שכירות': 'דיור', 'משכנתא': 'דיור', 'rent': 'דיור', 'housing': 'דיור',
  // הכנסות
  'משכורת': 'משכורת', 'שכר': 'משכורת', 'salary': 'משכורת',
  'עסק': 'עסק_עצמאי', 'עצמאי': 'עסק_עצמאי',
  'השקעות': 'השקעות', 'דיבידנד': 'השקעות', 'investment': 'השקעות',
};

export default function CSVImporter({ onComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportStats(null);
    setExtractedData(null);
    setProcessing(true);

    try {
      // העלאת הקובץ
      const { data: uploadData } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      if (!uploadData?.file_url) {
        throw new Error("Failed to upload file");
      }

      toast({ title: "📤 הקובץ הועלה, AI מנתח...", description: "זה ייקח כמה שניות" });

      // ניתוח הקובץ עם AI
      const prompt = `אתה מומחה לחילוץ נתוני עסקאות פיננסיות מקבצי בנק (CSV/Excel).

נתח את הקובץ המצורף וחלץ את כל העסקאות. לכל עסקה, זהה:
- תאריך בפורמט YYYY-MM-DD
- סכום (מספר חיובי)
- תיאור/פירוט
- סוג: "income" (הכנסה/זכות) או "expense" (הוצאה/חובה)
- קטגוריה מהרשימה: ${[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].join(', ')}

חשוב:
1. אם יש עמודות "חובה" ו"זכות" נפרדות - השתמש בערך שאינו 0
2. המר תאריכים לפורמט YYYY-MM-DD
3. סכומים תמיד חיוביים (ללא מינוס)
4. סווג לקטגוריה המתאימה ביותר לפי התיאור
5. דלג על שורות כותרת/ריקות

זהה גם את שם הבנק אם אפשר (לאומי, פועלים, דיסקונט וכו').`;

      const { data: aiData } = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [uploadData.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  amount: { type: "number" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { type: "string" }
                }
              }
            },
            bankName: { type: ["string", "null"] },
            summary: { type: "string" }
          }
        }
      });

      if (aiData?.transactions && aiData.transactions.length > 0) {
        setExtractedData(aiData);
        toast({
          title: `✅ זוהו ${aiData.transactions.length} עסקאות`,
          description: aiData.bankName ? `מקור: ${aiData.bankName}` : "בדוק ואשר לייבוא"
        });
      } else {
        throw new Error("No transactions found");
      }
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "❌ שגיאה בעיבוד הקובץ",
        description: "נסה קובץ אחר או צור קשר לתמיכה",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData?.transactions || extractedData.transactions.length === 0) {
      toast({ title: "אין עסקאות לייבוא", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const transactions = extractedData.transactions;
      
      // ייבוא בקבוצות של 50
      const batchSize = 50;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        await base44.entities.Transaction.bulkCreate(batch);
      }
      
      setImportStats({ imported: transactions.length });
      toast({ 
        title: `✅ יובאו ${transactions.length} עסקאות בהצלחה!`,
      });
      
      setTimeout(() => {
        setFile(null);
        setExtractedData(null);
        setImportStats(null);
        if (onComplete) onComplete();
      }, 1500);
      
    } catch (error) {
      console.error(error);
      toast({ title: "שגיאה בייבוא העסקאות", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setExtractedData(null);
    setImportStats(null);
    if (onComplete) onComplete();
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Brain className="w-5 h-5 text-purple-600" />
            ייבוא חכם עם AI
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">
        <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">פשוט גרור קובץ - AI עושה הכל</span>
              <Badge className="text-xs bg-purple-600">חכם</Badge>
            </div>
            תומך CSV וקבצי טקסט. AI מזהה עמודות, מסווג לקטגוריות ומתקן שגיאות אוטומטית.
            <br />
            <span className="text-xs text-gray-500">✓ לאומי ✓ פועלים ✓ דיסקונט ✓ מקס ✓ כאל ✓ ויזה ✓ ישראכרט ✓ אמריקן אקספרס</span>
          </AlertDescription>
        </Alert>

        <div>
          <Label className="text-gray-900 dark:text-gray-200 text-base font-semibold">העלה קובץ</Label>
          <div className="mt-2 relative">
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              disabled={processing || importing}
              className="dark:bg-gray-700 cursor-pointer h-14 text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {processing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">AI מעבד את הקובץ...</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            קבצים נתמכים: CSV, TXT | 💡 טיפ: ייצא מאקסל ל-CSV לפני העלאה
          </p>
        </div>

        {extractedData && (
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm">
                <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
                  {extractedData.bankName ? `זוהה קובץ מ${extractedData.bankName}` : 'הקובץ נותח בהצלחה'}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  {extractedData.summary}
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">תצוגה מקדימה</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {extractedData.transactions.slice(0, 10).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{t.description || 'ללא תיאור'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <span>{t.date}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      </div>
                    </div>
                    <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                {extractedData.transactions.length > 10 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                    ועוד {extractedData.transactions.length - 10} עסקאות...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {importStats && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700 dark:text-green-300">
              יובאו {importStats.imported} עסקאות בהצלחה!
              {importStats.skipped > 0 && ` (${importStats.skipped} שורות דולגו)`}
            </AlertDescription>
          </Alert>
        )}

        {extractedData && !importStats && (
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                מייבא {extractedData.transactions.length} עסקאות...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 ml-2" />
                ייבא {extractedData.transactions.length} עסקאות
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}