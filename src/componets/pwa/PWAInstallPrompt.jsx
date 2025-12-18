import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Listen for install prompt (Android/Desktop)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone && daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt if applicable
    if (iOS && !standalone && daysSinceDismissed > 7) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50"
      >
        <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white border-0 shadow-2xl">
          <CardContent className="p-4">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 left-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">התקן את Sheetim</h3>
                <p className="text-sm opacity-90 mb-3">
                  {isIOS 
                    ? 'הוסף למסך הבית לגישה מהירה וחוויה טובה יותר'
                    : 'התקן את האפליקציה לגישה מהירה גם אופליין'
                  }
                </p>

                {isIOS ? (
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <p className="flex items-center gap-2 mb-2">
                      <span className="bg-white/20 rounded p-1">1</span>
                      לחץ על <Share className="w-4 h-4 inline mx-1" /> בתחתית הדפדפן
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="bg-white/20 rounded p-1">2</span>
                      בחר "הוסף למסך הבית" <Plus className="w-4 h-4 inline mx-1" />
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstall}
                    className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    התקן עכשיו
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}