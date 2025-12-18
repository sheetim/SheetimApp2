import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileImage, X, Check, Loader2, Sparkles, AlertCircle, Edit2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INVESTMENT_TYPES = [
  { value: "מניות", label: "מניות" },
  { value: "אג״ח", label: 'אג"ח' },
  { value: "קרנות_נאמנות", label: "קרנות נאמנות" },
  { value: "קריפטו", label: "קריפטו" },
  { value: "נדל״ן", label: 'נדל"ן' },
  { value: "פיקדונות", label: "פיקדונות" },
  { value: "אחר", label: "אחר" },
];

export default function SmartPortfolioScan({ onImport, onClose }) {
  const [step, setStep] = useState("upload"); // upload, processing, review, importing
  const [imagePreviews, setImagePreviews] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [detectedBroker, setDetectedBroker] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { toast } = useToast();

  const confidenceConfig = {
    high: { color: "text-green-600 bg-green-100 dark:bg-green-900/30", label: "זיהוי מלא", icon: "✓" },
    medium: { color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30", label: "זיהוי חלקי", icon: "?" },
    low: { color: "text-red-600 bg-red-100 dark:bg-red-900/30", label: "דורש בדיקה", icon: "!" }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Compress if larger than 1600px for better performance
          const maxSize = 1600;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      // Generate previews for all files
      const previews = await Promise.all(
        files.map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        }))
      );
      setImagePreviews(previews);

      // Process all images
      setProcessingStatus({ current: 0, total: files.length });
      const allInvestments = [];

      for (let i = 0; i < files.length; i++) {
        setProcessingStatus({ current: i + 1, total: files.length });
        
        try {
          // Compress before upload
          const compressedFile = await compressImage(files[i]);
          console.log(`[${i + 1}/${files.length}] Compressed from ${(files[i].size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          
          const investments = await processImage(compressedFile, 0, true);
          if (investments && investments.length > 0) {
            allInvestments.push(...investments);
          }
        } catch (error) {
          console.error(`Error processing file ${i + 1}:`, error);
          toast({
            title: `שגיאה בתמונה ${i + 1}`,
            description: "ממשיך לתמונות הבאות...",
            variant: "destructive"
          });
        }
      }

      if (allInvestments.length > 0) {
        setExtractedData(allInvestments);
        setStep("review");
        toast({
          title: `✅ זוהו ${allInvestments.length} השקעות`,
          description: `מ-${files.length} תמונות`
        });
      } else {
        toast({
          title: "לא זוהו השקעות",
          description: "נסה תמונות ברורות יותר",
          variant: "destructive"
        });
        setStep("upload");
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast({
        title: "שגיאה בעיבוד התמונות",
        variant: "destructive"
      });
      setStep("upload");
    }
  };

  const processImage = async (file, retryCount = 0, isMultiple = false) => {
    const MAX_RETRIES = 2;
    if (!isMultiple) {
      setStep("processing");
    }

    try {
      // Upload the file first with retry
      console.log(`Uploading file... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      let uploadResult;
      try {
        uploadResult = await base44.integrations.Core.UploadFile({ file });
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        if (retryCount < MAX_RETRIES) {
          console.log("Retrying upload...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return processImage(file, retryCount + 1);
        }
        throw new Error("שגיאה בהעלאת הקובץ. בדוק את החיבור לאינטרנט.");
      }

      const file_url = uploadResult?.file_url;
      
      if (!file_url) {
        if (retryCount < MAX_RETRIES) {
          console.log("No file URL received, retrying...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return processImage(file, retryCount + 1);
        }
        throw new Error("לא התקבל קישור לקובץ. נסה שוב.");
      }

      console.log("File uploaded successfully:", file_url);
      console.log(`Starting AI extraction (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      
      // Add timeout wrapper with retry logic
      const extractWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT")), 120000)
        );
        
        const extractPromise = base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert OCR and financial data extraction AI. Extract investment portfolio data from this image with maximum precision.

🔴 CRITICAL RULES:

1. CURRENCY DETECTION (MOST IMPORTANT):
   - $ symbol = "USD" (NOT ILS!)
   - ₪ symbol = "ILS" 
   - € symbol = "EUR"
   - £ symbol = "GBP"
   - Look at ACTUAL symbols in image, don't guess!

2. EXTRACT EXACT NUMBERS:
   - Remove only currency symbols
   - Keep decimal points as-is
   - Don't round or calculate anything
   - Example: "$2,583.56" → 2583.56 with currency: "USD"

3. REQUIRED FIELDS TO FIND:
   - Investment name/symbol (GOOGL, AAPL, etc.)
   - Quantity (number of shares/units)
   - Purchase price (מחיר קנייה / Avg Cost / Cost Basis)
   - Current price (מחיר נוכחי / Last / Market Price)
   - Total value (שווי / Market Value)

4. CONFIDENCE LEVELS:
   - "high" = All fields clearly visible
   - "medium" = Some fields missing but main data clear
   - "low" = Unclear or multiple missing fields

5. IF NO INVESTMENTS FOUND:
   - Return empty investments array: {"investments": [], "detected_broker": null}

REAL EXAMPLE:
Image shows:
- "GOOGL"
- "שווי המניות: $2,583.56"
- "מספר מניות: 8.4273"
- "מחיר קנייה ממוצע: $228.80"

Correct output:
{
  "investments": [{
    "name": "GOOGL",
    "symbol": "GOOGL",
    "type": "מניות",
    "quantity": 8.4273,
    "purchase_price": 228.80,
    "total_value": 2583.56,
    "currency": "USD",
    "confidence": "high"
  }],
  "detected_currency": "USD"
}

Analyze the image now and return JSON.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              investments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    symbol: { type: "string" },
                    type: { 
                      type: "string", 
                      enum: ["מניות", "אג״ח", "קרנות_נאמנות", "קריפטו", "נדל״ן", "פיקדונות", "אחר"]
                    },
                    quantity: { type: "number" },
                    purchase_price: { type: "number" },
                    current_price: { type: "number" },
                    total_value: { type: "number" },
                    purchase_date: { type: "string" },
                    currency: { 
                      type: "string", 
                      enum: ["USD", "ILS", "EUR", "GBP"]
                    },
                    confidence: { 
                      type: "string", 
                      enum: ["high", "medium", "low"]
                    }
                  }
                }
              },
              detected_broker: { type: "string" },
              detected_currency: { 
                type: "string",
                enum: ["USD", "ILS", "EUR", "GBP"]
              }
            }
          }
        });
        
        return Promise.race([extractPromise, timeoutPromise]);
      };

      let result;
      try {
        result = await extractWithTimeout();
      } catch (extractError) {
        console.error("Extraction error:", extractError);
        if (extractError.message === "TIMEOUT" && retryCount < MAX_RETRIES) {
          console.log("Timeout occurred, retrying with smaller image...");
          // On timeout, compress more aggressively
          const moreCompressed = await compressImage(file);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return processImage(moreCompressed, retryCount + 1);
        }
        throw extractError;
      }
      
      console.log("AI extraction result:", result);

      // InvokeLLM returns the parsed JSON directly
      const output = result;
      const investments = output?.investments || [];
      
      if (!investments || investments.length === 0) {
        console.log("No investments found in result:", output);
      }
      
      console.log("Extracted investments:", investments);
      
      if (investments.length > 0) {
        const detectedCurrency = output.detected_currency || "USD";
        const brokerName = output.detected_broker;
        
        console.log("Detected broker:", brokerName);
        console.log("Detected currency:", detectedCurrency);
        
        const processed = investments.map(inv => {
          console.log("Processing investment:", inv);
          
          // Parse numbers
          let purchasePrice = parseFloat(inv.purchase_price) || parseFloat(inv.current_price) || 0;
          let currentPrice = parseFloat(inv.current_price) || parseFloat(inv.purchase_price) || 0;
          let quantity = parseFloat(inv.quantity) || 0;
          
          // If quantity is 0, try to calculate from total_value
          if (quantity === 0 && inv.total_value && currentPrice > 0) {
            quantity = parseFloat(inv.total_value) / currentPrice;
          }
          
          // Handle agorot (Israeli cents) for TASE stocks
          if (inv.currency === "אגורות" || (brokerName?.includes("תל אביב") && purchasePrice > 10000)) {
            purchasePrice = purchasePrice / 100;
            currentPrice = currentPrice / 100;
          }
          
          // Determine final currency - trust the AI's detection
          let finalCurrency = inv.currency || detectedCurrency || "USD";
          
          return {
            ...inv,
            type: mapType(inv.type),
            quantity: quantity || 1,
            purchase_price: purchasePrice,
            current_price: currentPrice,
            purchase_date: inv.purchase_date || null,
            currency: finalCurrency,
            confidence: inv.confidence || "medium",
            selected: true
          };
        });
        
        if (isMultiple) {
          return processed;
        } else {
          setExtractedData(processed);
          setDetectedBroker(brokerName);
          setStep("review");
        }
      } else {
        if (isMultiple) {
          return [];
        }
        toast({ 
          title: "לא זוהו השקעות בתמונה", 
          description: retryCount < MAX_RETRIES ? "מנסה שוב..." : "נסה להעלות תמונה ברורה יותר של תיק ההשקעות", 
          variant: "destructive" 
        });
        if (retryCount < MAX_RETRIES) {
          console.log("No investments found, retrying...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return processImage(file, retryCount + 1, isMultiple);
        }
        setStep("upload");
        return [];
      }
    } catch (error) {
      console.error("Processing error details:", error);
      
      if (retryCount < MAX_RETRIES && !error.message?.includes("שגיאה בהעלאת")) {
        console.log(`Error occurred, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        if (!isMultiple) {
          toast({ 
            title: "מנסה שוב...", 
            description: `ניסיון ${retryCount + 2}`,
          });
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
        return processImage(file, retryCount + 1, isMultiple);
      }
      
      if (isMultiple) {
        return [];
      }
      
      let errorMessage = "נסה שוב או העלה תמונה ברורה יותר";
      if (error.message && error.message !== "TIMEOUT") {
        errorMessage = error.message;
      } else if (error.message === "TIMEOUT") {
        errorMessage = "הזיהוי לקח יותר מדי זמן. נסה תמונה קטנה או ברורה יותר.";
      }
      
      toast({ 
        title: "שגיאה בעיבוד התמונה", 
        description: errorMessage,
        variant: "destructive" 
      });
      setStep("upload");
      setImagePreviews([]);
      return [];
    }
  };

  const mapType = (rawType) => {
    if (!rawType) return "אחר";
    const lower = rawType.toLowerCase();
    if (lower.includes("מני") || lower.includes("stock")) return "מניות";
    if (lower.includes("אג") || lower.includes("bond")) return "אג״ח";
    if (lower.includes("קרן") || lower.includes("fund") || lower.includes("etf")) return "קרנות_נאמנות";
    if (lower.includes("קריפטו") || lower.includes("crypto") || lower.includes("ביטקוין")) return "קריפטו";
    if (lower.includes("פיקדון") || lower.includes("deposit")) return "פיקדונות";
    if (lower.includes("נדל") || lower.includes("real")) return "נדל״ן";
    return "אחר";
  };

  const toggleSelect = (index) => {
    setExtractedData(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItem = (index, field, value) => {
    setExtractedData(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleImport = async () => {
    const selected = extractedData.filter(item => item.selected);
    if (selected.length === 0) {
      toast({ title: "בחר לפחות השקעה אחת", variant: "destructive" });
      return;
    }

    setStep("importing");

    try {
      const investments = selected.map(item => ({
        name: item.name || item.symbol || "השקעה",
        symbol: item.symbol || "",
        type: item.type || "אחר",
        quantity: parseFloat(item.quantity) || 1,
        purchase_price: parseFloat(item.purchase_price) || 0,
        current_price: parseFloat(item.current_price) || parseFloat(item.purchase_price) || 0,
        purchase_date: item.purchase_date || new Date().toISOString().split("T")[0],
        currency: item.currency || "USD",
        dividends: 0
      }));

      await base44.entities.Investment.bulkCreate(investments);

      toast({ title: `✅ יובאו ${investments.length} השקעות בהצלחה` });
      onImport?.();
      onClose?.();
    } catch (error) {
      console.error("Import error:", error);
      toast({ title: "שגיאה בייבוא", variant: "destructive" });
      setStep("review");
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-0 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">סריקה חכמה</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-white/80 mt-1">צלם או העלה תמונה מהברוקר</p>
      </div>

      <CardContent className="p-4">
        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden">
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover" />
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                <Button 
                  size="sm"
                  variant="destructive" 
                  className="col-span-2 h-8"
                  onClick={() => setImagePreviews([])}
                >
                  <X className="w-4 h-4 ml-1" />
                  נקה הכל
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">צלם תמונה</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-dashed border-green-200 dark:border-green-700 hover:border-green-400 transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <FileImage className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">העלה קובץ</span>
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                💡 ניתן להעלות מספר תמונות בו זמנית לייבוא כל ההשקעות ביחד
              </p>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">מזהה השקעות...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI מנתח את התמונות</p>
              {processingStatus.total > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  תמונה {processingStatus.current} מתוך {processingStatus.total} ⏱️
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">זה יכול לקחת עד דקה וחצי לתמונה</p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  זוהו {extractedData.length} השקעות
                </p>
                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                  סרוק שוב
                </Button>
              </div>
              
              {detectedBroker && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg inline-block">
                  🏦 זוהה: {detectedBroker}
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {Object.entries(confidenceConfig).map(([key, config]) => {
                  const count = extractedData.filter(i => i.confidence === key).length;
                  if (count === 0) return null;
                  return (
                    <span key={key} className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
                      {config.icon} {count} {config.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {extractedData.map((item, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    item.selected 
                      ? "border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-600" 
                      : "border-gray-200 dark:border-gray-700 opacity-50"
                  }`}
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="שם"
                          value={item.name || ""}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Input
                          placeholder="סימול"
                          value={item.symbol || ""}
                          onChange={(e) => updateItem(index, "symbol", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="כמות"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="מחיר רכישה"
                          value={item.purchase_price || ""}
                          onChange={(e) => updateItem(index, "purchase_price", e.target.value)}
                          className="h-9 text-sm"
                        />
                        <Select
                          value={item.type}
                          onValueChange={(v) => updateItem(index, "type", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INVESTMENT_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={() => setEditingIndex(null)} className="w-full h-8">
                        <Check className="w-4 h-4 ml-1" /> סיום עריכה
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelect(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          item.selected 
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {item.selected && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {item.name || item.symbol || "השקעה"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span>{item.quantity} יח'</span>
                          <span>•</span>
                          <span>{item.currency === "USD" ? "$" : "₪"}{item.purchase_price?.toLocaleString()}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {INVESTMENT_TYPES.find(t => t.value === item.type)?.label || item.type}
                          </span>
                          {item.purchase_date && (
                            <>
                              <span>•</span>
                              <span>📅 {item.purchase_date}</span>
                            </>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${confidenceConfig[item.confidence]?.color || confidenceConfig.medium.color}`}>
                            {confidenceConfig[item.confidence]?.icon || "?"}
                          </span>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingIndex(index)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={handleImport} 
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl"
              disabled={!extractedData.some(item => item.selected)}
            >
              ייבא {extractedData.filter(i => i.selected).length} השקעות
            </Button>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">מייבא השקעות...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}