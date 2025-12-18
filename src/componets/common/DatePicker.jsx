import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { he } from "date-fns/locale";

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function DatePicker({ value, onChange, placeholder = "בחר תאריך" }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  
  const selectedDate = value ? new Date(value) : null;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for week alignment
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  const handleSelect = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    onChange(dateStr);
    setOpen(false);
  };

  const goToPrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const goToNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const quickSelections = [
    { label: 'היום', date: new Date() },
    { label: 'אתמול', date: new Date(Date.now() - 86400000) },
    { label: 'לפני שבוע', date: new Date(Date.now() - 7 * 86400000) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-11 md:h-10 justify-start text-right font-normal"
        >
          <Calendar className="w-4 h-4 ml-2 text-gray-500" />
          {selectedDate ? (
            <span>{format(selectedDate, 'dd/MM/yyyy', { locale: he })}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir="rtl">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg min-w-[280px]">
          {/* Quick selections */}
          <div className="flex gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
            {quickSelections.map((qs) => (
              <Button
                key={qs.label}
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => handleSelect(qs.date)}
              >
                {qs.label}
              </Button>
            ))}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {format(viewDate, 'MMMM yyyy', { locale: he })}
            </span>
            <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {hebrewDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="w-9 h-9" />
            ))}
            {days.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <Button
                  key={day.toISOString()}
                  variant="ghost"
                  className={`w-9 h-9 p-0 text-sm font-medium rounded-lg transition-all
                    ${isSelected 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : isTodayDate 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }
                  `}
                  onClick={() => handleSelect(day)}
                >
                  {format(day, 'd')}
                </Button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-sm"
              onClick={() => {
                setViewDate(new Date());
                handleSelect(new Date());
              }}
            >
              עבור להיום
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}