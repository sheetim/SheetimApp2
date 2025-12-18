import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const bankTemplates = {
  'leumi': { name: 'בנק לאומי', dateCol: 'תאריך', amountCol: 'סכום', descCol: 'תיאור' },
  'poalim': { name: 'בנק הפועלים', dateCol: 'תאריך ערך', amountCol: 'סכום', descCol: 'פרטים' },
  'discount': { name: 'בנק דיסקונט', dateCol: 'תאריך', amountCol: 'סכום', descCol: 'תאור' },
  'mizrahi': { name: 'מזרחי טפחות', dateCol: 'תאריך', amountCol: 'סכום', descCol: 'תאור הפעולה' },
  'generic': { name: 'כללי', dateCol: 'date', amountCol: 'amount', descCol: 'description' },
};

export default function OnboardingImport({ onComplete, onSkip }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setProgress('מעלה קובץ...');
    setError(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setProgress('מנתח נתונים...');

      // Extract data with AI
      const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD" },
                  description: { type: "string" },
                  amount: { type: "number", description: "סכום חיובי" },
                  type: { type: "string", enum: ["income", "expense"] }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status !== "success" || !extractionResult.output?.transactions?.length) {
        throw new Error("לא הצלחנו לזהות עסקאות בקובץ");
      }

      const transactions = extractionResult.output.transactions;
      setProgress(`מקטלג ${transactions.length} עסקאות...`);

      // Enhance with AI categorization (batch of 20)
      const enhancedTransactions = await Promise.all(
        transactions.slice(0, 50).map(async (t, idx) => {
          try {
            if (idx % 10 === 0) {
              setProgress(`מקטלג עסקאות... (${idx}/${Math.min(50, transactions.length)})`);
            }

            const aiResult = await base44.integrations.Core.InvokeLLM({
              prompt: `קטלג את העסקה הבאה לקטגוריה המתאימה ביותר.
תיאור: ${t.description}
סכום: ${t.amount}
סוג: ${t.type}

קטגוריות להכנסה: משכורת, עסק_עצמאי, השקעות, אחר_הכנסה
קטגוריות להוצאה: מזון_ומשקאות, קניות, תחבורה, בילויים, שירותים, בריאות, חינוך, דיור, חובות, חיסכון, אחר_הוצאה

החזר רק JSON עם category (בדיוק כמו הרשימה) ו-enhanced_description (תיאור משופר קצר בעברית).`,
              response_json_schema: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  enhanced_description: { type: "string" }
                }
              }
            });

            return {
              ...t,
              category: aiResult.category || (t.type === 'expense' ? 'אחר_הוצאה' : 'אחר_הכנסה'),
              description: aiResult.enhanced_description || t.description
            };
          } catch {
            return {
              ...t,
              category: t.type === 'expense' ? 'אחר_הוצאה' : 'אחר_הכנסה'
            };
          }
        })
      );

      setProgress('שומר עסקאות...');

      // Create transactions in bulk
      await base44.entities.Transaction.bulkCreate(enhancedTransactions);

      // Calculate stats
      const totalIncome = enhancedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = enhancedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setResult({
        count: enhancedTransactions.length,
        totalIncome,
        totalExpenses
      });

      toast.success(`🎉 ${enhancedTransactions.length} עסקאות יובאו בהצלחה!`);

    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'שגיאה בייבוא הקובץ');
      toast.error('שגיאה בייבוא');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="text-center px-4">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl"
      >
        <FileSpreadsheet className="w-10 h-10 text-white" />
      </motion.div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        {result ? '🎉 הייבוא הושלם!' : 'בוא נמלא את החשבון'}
      </h1>
      <p className="text-base text-gray-300 mb-6 max-w-sm mx-auto leading-relaxed">
        {result 
          ? `יבאנו ${result.count} עסקאות. עכשיו תוכל לראות את התמונה המלאה!`
          : 'העלה קובץ Excel או CSV מהבנק ותראה גרפים מלאים תוך שניות'
        }
      </p>

      {!result ? (
        <div className="space-y-4 max-w-sm mx-auto">
          {/* File Input */}
          <div className="relative">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className={`flex items-center justify-center gap-3 w-full p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                file 
                  ? 'border-green-400 bg-green-500/10' 
                  : 'border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50'
              }`}
            >
              {file ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 truncate max-w-[200px]">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-white/70" />
                  <span className="text-white/70">בחר קובץ Excel או CSV</span>
                </>
              )}
            </label>
          </div>

          {/* Error */}
          {error && (
            <Alert className="bg-red-500/20 border-red-500/50 text-right">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {loading && progress && (
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{progress}</span>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 font-semibold text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                מייבא...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 ml-2" />
                ייבא ונתח
              </>
            )}
          </Button>

          {/* Supported Banks */}
          <p className="text-xs text-gray-400">
            תומך בקבצים מ: לאומי, פועלים, דיסקונט, מזרחי טפחות ועוד
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-sm mx-auto">
          {/* Success Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
              <p className="text-xs text-green-300">הכנסות</p>
              <p className="text-xl font-bold text-green-400">₪{result.totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
              <p className="text-xs text-red-300">הוצאות</p>
              <p className="text-xl font-bold text-red-400">₪{result.totalExpenses.toLocaleString()}</p>
            </div>
          </div>

          <Button
            onClick={onComplete}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-lg"
          >
            <CheckCircle2 className="w-5 h-5 ml-2" />
            המשך לדשבורד
          </Button>
        </div>
      )}

      {/* Skip Button */}
      {!result && (
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={loading}
          className="w-full mt-4 text-white/60 hover:text-white hover:bg-white/5"
        >
          דלג והתחל ריק
        </Button>
      )}
    </div>
  );
}