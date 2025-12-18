import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Sparkles } from "lucide-react";

export default function ProTooltip({ children }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700">
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[200px] text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
          dir="rtl"
        >
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>תכונה מתקדמת שתהיה זמינה למנויים בתוכנית Pro. כרגע זמינה לכולם.</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}