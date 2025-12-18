import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target, RefreshCw, Zap, Search, CheckCircle2 } from "lucide-react";
import { AIService } from "../ai/AIService";

export default function ProactiveInsights() {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInsight, setExpandedInsight] = useState(null);

  const loadInsights = async () => {
    setIsLoading(true);
    const data = await AIService.generateProactiveAdvice();
    setInsights(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const getIcon = (type, title = '') => {
    if (title.includes('חריגה') || title.includes('עסקה חריגה')) return Search;
    if (title.includes('חיסכון') && type === 'success') return CheckCircle2;
    if (title.includes('עלייה')) return TrendingUp;
    if (title.includes('ירידה')) return TrendingDown;
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'info': return Zap;
      case 'success': return Target;
      default: return Sparkles;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'warning': return 'border-orange-200 dark:border-orange-800';
      case 'info': return 'border-blue-200 dark:border-blue-800';
      case 'success': return 'border-green-200 dark:border-green-800';
      default: return 'border-purple-200 dark:border-purple-800';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-[10px]">דחוף</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">חשוב</Badge>;
      case 'low': return <Badge variant="outline" className="text-[10px]">מידע</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            תובנות AI פרואקטיביות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate insights by type
  const warningInsights = insights.filter(i => i.priority === 'high');
  const infoInsights = insights.filter(i => i.priority === 'medium');
  const successInsights = insights.filter(i => i.priority === 'low' || i.type === 'success');

  if (insights.length === 0) {
    return (
      <Card className="md-card md-elevation-2 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            תובנות AI פרואקטיביות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
            <p className="text-gray-600 dark:text-gray-400">מצוין! אין המלצות דחופות כרגע</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">הניהול הפיננסי שלך נראה טוב</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md-card md-elevation-2 dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 dark:text-white text-base">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          תובנות AI
          <div className="flex gap-1">
            {warningInsights.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{warningInsights.length}</Badge>
            )}
            {infoInsights.length > 0 && (
              <Badge className="text-[10px] bg-blue-100 text-blue-700">{infoInsights.length}</Badge>
            )}
            {successInsights.length > 0 && (
              <Badge className="text-[10px] bg-green-100 text-green-700">{successInsights.length}</Badge>
            )}
          </div>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={loadInsights} className="h-8 w-8">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {insights.slice(0, 5).map((insight, idx) => {
          const Icon = getIcon(insight.type, insight.title);
          const isExpanded = expandedInsight === idx;
          
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${getBorderColor(insight.type)} ${isExpanded ? 'ring-2 ring-purple-200 dark:ring-purple-800' : ''}`}
              onClick={() => setExpandedInsight(isExpanded ? null : idx)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getColor(insight.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </h4>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  <p className={`text-xs text-gray-600 dark:text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {insight.message}
                  </p>
                  
                  {/* Expanded details */}
                  {isExpanded && insight.data && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {insight.data.potentialSaving && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">חיסכון פוטנציאלי:</span>
                          <span className="font-bold text-green-600">₪{insight.data.potentialSaving.toLocaleString()}/חודש</span>
                        </div>
                      )}
                      {insight.data.annualSaving && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500">חיסכון שנתי:</span>
                          <span className="font-bold text-green-600">₪{insight.data.annualSaving.toLocaleString()}</span>
                        </div>
                      )}
                      {insight.data.shortfall && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500">נדרש להוסיף:</span>
                          <span className="font-bold text-orange-600">₪{insight.data.shortfall.toLocaleString()}/חודש</span>
                        </div>
                      )}
                      {insight.data.monthlyNeeded && (
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500">נדרש החודש:</span>
                          <span className="font-bold text-blue-600">₪{insight.data.monthlyNeeded.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {insights.length > 5 && (
          <p className="text-center text-xs text-gray-400 pt-2">
            ועוד {insights.length - 5} תובנות נוספות...
          </p>
        )}
      </CardContent>
    </Card>
  );
}