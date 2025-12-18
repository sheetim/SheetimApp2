import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import QuickTransactionForm from "./QuickTransactionForm";

export default function QuickAddFAB() {
  const [showForm, setShowForm] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Single FAB Button - Bottom Left */}
      <div className="fixed bottom-6 left-4 z-40 md:hidden">
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Expense Button */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: -120, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={() => { setShowForm('expense'); setIsExpanded(false); }}
                className="absolute bottom-0 left-0 flex items-center gap-2 px-4 py-3 rounded-full 
                           bg-gradient-to-r from-red-500 to-rose-600 
                           shadow-lg shadow-red-500/30
                           text-white font-medium text-sm whitespace-nowrap"
              >
                <Minus className="w-4 h-4" />
                הוצאה
              </motion.button>
              
              {/* Income Button */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: -60, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.05 }}
                onClick={() => { setShowForm('income'); setIsExpanded(false); }}
                className="absolute bottom-0 left-0 flex items-center gap-2 px-4 py-3 rounded-full 
                           bg-gradient-to-r from-green-500 to-emerald-600 
                           shadow-lg shadow-green-500/30
                           text-white font-medium text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                הכנסה
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isExpanded 
              ? 'bg-gray-800 dark:bg-gray-600' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          }`}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Quick Add Form Sheet */}
      <Sheet open={!!showForm} onOpenChange={() => setShowForm(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl px-0 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
          <QuickTransactionForm 
            type={showForm} 
            onComplete={() => setShowForm(null)} 
          />
        </SheetContent>
      </Sheet>
    </>
  );
}