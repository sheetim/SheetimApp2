import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusConfig = {
  connected: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    label: "מחובר"
  },
  disconnected: {
    icon: XCircle,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    label: "מנותק"
  },
  error: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    label: "שגיאה"
  },
  pending: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    label: "ממתין"
  }
};

export default function BankConnectionCard({ connection, onSync, onDisconnect, isSyncing }) {
  const status = statusConfig[connection.connection_status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 relative">
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
          🧪 הדגמה
        </Badge>
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="text-4xl">🏦</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                {connection.bank_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {connection.account_name} • {connection.account_number}
              </p>
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 ml-1" />
                {status.label}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSync(connection)}
              disabled={isSyncing || connection.connection_status !== 'connected'}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDisconnect(connection)}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {connection.last_sync_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">סנכרון אחרון</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(new Date(connection.last_sync_date), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">סנכרון אוטומטי</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {connection.auto_sync ? '✅ פעיל' : '❌ כבוי'}
            </span>
          </div>

          {connection.sync_frequency && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">תדירות סנכרון</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {connection.sync_frequency === 'daily' ? 'יומי' : 
                 connection.sync_frequency === 'weekly' ? 'שבועי' : 'ידני'}
              </span>
            </div>
          )}

          {connection.connection_status === 'error' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300">
                ⚠️ יש בעיה בחיבור. אנא התחבר מחדש.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}