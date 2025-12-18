import React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors = {
  'מזון': 'bg-green-100 text-green-700',
  'דלק': 'bg-orange-100 text-orange-700',
  'דיור': 'bg-blue-100 text-blue-700',
  'חשמל': 'bg-yellow-100 text-yellow-700',
  'מים': 'bg-cyan-100 text-cyan-700',
  'ביגוד': 'bg-purple-100 text-purple-700',
  'בריאות': 'bg-red-100 text-red-700',
  'חינוך': 'bg-indigo-100 text-indigo-700',
  'תחבורה': 'bg-pink-100 text-pink-700',
  'אחר': 'bg-gray-100 text-gray-700'
};

export default function InflationItemList({ items, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">אין מוצרים במעקב</p>
        <p className="text-sm text-gray-400 mt-1">התחל על ידי הוספת מוצר או שירות</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all md-elevation-1"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-pink-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.item_name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={categoryColors[item.category] || categoryColors['אחר']}>
                  {item.category}
                </Badge>
                {item.unit && (
                  <span className="text-xs text-gray-500">יחידה: {item.unit}</span>
                )}
                <span className="text-sm text-gray-500">
                  {item.date && format(new Date(item.date), 'dd MMM yyyy', { locale: he })}
                </span>
              </div>
            </div>

            <div className="text-left">
              <div className="text-2xl font-bold text-gray-900">
                ₪{item.price?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              className="md-ripple"
            >
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="md-ripple"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}