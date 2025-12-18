import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

export default function DashboardWidget({ id, title, children, onRemove }) {
  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800 dark:border-gray-700 relative group">
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
      </div>
      {children}
    </Card>
  );
}