import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, X, Check, AlertCircle, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BROKER_CONFIGS = {
  interactive_israel: {
    name: "אינטראקטיב ישראל (IBKR)",
    logo: "🏦",
    instructions: "היכנס לחשבון → דוחות → דוח פעילות → ייצא ל-CSV",
    columns: {
      symbol: ["Symbol", "סימול"],
      name: ["Description", "תיאור", "Financial Instrument"],
      quantity: ["Quantity", "כמות", "Position"],
      purchasePrice: ["Cost Basis Per Share", "מחיר עלות", "Avg Cost"],
      currentPrice: ["Current Price", "מחיר נוכחי", "Mark Price"],
      type: ["Asset Class", "סוג נכס"]
    }
  },
  ibi: {
    name: "IBI טרייד",
    logo: "📊",
    instructions: "היכנס לחשבון → תיק השקעות → ייצוא לאקסל",
    columns: {
      symbol: ["סימול", "מספר ני\"ע"],
      name: ["שם ני\"ע", "שם"],
      quantity: ["כמות", "יחידות"],
      purchasePrice: ["שער רכישה", "עלות ממוצעת"],
      currentPrice: ["שער נוכחי", "שער"],
      type: ["סוג"]
    }
  },
  meitav: {
    name: "מיטב טרייד",
    logo: "💼",
    instructions: "היכנס לחשבון → תיק ני\"ע → ייצוא",
    columns: {
      symbol: ["סימול", "קוד ני\"ע"],
      name: ["שם ני\"ע", "תיאור"],
      quantity: ["כמות"],
      purchasePrice: ["שער קניה", "עלות"],
      currentPrice: ["שער אחרון"],
      type: ["סוג נייר"]
    }
  },
  excellensce: {
    name: "אקסלנס טרייד",
    logo: "⭐",
    instructions: "היכנס לחשבון → תיק השקעות → הורד דוח",
    columns: {
      symbol: ["סימול", "Symbol"],
      name: ["שם", "Name"],
      quantity: ["כמות", "Qty"],
      purchasePrice: ["עלות", "Cost"],
      currentPrice: ["שער", "Price"],
      type: ["סוג"]
    }
  },
  generic: {
    name: "קובץ כללי (CSV/Excel)",
    logo: "📄",
    instructions: "העלה קובץ עם עמודות: סימול, שם, כמות, מחיר רכישה, מחיר נוכחי",
    columns: {
      symbol: ["symbol", "סימול", "ticker", "Symbol"],
      name: ["name", "שם", "description", "Name"],
      quantity: ["quantity", "כמות", "qty", "Quantity", "units"],
      purchasePrice: ["purchase_price", "מחיר רכישה", "cost", "avg_cost", "Cost"],
      currentPrice: ["current_price", "מחיר נוכחי", "price", "Price"],
      type: ["type", "סוג", "asset_type"]
    }
  }
};

const TYPE_MAPPING = {
  "STK": "מניות",
  "Stocks": "מניות",
  "מניות": "מניות",
  "stock": "מניות",
  "BOND": "אג״ח",
  "Bonds": "אג״ח",
  "אג\"ח": "אג״ח",
  "אגח": "אג״ח",
  "ETF": "קרנות_נאמנות",
  "Fund": "קרנות_נאמנות",
  "קרן": "קרנות_נאמנות",
  "קרנות": "קרנות_נאמנות",
  "CRYPTO": "קריפטו",
  "Crypto": "קריפטו",
  "קריפטו": "קריפטו",
  "CASH": "פיקדונות",
  "פיקדון": "פיקדונות"
};

