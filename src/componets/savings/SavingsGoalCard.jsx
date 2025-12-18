import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Target, Plus, Minus } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";

const colorMap = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-green-400 to-green-600',
  purple: 'from-purple-400 to-purple-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  teal: 'from-teal-400 to-teal-600',
  red: 'from-red-400 to-red-600',
  indigo: 'from-indigo-400 to-indigo-600'
};

const goalImages = {
  'קרן חירום': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=200&fit=crop',
  'חופשה': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop',
  'רכב': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=200&fit=crop',
  'דירה': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop',
  'חתונה': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=200&fit=crop',
  'לימודים': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop',
  'פנסיה': 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&h=200&fit=crop'
};

const getGoalImage = (goalName) => {
  const lowerName = goalName?.toLowerCase() || '';
  if (lowerName.includes('חירום') || lowerName.includes('ביטחון')) return goalImages['קרן חירום'];
  if (lowerName.includes('חופשה') || lowerName.includes('טיול') || lowerName.includes('אירופה')) return goalImages['חופשה'];
  if (lowerName.includes('רכב') || lowerName.includes('מכונית') || lowerName.includes('אוטו')) return goalImages['רכב'];
  if (lowerName.includes('דירה') || lowerName.includes('בית') || lowerName.includes('משכנתא')) return goalImages['דירה'];
  if (lowerName.includes('חתונה') || lowerName.includes('אירוסין')) return goalImages['חתונה'];
  if (lowerName.includes('לימוד') || lowerName.includes('תואר') || lowerName.includes('קורס')) return goalImages['לימודים'];
  if (lowerName.includes('פנסיה') || lowerName.includes('פרישה')) return goalImages['פנסיה'];
  return goalImages['default'];
};

export default function SavingsGoalCard({ goal, onEdit, onDelete, onUpdateAmount }) {
  const [addAmount, setAddAmount] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const percentage = (goal.current_amount / goal.target_amount) * 100;
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
  const isCompleted = percentage >= 100;

  const handleAddAmount = () => {
    if (addAmount) {
      onUpdateAmount(goal.current_amount + parseFloat(addAmount));
      setAddAmount('');
      setShowAddInput(false);
    }
  };

  return (
    <Card className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${isCompleted ? 'border-green-300 dark:border-green-700' : ''}`}>
      {/* Goal Image */}
      <div className="relative h-24 overflow-hidden">
        <img 
          src={getGoalImage(goal.name)} 
          alt={goal.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 right-3 left-3 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${colorMap[goal.color] || colorMap.blue} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white truncate drop-shadow">{goal.name}</h3>
              <p className="text-xs text-white/80">{goal.target_date && format(new Date(goal.target_date), 'dd/MM/yy', { locale: he })}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {/* Amount */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white">₪{goal.current_amount?.toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ ₪{goal.target_amount?.toLocaleString()}</span>
        </div>

        {/* Progress */}
        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div className={`absolute h-full rounded-full transition-all bg-gradient-to-r ${colorMap[goal.color] || colorMap.blue}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
            {percentage.toFixed(0)}% {isCompleted && '✓'}
          </span>
          {daysLeft > 0 && !isCompleted && <span className="text-xs text-gray-500">{daysLeft} ימים</span>}
        </div>

        {/* Add Amount */}
        {!showAddInput ? (
          <Button onClick={() => setShowAddInput(true)} variant="outline" size="sm" className="w-full h-8 text-xs rounded-lg">
            <Plus className="w-3.5 h-3.5 ml-1" />הוסף סכום
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input type="number" placeholder="סכום" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="flex-1 h-8 text-sm" autoFocus onKeyPress={(e) => e.key === 'Enter' && handleAddAmount()} />
            <Button onClick={handleAddAmount} size="sm" className="h-8 px-3">הוסף</Button>
            <Button onClick={() => { setShowAddInput(false); setAddAmount(''); }} variant="outline" size="sm" className="h-8 px-2">✕</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}