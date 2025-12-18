import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Home, Car, Package, Wallet, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const assetIcons = {
  'דירה': Home,
  'רכב': Car,
  'תכולה': Package,
  'חשבון_בנק': Wallet,
  'קופת_גמל': TrendingUp,
  'ביטוח_מנהלים': TrendingUp,
  'זהב': TrendingUp,
  'אחר': Package
};

const assetColors = {
  'דירה': 'from-blue-400 to-blue-600',
  'רכב': 'from-purple-400 to-purple-600',
  'תכולה': 'from-orange-400 to-orange-600',
  'חשבון_בנק': 'from-green-400 to-green-600',
  'קופת_גמל': 'from-teal-400 to-teal-600',
  'ביטוח_מנהלים': 'from-indigo-400 to-indigo-600',
  'זהב': 'from-yellow-400 to-yellow-600',
  'אחר': 'from-gray-400 to-gray-600'
};

export default function AssetCard({ asset, onEdit, onDelete, onUpdateValue }) {
  const [newValue, setNewValue] = useState('');
  const [showValueInput, setShowValueInput] = useState(false);

  const Icon = assetIcons[asset.type] || Package;
  const appreciation = asset.purchase_value 
    ? asset.current_value - asset.purchase_value 
    : 0;
  const appreciationPercent = asset.purchase_value 
    ? (appreciation / asset.purchase_value) * 100 
    : 0;

  const handleUpdateValue = () => {
    if (newValue) {
      onUpdateValue(parseFloat(newValue));
      setNewValue('');
      setShowValueInput(false);
    }
  };

  return (
    <Card className="md-card md-elevation-2 border-0 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${assetColors[asset.type] || assetColors['אחר']}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${assetColors[asset.type] || assetColors['אחר']} rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{asset.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{asset.type?.replace(/_/g, ' ')}</span>
                <Badge variant={asset.is_liquid ? "default" : "secondary"} className="text-xs">
                  {asset.is_liquid ? 'נזיל' : 'לא נזיל'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="md-ripple h-8 w-8">
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="md-ripple h-8 w-8">
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">ערך נוכחי</p>
            <p className="text-3xl font-bold text-gray-900">₪{asset.current_value?.toLocaleString()}</p>
          </div>

          {asset.purchase_value && (
            <div className={`p-3 rounded-lg ${appreciation >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {appreciation >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-xs text-gray-600">שינוי בערך</p>
                    <p className={`text-lg font-bold ${appreciation >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                      {appreciation >= 0 ? '+' : '-'}₪{Math.abs(appreciation).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`text-xl font-bold ${appreciation >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                  {appreciation >= 0 ? '+' : '-'}{Math.abs(appreciationPercent).toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            {!showValueInput ? (
              <Button
                onClick={() => setShowValueInput(true)}
                variant="outline"
                className="w-full md-ripple"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                עדכן ערך
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="ערך חדש"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleUpdateValue} size="sm" className="md-ripple">
                  עדכן
                </Button>
                <Button onClick={() => {
                  setShowValueInput(false);
                  setNewValue('');
                }} variant="outline" size="sm" className="md-ripple">
                  ביטול
                </Button>
              </div>
            )}
          </div>

          {asset.purchase_date && (
            <p className="text-xs text-gray-400 text-center">
              נרכש ב־{format(new Date(asset.purchase_date), 'dd MMM yyyy', { locale: he })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}