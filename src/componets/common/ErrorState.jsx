import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function ErrorState({ 
  title = "משהו השתבש",
  description = "נסה לרענן את המסך. אם זה חוזר על עצמו, פנה אלינו.",
  onRetry,
  retryLabel = "רענן"
}) {
  return (
    <motion.div 
      className="text-center py-12 px-4 max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
    >
      <motion.div 
        className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
      >
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </motion.div>
      
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}