import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Check for updates periodically
      const checkInterval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      }, 60 * 60 * 1000); // Check every hour

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm font-medium">גרסה חדשה זמינה!</span>
          <Button 
            onClick={handleUpdate}
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            עדכן עכשיו
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}