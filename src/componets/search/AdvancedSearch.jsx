import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function AdvancedSearch({ onSearch, categories = [], types = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSearch = () => {
    onSearch({
      searchTerm,
      category: category === 'all' ? null : category,
      type: type === 'all' ? null : type,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategory('all');
    setType('all');
    setMinAmount('');
    setMaxAmount('');
    setDateFrom('');
    setDateTo('');
    onSearch({});
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <button 
            type="button"
            onClick={handleSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer p-1"
            aria-label="חפש"
          >
            <Search className="w-4 h-4" />
          </button>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="חפש לפי תיאור..."
            className="pr-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-3 rounded-xl"
        >
          <SlidersHorizontal className="w-4 h-4 sm:ml-2" />
          <span className="hidden sm:inline">סינון</span>
        </Button>
        <Button onClick={handleSearch} size="sm" className="h-10 px-4 rounded-xl">
          חפש
        </Button>
      </div>

      {isOpen && (
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">סינון מתקדם</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">קטגוריה</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {types.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">סוג</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      {types.map(t => (
                        <SelectItem key={t} value={t}>{t === 'income' ? 'הכנסה' : 'הוצאה'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">סכום מינ׳</label>
                <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className="h-9 rounded-lg" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">סכום מקס׳</label>
                <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="∞" className="h-9 rounded-lg" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">מתאריך</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 rounded-lg" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">עד תאריך</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSearch} size="sm" className="flex-1 h-9 rounded-lg">החל</Button>
              <Button onClick={handleReset} variant="outline" size="sm" className="flex-1 h-9 rounded-lg">אפס</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}