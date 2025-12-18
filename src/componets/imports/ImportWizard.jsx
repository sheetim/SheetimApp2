import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const sourceOptions = [
  { id: 'bank', icon: Building2, label: 'דוח בנק', desc: 'קובץ CSV מהבנק' },
  { id: 'credit', icon: CreditCard, label: 'כרטיס אשראי', desc: 'דוח אשראי חודשי' },
  { id: 'manual', icon: FileText, label: 'קובץ ידני', desc: 'אקסל או CSV שהכנת' }
];

export default function ImportWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({
    date: '',
    description: '',
    amount: '',
    category: '',
    type: ''
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const queryClient = useQueryClient();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1, 6).map(line => {
          // Handle CSV with quoted fields
          const cells = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          return cells;
        });
        
        setPreview({ headers, rows, totalRows: lines.length - 1 });
        
        // Auto-detect columns
        const autoMapping = {};
        headers.forEach((header, idx) => {
          const lower = header.toLowerCase();
          if (lower.includes('date') || lower.includes('תאריך')) autoMapping.date = idx.toString();
          if (lower.includes('description') || lower.includes('תיאור') || lower.includes('פירוט') || lower.includes('שם')) autoMapping.description = idx.toString();
          if (lower.includes('amount') || lower.includes('סכום') || lower.includes('חיוב')) autoMapping.amount = idx.toString();
          if (lower.includes('category') || lower.includes('קטגוריה')) autoMapping.category = idx.toString();
          if (lower.includes('type') || lower.includes('סוג') || lower.includes('חובה')) autoMapping.type = idx.toString();
        });
        setMapping(autoMapping);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file || mapping.date === '' || mapping.amount === '') {
      toast.error('יש למפות לפחות תאריך וסכום');
      return;
    }

    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      const transactions = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cells = [];
        let current = '';
        let inQuotes = false;
        for (const char of lines[i]) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current.trim());

        const dateIdx = parseInt(mapping.date);
        const amountIdx = parseInt(mapping.amount);
        const descIdx = mapping.description !== '' ? parseInt(mapping.description) : null;
        
        const rawAmount = cells[amountIdx]?.replace(/[^0-9.-]/g, '').replace(',', '.') || '0';
        let amount = parseFloat(rawAmount) || 0;
        
        // Determine type based on amount sign
        let type = 'expense';
        if (amount > 0) {
          type = 'income';
        } else {
          amount = Math.abs(amount);
        }
        
        const transaction = {
          date: cells[dateIdx],
          amount,
          description: descIdx !== null ? cells[descIdx] : '',
          category: type === 'income' ? 'אחר_הכנסה' : 'אחר_הוצאה',
          type
        };
        
        if (transaction.date && transaction.amount > 0) {
          transactions.push(transaction);
        }
      }
      
      if (transactions.length === 0) {
        throw new Error('לא נמצאו עסקאות תקינות בקובץ');
      }
      
      await base44.entities.Transaction.bulkCreate(transactions);
      
      setImportResult({
        success: true,
        count: transactions.length,
        dateRange: {
          from: transactions[transactions.length - 1]?.date,
          to: transactions[0]?.date
        }
      });
      
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['budgets']);
      
      toast.success(`✅ ${transactions.length} עסקאות נטענו בהצלחה – הדשבורד עודכן`);
      
      setStep(4);
    } catch (error) {
      console.error(error);
      setImportResult({
        success: false,
        error: error.message
      });
      toast.error('שגיאה בייבוא הקובץ');
    } finally {
      setImporting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">בחר מקור הנתונים</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">מאיפה אתה רוצה לייבא?</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sourceOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = source === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSource(option.id)}
              className={`p-4 rounded-xl border-2 transition-all text-right ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</p>
            </button>
          );
        })}
      </div>
      
      {source && (
        <div className="pt-4">
          <Label className="text-sm font-medium mb-2 block">בחר קובץ CSV</Label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="dark:bg-gray-700"
          />
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">מיפוי עמודות</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">התאם כל עמודה לשדה המתאים</p>
      </div>

      {preview && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">עמודת תאריך *</Label>
              <Select value={mapping.date} onValueChange={(val) => setMapping({...mapping, date: val})}>
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue placeholder="בחר עמודה" />
                </SelectTrigger>
                <SelectContent>
                  {preview.headers.map((header, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">עמודת סכום *</Label>
              <Select value={mapping.amount} onValueChange={(val) => setMapping({...mapping, amount: val})}>
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue placeholder="בחר עמודה" />
                </SelectTrigger>
                <SelectContent>
                  {preview.headers.map((header, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-xs text-gray-700 dark:text-gray-300">עמודת תיאור (אופציונלי)</Label>
              <Select value={mapping.description} onValueChange={(val) => setMapping({...mapping, description: val})}>
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue placeholder="בחר עמודה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא</SelectItem>
                  {preview.headers.map((header, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">תצוגה מקדימה</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {preview.headers.slice(0, 5).map((header, idx) => (
                      <th key={idx} className="p-2 text-right text-gray-700 dark:text-gray-300">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 3).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700">
                      {row.slice(0, 5).map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2 text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">סיכום לפני ייבוא</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">בדוק שהכל נראה תקין</p>
      </div>

      {preview && (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{file?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {preview.totalRows} שורות יוובאו
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">עמודת תאריך</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {preview.headers[parseInt(mapping.date)] || 'לא נבחר'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">עמודת סכום</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {preview.headers[parseInt(mapping.amount)] || 'לא נבחר'}
              </p>
            </div>
          </div>

          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              המערכת תזהה אוטומטית הכנסות והוצאות לפי סימן הסכום
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center py-8">
      {importResult?.success ? (
        <>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">הייבוא הושלם בהצלחה!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {importResult.count} עסקאות נוספו למערכת
          </p>
          {importResult.dateRange && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              טווח תאריכים: {importResult.dateRange.from} - {importResult.dateRange.to}
            </p>
          )}
          <Button onClick={onComplete} className="mt-6 bg-green-600 hover:bg-green-700">
            סיים וחזור לדשבורד
          </Button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">שגיאה בייבוא</h3>
          <p className="text-gray-600 dark:text-gray-400">{importResult?.error}</p>
          <Button onClick={() => setStep(1)} variant="outline" className="mt-6">
            נסה שוב
          </Button>
        </>
      )}
    </div>
  );

  const canProceed = () => {
    if (step === 1) return source && file && preview;
    if (step === 2) return mapping.date !== '' && mapping.amount !== '';
    if (step === 3) return true;
    return false;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-0">
      <CardHeader className="border-b dark:border-gray-700 p-4">
        <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
          <Upload className="w-5 h-5 text-purple-600" />
          אשף ייבוא עסקאות
        </CardTitle>
        
        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step 
                    ? 'bg-purple-600 text-white' 
                    : s < step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => step === 1 ? onCancel?.() : setStep(step - 1)}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              {step === 1 ? 'ביטול' : 'הקודם'}
            </Button>
            
            {step === 3 ? (
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מייבא...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    ייבא עכשיו
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                המשך
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}