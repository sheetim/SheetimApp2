import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function SmartImport({ onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

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
                  date: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "number" },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status === "success" && extractionResult.output?.transactions) {
        const transactions = extractionResult.output.transactions;

        // Enhance with AI categorization
        const enhancedTransactions = await Promise.all(
          transactions.slice(0, 20).map(async (t) => {
            try {
              const aiResult = await base44.integrations.Core.InvokeLLM({
                prompt: `קטלג את העסקה הבאה לקטגוריה המתאימה ביותר.
                
תיאור: ${t.description}
סכום: ${t.amount}
סוג: ${t.type}

קטגוריות אפשריות להכנסה בעברית: משכורת, עסק_עצמאי, השקעות, אחר_הכנסה
קטגוריות אפשריות להוצאה בעברית: מזון_ומשקאות, קניות, תחבורה, בילויים, שירותים, בריאות, חינוך, דיור, חובות, חיסכון, אחר_הוצאה

חשוב: החזר רק את שם הקטגוריה בדיוק כמו שהוא בעברית, ותיאור משופר בעברית.

החזר רק את שם הקטגוריה המתאימה ותיאור משופר קצר.`,
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
                category: aiResult.category,
                description: aiResult.enhanced_description || t.description
              };
            } catch (error) {
              return t;
            }
          })
        );

        // Create transactions
        await base44.entities.Transaction.bulkCreate(enhancedTransactions);

        setResults({
          success: true,
          count: enhancedTransactions.length,
          transactions: enhancedTransactions
        });

        toast.success(`${enhancedTransactions.length} עסקאות יובאו בהצלחה!`);
        onComplete?.();
      } else {
        throw new Error(extractionResult.details || "נכשל בחילוץ הנתונים");
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
      toast.error("שגיאה בייבוא הקובץ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Upload className="w-5 h-5" />
          ייבוא עסקאות חכם
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertDescription className="text-sm dark:text-gray-300">
            💡 העלה קובץ CSV/Excel מהבנק - המערכת תזהה, תקטלג ותשפר את העסקאות באופן אוטומטי
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Input
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="dark:bg-gray-700 dark:border-gray-600"
          />

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full md-ripple"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מעבד קובץ...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                ייבא ועבד
              </>
            )}
          </Button>
        </div>

        {results && (
          <Alert className={results.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <AlertDescription className="flex items-start gap-2">
              {results.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">הייבוא הושלם בהצלחה!</p>
                    <p className="text-sm text-green-700 mt-1">
                      {results.count} עסקאות יובאו, קוטלגו ושופרו
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">שגיאה בייבוא</p>
                    <p className="text-sm text-red-700 mt-1">{results.error}</p>
                  </div>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}