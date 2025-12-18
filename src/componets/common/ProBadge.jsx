import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProBadge({ className = "", size = "sm", showTooltip = true, variant = "pro" }) {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1"
  };

  const gradients = {
    pro: "from-purple-500 to-indigo-500",
    proPlus: "from-yellow-400 to-orange-500"
  };

  const Icon = variant === 'proPlus' ? Crown : Sparkles;
  const label = variant === 'proPlus' ? 'Pro+' : 'Pro';

  const badge = (
    <Badge 
      className={`bg-gradient-to-r ${gradients[variant]} text-white border-0 cursor-help ${sizeClasses[size]} ${className}`}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5 ml-0.5" : "w-3 h-3 ml-1"} />
      {label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[220px] text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-2"
          dir="rtl"
        >
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            תכונה מתקדמת שזמינה למנויי {label}.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}