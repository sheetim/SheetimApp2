import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, X, AlertTriangle, ArrowRight, ArrowLeft, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { processImportedTransaction } from "../utils/creditCardUtils";

// קטגוריות תקפות מהסכמה
const EXPENSE_CATEGORIES = [
  "מזון_ומשקאות", "קניות", "תחבורה", "בילויים", "שירותים", 
  "בריאות", "חינוך", "דיור", "חובות", "חיסכון", "אחר_הוצאה"
];

const INCOME_CATEGORIES = ["משכורת", "עסק_עצמאי", "השקעות", "אחר_הכנסה"];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// מיפוי קטגוריות מ-MAX לקטגוריות במערכת
const MAX_CATEGORY_MAPPING = {
  'מסעדות ובתי קפה': 'מזון_ומשקאות',
  'מסעדות': 'מזון_ומשקאות',
  'בתי קפה': 'מזון_ומשקאות',
  'אוכל ומשקאות': 'מזון_ומשקאות',
  'מזון': 'מזון_ומשקאות',
  'סופרמרקט': 'מזון_ומשקאות',
  'מכולת': 'מזון_ומשקאות',
  'קניות': 'קניות',
  'ביגוד והנעלה': 'קניות',
  'אלקטרוניקה': 'קניות',
  'ריהוט': 'קניות',
  'דלק': 'תחבורה',
  'תחבורה': 'תחבורה',
  'רכב': 'תחבורה',
  'תחנות דלק': 'תחבורה',
  'חניה': 'תחבורה',
  'תחבורה ציבורית': 'תחבורה',
  'בילויים': 'בילויים',
  'קולנוע ותיאטרון': 'בילויים',
  'פנאי': 'בילויים',
  'ספורט': 'בילויים',
  'שירותים': 'שירותים',
  'חשמל': 'שירותים',
  'מים': 'שירותים',
  'גז': 'שירותים',
  'אינטרנט': 'שירותים',
  'טלפון': 'שירותים',
  'בריאות': 'בריאות',
  'רפואה': 'בריאות',
  'תרופות': 'בריאות',
  'בית מרקחת': 'בריאות',
  'חינוך': 'חינוך',
  'לימודים': 'חינוך',
  'ספרים': 'חינוך',
  'דיור': 'דיור',
  'שכירות': 'דיור',
  'ארנונה': 'דיור',
  'חובות': 'חובות',
  'הלוואות': 'חובות',
  'חיסכון': 'חיסכון',
  'השקעות': 'חיסכון',
};

// שלבי הייבוא
const STEPS = {
  UPLOAD: 'upload',
  MAPPING: 'mapping',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  COMPLETE: 'complete'
};

