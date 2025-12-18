import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import QuickTransactionForm from "../quickadd/QuickTransactionForm";

export default function DesktopQuickActions() {
  const [showForm, setShowForm] = useState(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="hidden md:flex h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            תנועה חדשה
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => setShowForm('expense')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium">הוצאה</p>
              <p className="text-xs text-gray-500">הוסף הוצאה חדשה</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowForm('income')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">הכנסה</p>
              <p className="text-xs text-gray-500">הוסף הכנסה חדשה</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Add Form Sheet */}
      <Sheet open={!!showForm} onOpenChange={() => setShowForm(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0">
          <div className="pt-6">
            <QuickTransactionForm 
              type={showForm} 
              onComplete={() => setShowForm(null)} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}