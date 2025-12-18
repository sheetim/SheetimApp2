import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          אין חיבור לאינטרנט - עובד במצב אופליין
        </motion.div>
      )}
      
      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          החיבור חזר!
        </motion.div>
      )}
    </AnimatePresence>
  );
}