export default function ExcelImporter({ onComplete }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  
  // מיפוי עמודות
  const [mapping, setMapping] = useState({
    date: '',
    description: '',
    amount: '',
    type: '',
    category: '',
    account: '',
    payment_method: '',
  });

  const [previewData, setPreviewData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStats, setImportStats] = useState(null);
  const [userPrefs, setUserPrefs] = useState({ credit_card_billing_day: 10 });
  
  const { toast } = useToast();

  // טעינת העדפות משתמש
  React.useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const prefs = await base44.entities.UserPreferences.list();
        if (prefs.length > 0) {
          setUserPrefs(prefs[0]);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };
    fetchPrefs();
  }, []);

  // === שלב 1: העלאת קובץ ===
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // בדיקת גודל קובץ (מקסימום 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "❌ קובץ גדול מדי",
        description: "גודל הקובץ חורג מ-10MB. נסה קובץ קטן יותר.",
        variant: "destructive"
      });
      return;
    }

    // בדיקת סוג קובץ
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExt)) {
      toast({
        title: "❌ פורמט קובץ לא נתמך",
        description: "נתמכים רק קבצי Excel (.xlsx, .xls) או CSV (.csv)",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let workbook;

        if (file.name.endsWith('.csv')) {
          // עיבוד CSV
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          // עיבוד Excel
          workbook = XLSX.read(data, { type: 'binary' });
        }

        // קריאת כל הגיליונות
        let allDataRows = [];
        let foundHeaders = null;
        let sheetsProcessed = 0;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          if (!jsonData || jsonData.length === 0) continue;

          // זיהוי שורת כותרות (חיפוש שורה עם "תאריך עסקה")
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            const row = jsonData[i];
            const rowStr = row.map(cell => String(cell || '').trim().toLowerCase()).join(' ');
            
            if (rowStr.includes('תאריך עסקה') || 
                rowStr.includes('תאריך') && (rowStr.includes('בית עסק') || rowStr.includes('שם') || rowStr.includes('סכום'))) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            // אם לא נמצאה שורת כותרות מזוהה, נניח שהשורה הראשונה היא כותרות
            headerRowIndex = 0;
          }

          const headers = jsonData[headerRowIndex].map(h => String(h || '').trim());
          const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => 
            row.some(cell => cell !== '' && cell !== null && cell !== undefined)
          );

          if (dataRows.length > 0) {
            // שמירת הכותרות מהגיליון הראשון שנמצא
            if (!foundHeaders) {
              foundHeaders = headers;
            }
            
            allDataRows.push(...dataRows);
            sheetsProcessed++;
          }
        }

        if (!foundHeaders || allDataRows.length === 0) {
          throw new Error("לא הצלחנו לזהות את טבלת העסקאות בקובץ. ודא שהקובץ הוא קובץ דוח מקורי ונסה שוב.");
        }

        setHeaders(foundHeaders);
        setRawData(allDataRows);
        
        // זיהוי אוטומטי של עמודות
        autoDetectColumns(foundHeaders);
        
        setStep(STEPS.MAPPING);
        toast({
          title: "✅ הקובץ נטען בהצלחה",
          description: `נמצאו ${allDataRows.length} שורות מ-${sheetsProcessed} גיליונות`
        });

      } catch (error) {
        console.error("File parsing error:", error);
        toast({
          title: "❌ שגיאה בקריאת הקובץ",
          description: error.message || "נסה קובץ אחר או צור קשר לתמיכה",
          variant: "destructive"
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "❌ שגיאה בטעינת הקובץ",
        description: "לא הצלחנו לקרוא את הקובץ. נסה שוב.",
        variant: "destructive"
      });
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // זיהוי אוטומטי של עמודות לפי שמות נפוצים
  const autoDetectColumns = (cols) => {
    const detected = {
      date: '',
      description: '',
      amount: '',
      type: '',
      category: '',
      account: '',
      payment_method: '',
    };

    cols.forEach((col, idx) => {
      const lower = col.toLowerCase();
      
      // תאריך - עדיפות ל"תאריך עסקה" מ-MAX
      if (lower.includes('תאריך עסקה') && !detected.date) {
        detected.date = String(idx);
      }
      else if ((lower.includes('תאריך') || lower.includes('date')) && !detected.date) {
        detected.date = String(idx);
      }
      // תיאור - "שם בית העסק" מ-MAX
      else if ((lower.includes('שם בית') || lower.includes('בית עסק') || lower.includes('בית העסק')) && !detected.description) {
        detected.description = String(idx);
      }
      else if ((lower.includes('תיאור') || lower.includes('פירוט') || lower.includes('description') || lower.includes('memo')) && !detected.description) {
        detected.description = String(idx);
      }
      // סכום - עדיפות ל"סכום חיוב" מ-MAX
      else if (lower.includes('סכום חיוב') && !detected.amount) {
        detected.amount = String(idx);
      }
      else if ((lower.includes('סכום') || lower.includes('amount') || lower.includes('sum') || lower.includes('סה"כ')) && !detected.amount) {
        detected.amount = String(idx);
      }
      // סוג
      else if ((lower.includes('סוג עסקה') || lower.includes('סוג') || lower.includes('type') || lower.includes('זכות') || lower.includes('חובה')) && !detected.type) {
        detected.type = String(idx);
      }
      // קטגוריה
      else if ((lower.includes('קטגוריה') || lower.includes('category')) && !detected.category) {
        detected.category = String(idx);
      }
      // חשבון
      else if ((lower.includes('חשבון') || lower.includes('account') || lower.includes('בנק')) && !detected.account) {
        detected.account = String(idx);
      }
      // אמצעי תשלום
      else if ((lower.includes('אמצעי תשלום') || lower.includes('תשלום') || lower.includes('payment method')) && !detected.payment_method) {
        detected.payment_method = String(idx);
      }
    });

    setMapping(detected);
  };

  // === שלב 2: מיפוי עמודות ===
  const handleMappingChange = (field, value) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const proceedToPreview = () => {
    // בדיקת שדות חובה
    if (!mapping.date || !mapping.amount) {
      toast({
        title: "⚠️ שדות חובה חסרים",
        description: "יש למפות לפחות תאריך וסכום",
        variant: "destructive"
      });
      return;
    }

    // בניית נתונים לתצוגה מקדימה
    const preview = [];
    const errors = [];

    const dataStart = hasHeaderRow ? 0 : 0;
    rawData.forEach((row, idx) => {
      try {
        const transaction = buildTransaction(row, idx + dataStart);
        if (transaction) {
          preview.push({ ...transaction, rowIndex: idx + 1 });
        }
      } catch (error) {
        errors.push({
          row: idx + 1,
          error: error.message
        });
      }
    });

    setPreviewData(preview);
    setValidationErrors(errors);
    setStep(STEPS.PREVIEW);
  };

  // בניית אובייקט עסקה משורה
  const buildTransaction = (row, rowIndex) => {
    const getValue = (colIndex) => {
      if (colIndex === '' || colIndex === null || colIndex === undefined) return '';
      const val = row[parseInt(colIndex)];
      return val !== undefined && val !== null ? String(val).trim() : '';
    };

    // תאריך - חובה
    let dateStr = getValue(mapping.date);
    if (!dateStr) {
      throw new Error("חסר תאריך");
    }
    const parsedDate = parseDate(dateStr);
    if (!parsedDate) {
      throw new Error(`תאריך לא תקין: ${dateStr}`);
    }

    // סכום - חובה
    let amountStr = getValue(mapping.amount);
    if (!amountStr) {
      throw new Error("חסר סכום");
    }
    const amount = parseAmount(amountStr);
    if (amount === null || isNaN(amount) || amount <= 0) {
      throw new Error(`סכום לא תקין: ${amountStr}`);
    }

    // תיאור
    const description = getValue(mapping.description) || `תנועה ${rowIndex + 1}`;

    // סוג (הכנסה/הוצאה) - ברירת מחדל הוצאה (קבצי MAX הם כרטיסי אשראי)
    let type = 'expense';
    if (mapping.type) {
      const typeStr = getValue(mapping.type).toLowerCase();
      // רק אם יש אינדיקציה ברורה להכנסה - נשנה להכנסה
      if (typeStr.includes('הכנסה') || typeStr.includes('income') || typeStr.includes('זכות') || typeStr.includes('credit')) {
        type = 'income';
      }
      // בכל מקרה אחר - הוצאה
    }

    // אמצעי תשלום
    let payment_method = 'כרטיס_אשראי'; // ברירת מחדל לקבצי MAX
    if (mapping.payment_method) {
      const pmStr = getValue(mapping.payment_method);
      if (pmStr) {
        payment_method = pmStr;
      }
    }

    // קטגוריה - מיפוי חכם מקטגוריות MAX לקטגוריות המערכת
    let category = type === 'income' ? 'אחר_הכנסה' : 'אחר_הוצאה';
    
    if (mapping.category) {
      const catStr = getValue(mapping.category).trim();
      
      if (catStr) {
        // בדיקה אם זו קטגוריה תקפה ישירות
        if (ALL_CATEGORIES.includes(catStr)) {
          category = catStr;
        } 
        // ניסיון מיפוי מקטגוריות MAX
        else {
          const lowerCat = catStr.toLowerCase();
          
          // חיפוש במיפוי הישיר
          for (const [maxCat, systemCat] of Object.entries(MAX_CATEGORY_MAPPING)) {
            if (lowerCat.includes(maxCat.toLowerCase())) {
              category = systemCat;
              break;
            }
          }
          
          // אם לא נמצא - ניסיון זיהוי לפי מילות מפתח
          if (category === 'אחר_הוצאה') {
            if (lowerCat.includes('מזון') || lowerCat.includes('אוכל') || lowerCat.includes('מסעד') || lowerCat.includes('סופר')) {
              category = 'מזון_ומשקאות';
            } else if (lowerCat.includes('קני') || lowerCat.includes('ביגוד') || lowerCat.includes('חנות')) {
              category = 'קניות';
            } else if (lowerCat.includes('דלק') || lowerCat.includes('תחבור') || lowerCat.includes('רכב') || lowerCat.includes('חניה')) {
              category = 'תחבורה';
            } else if (lowerCat.includes('ביל') || lowerCat.includes('פנאי') || lowerCat.includes('קולנוע') || lowerCat.includes('ספורט')) {
              category = 'בילויים';
            } else if (lowerCat.includes('חשמל') || lowerCat.includes('מים') || lowerCat.includes('גז') || lowerCat.includes('אינטרנט') || lowerCat.includes('טלפון')) {
              category = 'שירותים';
            } else if (lowerCat.includes('בריאות') || lowerCat.includes('רפוא') || lowerCat.includes('תרופ')) {
              category = 'בריאות';
            } else if (lowerCat.includes('חינוך') || lowerCat.includes('לימוד') || lowerCat.includes('ספר')) {
              category = 'חינוך';
            } else if (lowerCat.includes('דיור') || lowerCat.includes('שכירות') || lowerCat.includes('ארנונה')) {
              category = 'דיור';
            }
          }
        }
      }
    }
    
    // וידוא שהקטגוריה מתאימה לסוג העסקה
    if (type === 'income' && !INCOME_CATEGORIES.includes(category)) {
      category = 'אחר_הכנסה';
    } else if (type === 'expense' && !EXPENSE_CATEGORIES.includes(category)) {
      category = 'אחר_הוצאה';
    }

    // חישוב תאריך חיוב לכרטיס אשראי
    let billing_date = '';
    if (payment_method === 'כרטיס_אשראי' && parsedDate) {
      const transactionDate = new Date(parsedDate);
      const billingDay = userPrefs.credit_card_billing_day || 10;
      
      let billingDate = new Date(transactionDate);
      billingDate.setDate(billingDay);
      
      // אם העסקה אחרי יום החיוב, מעבר לחודש הבא
      if (transactionDate.getDate() >= billingDay) {
        billingDate.setMonth(billingDate.getMonth() + 1);
      }
      
      billing_date = billingDate.toISOString().split('T')[0];
    }

    // יצירת העסקה ועיבוד תאריך חיוב
    const transaction = {
      type: type,
      amount: amount,
      category: category,
      description: description,
      date: parsedDate,
      payment_method: payment_method,
      billing_date: billing_date,
      is_recurring: false
    };

    // עיבוד נוסף לזיהוי אוטומטי של כרטיס אשראי וחישוב תאריך חיוב
    return processImportedTransaction(transaction, userPrefs.credit_card_billing_day);
  };

  // המרת תאריך לפורמט YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // ניסיון לפרסר תאריך מ-Excel (serial number)
    if (!isNaN(dateStr) && Number(dateStr) > 1000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + Number(dateStr) * 86400000);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // ניסיון לפרסר פורמטים נפוצים
    // MAX משתמש בפורמט DD-MM-YYYY (07-08-2025)
    const formats = [
      {
        regex: /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/,  // DD/MM/YYYY או DD-MM-YYYY (dayFirst)
        parser: (match) => {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          return { day, month, year };
        }
      },
      {
        regex: /(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/,  // YYYY-MM-DD
        parser: (match) => {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);
          return { day, month, year };
        }
      }
    ];

    for (const format of formats) {
      const match = String(dateStr).match(format.regex);
      if (match) {
        const { day, month, year } = format.parser(match);

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900 && year < 2100) {
          const yearStr = String(year);
          const monthStr = String(month).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
      }
    }

    // ניסיון אחרון עם Date constructor
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // ignore
    }

    return null;
  };

  // המרת סכום למספר
  const parseAmount = (amountStr) => {
    if (!amountStr) return null;
    
    // הסרת סימנים מיוחדים (₪, $, פסיקים)
    let cleaned = String(amountStr)
      .replace(/[₪$,\s]/g, '')
      .replace(/[()]/g, ''); // הסרת סוגריים (עבור מספרים שליליים)
    
    // החלפת פסיק בנקודה עשרונית
    cleaned = cleaned.replace(',', '.');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.abs(num); // תמיד ערך חיובי
  };

  // === שלב 3: תצוגה מקדימה ===
  const handleConfirmImport = async () => {
    setStep(STEPS.IMPORTING);

    try {
      // ייבוא בקבוצות של 50 עסקאות - שימוש באותו flow כמו עסקה ידנית
      const batchSize = 50;
      let imported = 0;

      for (let i = 0; i < previewData.length; i += batchSize) {
        const batch = previewData.slice(i, i + batchSize).map(t => ({
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
          payment_method: t.payment_method || 'מזומן',
          billing_date: t.billing_date || '',
          is_recurring: false
        }));

        await base44.entities.Transaction.bulkCreate(batch);
        imported += batch.length;
      }

      setImportStats({
        total: rawData.length,
        imported,
        skipped: validationErrors.length
      });

      setStep(STEPS.COMPLETE);

      toast({
        title: `✅ הייבוא הושלם בהצלחה`,
        description: `נוספו ${imported} עסקאות חדשות${validationErrors.length > 0 ? ` (${validationErrors.length} שורות נדחו)` : ''}`
      });

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "❌ שגיאה בייבוא",
        description: "לא הצלחנו לשמור את העסקאות. נסה שוב.",
        variant: "destructive"
      });
      setStep(STEPS.PREVIEW);
    }
  };

  const handleClose = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setMapping({
      date: '',
      description: '',
      amount: '',
      type: '',
      category: '',
      account: '',
      payment_method: '',
    });
    setPreviewData([]);
    setValidationErrors([]);
    setImportStats(null);
    setHasHeaderRow(true);
    if (onComplete) onComplete();
  };

  // === רינדור לפי שלב ===
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            ייבוא תנועות מאקסל
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[
            { id: STEPS.UPLOAD, label: 'העלאה' },
            { id: STEPS.MAPPING, label: 'מיפוי' },
            { id: STEPS.PREVIEW, label: 'תצוגה' },
          ].map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 ${
                step === s.id ? 'text-blue-600 font-semibold' : 
                [STEPS.COMPLETE, STEPS.IMPORTING].includes(step) || 
                (step === STEPS.PREVIEW && s.id !== STEPS.PREVIEW) ||
                (step === STEPS.MAPPING && s.id === STEPS.UPLOAD) ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.id ? 'bg-blue-100 dark:bg-blue-900' : 
                  [STEPS.COMPLETE, STEPS.IMPORTING].includes(step) || 
                  (step === STEPS.PREVIEW && s.id !== STEPS.PREVIEW) ||
                  (step === STEPS.MAPPING && s.id === STEPS.UPLOAD) ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-sm hidden sm:inline">{s.label}</span>
              </div>
              {idx < 2 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* שלב 1: העלאת קובץ */}
        {step === STEPS.UPLOAD && (
          <div className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-semibold mb-1">איך זה עובד?</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>העלה קובץ Excel או CSV מהמחשב</li>
                  <li>מפה את העמודות (תאריך, סכום, תיאור)</li>
                  <li>בדוק את התצוגה המקדימה</li>
                  <li>אשר והעסקאות ייווספו למעקב שלך</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div>
              <Label className="text-gray-900 dark:text-gray-200 text-base font-semibold">בחר קובץ</Label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="mt-2 dark:bg-gray-700 cursor-pointer h-14 text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                קבצים נתמכים: Excel (.xlsx, .xls), CSV (.csv) | מקסימום 10MB
              </p>
            </div>
          </div>
        )}

        {/* שלב 2: מיפוי עמודות */}
        {step === STEPS.MAPPING && (
          <div className="space-y-4">
            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-semibold mb-1">מפה את העמודות בקובץ לשדות במערכת</div>
                לפחות <strong>תאריך</strong> ו<strong>סכום</strong> הם שדות חובה.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="hasHeader" 
                checked={hasHeaderRow}
                onCheckedChange={setHasHeaderRow}
              />
              <Label htmlFor="hasHeader" className="text-sm cursor-pointer">
                השורה הראשונה היא כותרות
              </Label>
            </div>

            {/* תצוגת כותרות */}
            {headers.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">עמודות בקובץ:</p>
                <div className="flex flex-wrap gap-1">
                  {headers.map((h, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {h || `עמודה ${idx + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* תאריך - חובה */}
              <div>
                <Label className="text-sm font-semibold">
                  תאריך <span className="text-red-500">*</span>
                </Label>
                <Select value={mapping.date} onValueChange={(val) => handleMappingChange('date', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת תאריך" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* סכום - חובה */}
              <div>
                <Label className="text-sm font-semibold">
                  סכום <span className="text-red-500">*</span>
                </Label>
                <Select value={mapping.amount} onValueChange={(val) => handleMappingChange('amount', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת סכום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* תיאור */}
              <div>
                <Label className="text-sm">תיאור</Label>
                <Select value={mapping.description} onValueChange={(val) => handleMappingChange('description', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת תיאור" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* סוג (הכנסה/הוצאה) */}
              <div>
                <Label className="text-sm">סוג (הכנסה/הוצאה)</Label>
                <Select value={mapping.type} onValueChange={(val) => handleMappingChange('type', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* קטגוריה */}
              <div>
                <Label className="text-sm">קטגוריה</Label>
                <Select value={mapping.category} onValueChange={(val) => handleMappingChange('category', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* אמצעי תשלום */}
              <div>
                <Label className="text-sm">אמצעי תשלום</Label>
                <Select value={mapping.payment_method} onValueChange={(val) => handleMappingChange('payment_method', val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר עמודת אמצעי תשלום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>לא נבחר (ברירת מחדל: כרטיס אשראי)</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `עמודה ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                💳 <strong>עסקאות כרטיס אשראי:</strong> תאריך החיוב יחושב אוטומטית לפי יום החיוב שהגדרת (יום {userPrefs.credit_card_billing_day})
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(STEPS.UPLOAD)} className="flex-1">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזור
              </Button>
              <Button onClick={proceedToPreview} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Eye className="w-4 h-4 ml-2" />
                תצוגה מקדימה
              </Button>
            </div>
          </div>
        )}

        {/* שלב 3: תצוגה מקדימה */}
        {step === STEPS.PREVIEW && (
          <div className="space-y-4">
            {/* סטטיסטיקות */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="text-xs text-green-600 dark:text-green-400">שורות תקינות</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{previewData.length}</div>
              </div>
              {validationErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="text-xs text-red-600 dark:text-red-400">שורות בעייתיות</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{validationErrors.length}</div>
                </div>
              )}
            </div>

            {/* שגיאות */}
            {validationErrors.length > 0 && (
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-sm">
                  <div className="font-semibold text-red-700 dark:text-red-300 mb-1">
                    {validationErrors.length} שורות לא יובאו
                  </div>
                  <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
                    {validationErrors.slice(0, 5).map((err, idx) => (
                      <div key={idx} className="text-red-600 dark:text-red-400">
                        שורה {err.row}: {err.error}
                      </div>
                    ))}
                    {validationErrors.length > 5 && (
                      <div className="text-red-500">ועוד {validationErrors.length - 5}...</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* תצוגה מקדימה */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">תצוגה מקדימה - 10 שורות ראשונות</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewData.slice(0, 10).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{t.description}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <span>{t.date}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      </div>
                    </div>
                    <div className={`font-bold mr-2 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                {previewData.length > 10 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                    ועוד {previewData.length - 10} עסקאות...
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(STEPS.MAPPING)} className="flex-1">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזור למיפוי
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={previewData.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                אשר ויבא {previewData.length} עסקאות
              </Button>
            </div>
          </div>
        )}

        {/* שלב 4: מייבא */}
        {step === STEPS.IMPORTING && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">מייבא עסקאות...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">זה ייקח רק כמה שניות</p>
          </div>
        )}

        {/* שלב 5: הושלם */}
        {step === STEPS.COMPLETE && importStats && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">הייבוא הושלם בהצלחה! 🎉</h3>
            <p className="text-gray-600 dark:text-gray-400">
              יובאו <strong>{importStats.imported}</strong> עסקאות חדשות למעקב שלך
            </p>
            {importStats.skipped > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                {importStats.skipped} שורות נדחו בגלל שגיאות
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}