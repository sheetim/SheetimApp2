import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Shield, Zap, TrendingUp, Lock } from "lucide-react";
import { toast } from "sonner";
import BankConnectionForm from "../components/banking/BankConnectionForm";
import BankConnectionCard from "../components/banking/BankConnectionCard";
import EmptyState from "../components/common/EmptyState";
import { SubscriptionGuard } from "../components/subscription/SubscriptionGuard";

export default function OpenBankingPage() {
  const [showForm, setShowForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['bankConnections'],
    queryFn: () => base44.entities.BankConnection.list('-created_date', 50),
    initialData: [],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 100),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BankConnection.create(data),
    onSuccess: async (newConnection) => {
      queryClient.invalidateQueries(['bankConnections']);
      setShowForm(false);
      toast.success(`חשבון ${newConnection.bank_name} חובר בהצלחה! 🎉`);
      
      // Start initial sync
      try {
        await syncTransactions(newConnection);
      } catch (error) {
        console.error('Initial sync failed:', error);
        // Don't fail the connection if sync fails
      }
    },
    onError: (error) => {
      const errorData = error.response?.data;
      const errorMsg = errorData?.suggestion || errorData?.error || 'שגיאה בחיבור החשבון';
      toast.error(errorMsg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BankConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bankConnections']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bankConnections']);
      toast.success('החיבור נותק בהצלחה');
    },
    onError: (error) => {
      const errorData = error.response?.data;
      const errorMsg = errorData?.suggestion || errorData?.error || 'שגיאה בניתוק החשבון';
      toast.error(errorMsg);
    }
  });

  const syncTransactions = async (connection) => {
    setSyncingId(connection.id);
    
    try {
      const { data } = await base44.functions.invoke('syncBankTransactions', {
        connectionId: connection.id
      });

      if (data.success) {
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries(['bankConnections']);
        toast.success(`סונכרנו ${data.transactionsCount} עסקאות חדשות! ✨`);
      } else if (data.error) {
        // Handle specific error cases
        const errorMsg = data.suggestion || data.error || 'שגיאה בסנכרון';
        toast.error(errorMsg);
        
        if (data.error.includes('not found') || data.error.includes('expired')) {
          await updateMutation.mutateAsync({
            id: connection.id,
            data: { connection_status: 'error' }
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      
      // Extract error message from response
      const errorData = error.response?.data;
      const errorMsg = errorData?.suggestion || errorData?.error || 'שגיאה בסנכרון העסקאות';
      toast.error(errorMsg);
      
      await updateMutation.mutateAsync({
        id: connection.id,
        data: { connection_status: 'error' }
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = (connection) => {
    const confirmMessage = `ניתוק חשבון ${connection.bank_name}\n\n` +
      `זכות החרטה שלך על פי חוק:\n` +
      `• החיבור יבוטל לאלתר\n` +
      `• המידע הפיננסי שנאסף יישאר במערכת לצורך היסטוריה\n` +
      `• תוכל למחוק את כל המידע בהגדרות המערכת\n` +
      `• תוכל לחבר מחדש בכל עת\n\n` +
      `האם להמשיך בניתוק?`;
    
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(connection.id);
    }
  };

  const activeConnections = connections.filter(c => c.connection_status === 'connected');
  const lastSyncDate = connections
    .filter(c => c.last_sync_date)
    .sort((a, b) => new Date(b.last_sync_date) - new Date(a.last_sync_date))[0]?.last_sync_date;

  return (
    <SubscriptionGuard feature="open_banking">
      <div className="page-container" dir="rtl">
        <div className="page-header">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Open Banking
            </h1>
            <p className="text-gray-800 dark:text-gray-300 mt-1 font-medium">
              חבר את חשבונות הבנק שלך לסנכרון אוטומטי של עסקאות
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="md-ripple bg-blue-600 hover:bg-blue-700 mobile-touch-target"
            disabled={showForm}
          >
            <Plus className="w-4 h-4 ml-2" />
            חבר חשבון בנק
          </Button>
        </div>

        <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-700">
          <AlertDescription className="text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <strong className="font-semibold text-blue-900 dark:text-blue-200 text-lg">שירות Open Banking על פי חוק שירות מידע פיננסי</strong>
                <div className="mt-3 space-y-2 text-sm">
                  <p><strong>🏦 מידע חשוב לפני החיבור:</strong></p>
                  <ul className="mr-4 space-y-1 list-disc">
                    <li>השירות מתבצע באמצעות Base44 - ספק שירות מידע פיננסי המורשה על פי חוק</li>
                    <li>החיבור לבנק נעשה באמצעות OAuth מאובטח - <strong>לעולם לא נבקש סיסמה</strong></li>
                    <li>המידע משמש אך ורק למעקב וניהול פיננסי אישי</li>
                    <li>כל הנתונים מוצפנים בהעברה ובשמירה</li>
                    <li>ניתן לנתק חשבון ולמחוק מידע בכל עת - זכות החרטה מלאה</li>
                  </ul>
                  <p className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <strong className="text-amber-900 dark:text-amber-200">🧪 מצב הדגמה:</strong> כרגע המערכת פועלת במצב סימולציה לצורך הדגמה. 
                    בגרסת הייצור יתבצע חיבור אמיתי דרך Open Banking API של הבנקים.
                  </p>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {activeConnections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">חשבונות מחוברים</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeConnections.length}
                    </p>
                  </div>
                  <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">עסקאות מסונכרנות</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {transactions.length}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">סנכרון אוטומטי</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeConnections.filter(c => c.auto_sync).length}/{activeConnections.length}
                    </p>
                  </div>
                  <Zap className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <BankConnectionForm
              onConnect={(data) => createMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
              isConnecting={createMutation.isPending}
            />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded-xl" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="עדיין לא חיברת חשבונות בנק"
            description="חבר את חשבונות הבנק שלך כדי לסנכרן עסקאות באופן אוטומטי ולקבל תמונה פיננסית מלאה"
            actionLabel="חבר חשבון ראשון"
            onAction={() => setShowForm(true)}
            illustration="financial"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map(connection => (
                <BankConnectionCard
                  key={connection.id}
                  connection={connection}
                  onSync={syncTransactions}
                  onDisconnect={handleDisconnect}
                  isSyncing={syncingId === connection.id}
                />
              ))}
            </div>

            {lastSyncDate && (
              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                סנכרון אחרון: {new Date(lastSyncDate).toLocaleString('he-IL')}
              </div>
            )}
          </>
        )}

        <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              אבטחה, פרטיות וזכויות המשתמש
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔒 אבטחת מידע:</h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <p><strong>הצפנה מלאה:</strong> כל הנתונים מוצפנים בהעברה (SSL/TLS) ובאחסון (Encryption at rest)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <p><strong>אימות מאובטח:</strong> OAuth 2.0 - האימות מתבצע ישירות מול הבנק, ללא העברת סיסמאות</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <p><strong>גישה לקריאה בלבד:</strong> לא ניתן לבצע העברות כספיות או לשנות נתונים בבנק</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <p><strong>הפרדת הרשאות:</strong> כל משתמש רואה רק את המידע שלו</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400">✅</span>
                    <p><strong>מינימיזציה:</strong> שומרים רק את המידע הנדרש לתפעול השירות</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">⚖️ זכויותיך על פי החוק:</h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🔓</span>
                    <p><strong>זכות החרטה:</strong> ניתן לנתק את החיבור בכל עת ללא קנס או עיכוב</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🗑️</span>
                    <p><strong>זכות למחיקה:</strong> ניתן למחוק את כל המידע שנאסף בהגדרות המערכת</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">👁️</span>
                    <p><strong>שקיפות מלאה:</strong> תמיד תדע מה נאסף ולאיזו מטרה</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🎯</span>
                    <p><strong>ייעודיות:</strong> המידע משמש אך ורק למעקב פיננסי אישי</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🚫</span>
                    <p><strong>איסור שימוש משני:</strong> לא נשתמש במידע למטרות שיווק או מכירה לצדדים שלישיים</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📜 מסגרת חוקית:</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  השירות פועל על פי <strong>חוק שירות מידע פיננסי, התשפ"ב-2021</strong> ו<strong>חוק הגנת הפרטיות, התשמ"א-1981</strong>.
                  Base44 הוא ספק שירות מידע פיננסי מורשה.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                    <strong>לעולם לא נבקש ממך סיסמאות:</strong> כל האימות מתבצע ישירות מול הבנק באמצעות OAuth מאובטח. 
                    אם מישהו מבקש ממך סיסמת בנק - זו תרמית!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SubscriptionGuard>
  );
}