export default function PortfolioImport({ onImport, onClose }) {
  const [selectedBroker, setSelectedBroker] = useState("");
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [columnMapping, setColumnMapping] = useState({});
  const [headers, setHeaders] = useState([]);
  const { toast } = useToast();

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedFile });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true
          }
        }
      });

      if (result.status === "success" && result.output) {
        const data = Array.isArray(result.output) ? result.output : [result.output];
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]));
          setParsedData(data);
          
          // Auto-map columns based on broker config
          if (selectedBroker) {
            autoMapColumns(Object.keys(data[0]));
          }
          
          setStep(2);
        }
      } else {
        toast({ title: "שגיאה בקריאת הקובץ", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({ title: "שגיאה בעיבוד הקובץ", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const autoMapColumns = (fileHeaders) => {
    const config = BROKER_CONFIGS[selectedBroker] || BROKER_CONFIGS.generic;
    const mapping = {};

    for (const [field, possibleNames] of Object.entries(config.columns)) {
      for (const header of fileHeaders) {
        if (possibleNames.some(name => 
          header.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(header.toLowerCase())
        )) {
          mapping[field] = header;
          break;
        }
      }
    }

    setColumnMapping(mapping);
  };

  const mapType = (rawType) => {
    if (!rawType) return "אחר";
    const normalized = rawType.toString().trim();
    return TYPE_MAPPING[normalized] || "אחר";
  };

  const processImport = async () => {
    setIsProcessing(true);

    try {
      const investments = parsedData
        .filter(row => {
          const qty = parseFloat(row[columnMapping.quantity]);
          return qty && qty > 0;
        })
        .map(row => ({
          name: row[columnMapping.name] || row[columnMapping.symbol] || "השקעה",
          symbol: row[columnMapping.symbol] || "",
          type: mapType(row[columnMapping.type]),
          quantity: parseFloat(row[columnMapping.quantity]) || 0,
          purchase_price: parseFloat(String(row[columnMapping.purchasePrice] || "0").replace(/[^\d.-]/g, "")) || 0,
          current_price: parseFloat(String(row[columnMapping.currentPrice] || row[columnMapping.purchasePrice] || "0").replace(/[^\d.-]/g, "")) || 0,
          purchase_date: new Date().toISOString().split("T")[0],
          dividends: 0
        }));

      if (investments.length === 0) {
        toast({ title: "לא נמצאו השקעות לייבוא", variant: "destructive" });
        return;
      }

      await base44.entities.Investment.bulkCreate(investments);
      
      toast({ 
        title: `✅ יובאו ${investments.length} השקעות בהצלחה`,
        description: "ההשקעות נוספו לתיק שלך"
      });
      
      onImport?.();
      onClose?.();
    } catch (error) {
      console.error("Import error:", error);
      toast({ title: "שגיאה בייבוא", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Upload className="w-5 h-5" />
          ייבוא תיק השקעות
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-3">
              <Label>בחר ברוקר/פלטפורמה</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(BROKER_CONFIGS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedBroker(key)}
                    className={`p-3 rounded-xl border-2 text-right transition-all ${
                      selectedBroker === key
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{config.logo}</span>
                    <p className="text-sm font-medium mt-1 text-gray-900 dark:text-white">{config.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedBroker && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      איך לייצא את הקובץ:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      {BROKER_CONFIGS[selectedBroker].instructions}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>העלה קובץ (CSV / Excel)</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={!selectedBroker || isProcessing}
                />
                <label htmlFor="file-upload" className={`cursor-pointer ${!selectedBroker ? 'opacity-50' : ''}`}>
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isProcessing ? "מעבד..." : "לחץ להעלאת קובץ"}
                  </p>
                  {file && <p className="text-xs text-indigo-600 mt-1">{file.name}</p>}
                </label>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              <Label>התאם עמודות</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "symbol", label: "סימול", required: true },
                  { key: "name", label: "שם", required: false },
                  { key: "quantity", label: "כמות", required: true },
                  { key: "purchasePrice", label: "מחיר רכישה", required: true },
                  { key: "currentPrice", label: "מחיר נוכחי", required: false },
                  { key: "type", label: "סוג השקעה", required: false },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <Label className="text-xs">
                      {label} {required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[key] || ""}
                      onValueChange={(v) => setColumnMapping({ ...columnMapping, [key]: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="בחר עמודה" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                תצוגה מקדימה ({Math.min(3, parsedData.length)} רשומות ראשונות):
              </p>
              <div className="space-y-2 max-h-40 overflow-auto">
                {parsedData.slice(0, 3).map((row, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-gray-800 p-2 rounded-lg flex flex-wrap gap-2">
                    <span className="font-medium">{row[columnMapping.symbol] || "?"}</span>
                    <span className="text-gray-500">|</span>
                    <span>{row[columnMapping.name] || "-"}</span>
                    <span className="text-gray-500">|</span>
                    <span>כמות: {row[columnMapping.quantity] || 0}</span>
                    <span className="text-gray-500">|</span>
                    <span>₪{row[columnMapping.purchasePrice] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                חזור
              </Button>
              <Button 
                onClick={processImport} 
                disabled={!columnMapping.symbol || !columnMapping.quantity || !columnMapping.purchasePrice || isProcessing}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing ? "מייבא..." : `ייבא ${parsedData.length} השקעות`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}