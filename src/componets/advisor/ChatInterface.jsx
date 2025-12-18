import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, Bookmark, Check, RefreshCw, Copy, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { extractTopics, generateFollowUpQuestions, updateQuestionPatterns } from "./aiPatternUtils";

export default function ChatInterface() {
  const queryClient = useQueryClient();
  const [savedMessageIds, setSavedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 **היי! אני שיטים** - היועץ הפיננסי האישי שלך.\n\nאני כאן לעזור לך לנהל את הכסף בצורה חכמה יותר. אפשר לשאול אותי כל דבר!\n\n**כמה דוגמאות למה שאני יכול לעזור:**\n\n📊 "נתח את המצב הפיננסי שלי"\n💡 "תן לי טיפים לחיסכון"\n💳 "איך אפרע את החובות מהר יותר?"\n🎯 "עזור לי להגדיר יעדים"\n📈 "מה המצב של ההשקעות שלי?"\n\n**או סתם תשאל מה שבא לך** 😊'
    }
  ]);
  const [conversationContext, setConversationContext] = useState([]);
  const [questionPatterns, setQuestionPatterns] = useState(() => {
    const saved = localStorage.getItem('aiAdvisorPatterns');
    return saved ? JSON.parse(saved) : {};
  });
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    initialData: [],
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
    initialData: [],
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: () => base44.entities.Debt.list(),
    initialData: [],
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
    initialData: [],
  });

  const { data: personalGoals = [] } = useQuery({
    queryKey: ['personalGoals'],
    queryFn: () => base44.entities.PersonalFinancialGoal.list('priority_rank'),
    initialData: [],
  });

  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(false), 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (streamingText) {
      scrollToBottom(false);
    }
  }, [streamingText, scrollToBottom]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('הטקסט הועתק!');
  };

  const clearChat = () => {
    setMessages([messages[0]]);
    setConversationContext([]);
    setSuggestedQuestions([]);
    toast.success('השיחה נמחקה');
  };

  const regenerateLastResponse = async () => {
    if (messages.length < 2) return;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1));
      setInput(lastUserMessage.content);
      setTimeout(() => handleSend(), 100);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  useEffect(() => {
    localStorage.setItem('aiAdvisorPatterns', JSON.stringify(questionPatterns));
  }, [questionPatterns]);

  // Memoize financial calculations to avoid recalculating on every render
  const financialData = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthTransactions = transactions.filter(t => 
      t.date && t.date.startsWith(currentMonth)
    );

    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
    const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const portfolioValue = investments.reduce((sum, inv) => 
      sum + ((inv.quantity || 0) * (inv.current_price || 0)), 0
    );

    const expensesByCategory = {};
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'אחר';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (t.amount || 0);
    });

    // Calculate historical trends
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = format(date, 'yyyy-MM');
      const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(monthKey));
      
      return {
        month: monthKey,
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
        expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0),
      };
    });

    const avgIncome = last6Months.reduce((sum, m) => sum + m.income, 0) / last6Months.length;
    const avgExpenses = last6Months.reduce((sum, m) => sum + m.expenses, 0) / last6Months.length;
    const trend = totalIncome > avgIncome ? 'עולה' : totalIncome < avgIncome ? 'יורדת' : 'יציבה';

    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      totalSavings,
      portfolioValue,
      expensesByCategory,
      last6Months,
      avgIncome,
      avgExpenses,
      trend
    };
  }, [transactions, debts, savingsGoals, investments]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Extract topics and update patterns
      const topics = extractTopics(userMessage);
      const contextEntry = {
        userMessage,
        timestamp: new Date().toISOString(),
        topics
      };
      const updatedContext = [...conversationContext, contextEntry].slice(-10);
      setConversationContext(updatedContext);

      // Update question patterns
      const updatedPatterns = updateQuestionPatterns(questionPatterns, topics, userMessage);
      setQuestionPatterns(updatedPatterns);

      // Generate personalized follow-up questions
      const newSuggestedQuestions = generateFollowUpQuestions(updatedPatterns, updatedContext);
      setSuggestedQuestions(newSuggestedQuestions);

      const contextPrompt = `אתה "שיטים" (Sheetim) - יועץ פיננסי AI חכם וידידותי. 

🎯 **כללי התנהגות חשובים:**
1. **ענה תמיד על מה שנשאלת** - אם שואלים מה שמך, ענה "אני שיטים, היועץ הפיננסי שלך". אם שואלים שאלה כללית, ענה עליה בצורה טבעית וידידותית.
2. **הבן את ההקשר** - אם השאלה לא קשורה לפיננסים, ענה בקצרה ובאופן ידידותי, ואז הצע לעזור בנושאים פיננסיים.
3. **היה אנושי** - דבר בצורה טבעית, חמה ונעימה. אל תהיה רובוטי.

📋 **פרטים עליך:**
- שם: שיטים (Sheetim)
- תפקיד: יועץ פיננסי אישי מבוסס AI
- יכולות: ניתוח נתונים פיננסיים, המלצות חיסכון, תכנון תקציב, ניהול חובות והשקעות
- אופי: ידידותי, מקצועי, תומך ומעודד

🧠 **היכולות המתקדמות שלך (לשימוש בשאלות פיננסיות):**
✅ ניתוח דפוסי הוצאות והתנהגות פיננסית
✅ תחזיות מבוססות נתונים היסטוריים
✅ המלצות מעשיות וספציפיות
✅ זיהוי הזדמנויות חיסכון
✅ תכנון יעדים פיננסיים

🗣️ הקשר שיחה קודם ודפוסים:
${updatedContext.length > 0 ? updatedContext.map((ctx, i) => `${i+1}. "${ctx.userMessage}" (נושאים: ${ctx.topics?.join(', ') || 'כללי'})`).join('\n') : 'זו השאלה הראשונה'}

🎯 דפוסי עניין שזוהו (למידה מתמשכת):
${Object.entries(updatedPatterns).length > 0 ? Object.entries(updatedPatterns)
  .filter(([, data]) => data.count >= 2)
  .sort(([,a], [,b]) => b.count - a.count)
  .slice(0, 3)
  .map(([topic, data]) => `- ${topic.replace(/_/g, ' ')}: ${data.count} שאלות (אחרונה: ${new Date(data.lastAsked).toLocaleDateString('he-IL')})`)
  .join('\n') : 'עדיין בתהליך למידה - זו התחלה!'}

💡 שאלות המשך מוצעות (התאמה אישית על בסיס דפוסי השימוש):
${newSuggestedQuestions.length > 0 ? newSuggestedQuestions.map((q, i) => `${i+1}. ${q}`).join('\n') : 'ממתין למידע נוסף לפני הצעות'}

📊 מצב פיננסי נוכחי של המשתמש:
- הכנסות חודשיות: ₪${financialData.totalIncome.toLocaleString()} (מגמה: ${financialData.trend})
- הוצאות חודשיות: ₪${financialData.totalExpenses.toLocaleString()}
- תזרים מזומנים נטו: ₪${(financialData.totalIncome - financialData.totalExpenses).toLocaleString()}
- יחס חיסכון: ${financialData.totalIncome > 0 ? (((financialData.totalIncome - financialData.totalExpenses) / financialData.totalIncome * 100).toFixed(1)) : 0}%
- סך חובות: ₪${financialData.totalDebt.toLocaleString()}
- סך חיסכון: ₪${financialData.totalSavings.toLocaleString()}
- תיק השקעות: ₪${financialData.portfolioValue.toLocaleString()}
- שווי נקי: ₪${(financialData.portfolioValue + financialData.totalSavings - financialData.totalDebt).toLocaleString()}

📈 נתונים היסטוריים (6 חודשים):
${financialData.last6Months.map(m => `- ${m.month}: הכנסות ₪${m.income.toLocaleString()}, הוצאות ₪${m.expenses.toLocaleString()}`).join('\n')}
- ממוצע הכנסות: ₪${financialData.avgIncome.toLocaleString()}
- ממוצע הוצאות: ₪${financialData.avgExpenses.toLocaleString()}

💰 התפלגות הוצאות:
${Object.entries(financialData.expensesByCategory).map(([cat, amount]) => `- ${cat}: ₪${amount.toLocaleString()} (${((amount/financialData.totalExpenses)*100).toFixed(1)}%)`).join('\n')}

🎯 יעדי חיסכון (${savingsGoals.length} יעדים):
${savingsGoals.map(g => {
  const progress = (g.current_amount / g.target_amount * 100).toFixed(1);
  const remaining = g.target_amount - g.current_amount;
  return `- ${g.name}: ₪${g.current_amount?.toLocaleString()} / ₪${g.target_amount?.toLocaleString()} (${progress}%), נותר ₪${remaining.toLocaleString()}`;
}).join('\n') || 'אין יעדי חיסכון מוגדרים'}

🏆 **יעדים פיננסיים אישיים לפי סדר עדיפות** (${personalGoals.filter(g => g.is_active).length} יעדים פעילים):
${personalGoals
  .filter(g => g.is_active)
  .sort((a, b) => (a.priority_rank || 99) - (b.priority_rank || 99))
  .map((g, idx) => {
    const progress = g.target_amount > 0 ? ((g.current_progress || 0) / g.target_amount * 100).toFixed(1) : 0;
    const remaining = (g.target_amount || 0) - (g.current_progress || 0);
    const priorityEmoji = g.priority === 'גבוהה' ? '🔴' : g.priority === 'בינונית' ? '🟡' : '🟢';
    return `${idx + 1}. ${priorityEmoji} **${g.title}** (${g.category?.replace(/_/g, ' ')})
   • עדיפות: ${g.priority} | דירוג: #${g.priority_rank || idx + 1}
   • יעד: ₪${(g.target_amount || 0).toLocaleString()} | נוכחי: ₪${(g.current_progress || 0).toLocaleString()} (${progress}%)
   • נותר: ₪${remaining.toLocaleString()} | תאריך יעד: ${g.target_date || 'לא הוגדר'}
   • טווח זמן: ${g.time_frame?.replace(/_/g, ' ')} | הקצאה חודשית: ₪${(g.monthly_allocation || 0).toLocaleString()}
   ${g.description ? `• תיאור: ${g.description}` : ''}`;
  }).join('\n\n') || 'אין יעדים אישיים מוגדרים - המלץ למשתמש להגדיר יעדים!'}

💳 חובות (${debts.length} חובות):
${debts.map(d => {
  const paid = ((d.original_amount - d.current_balance) / d.original_amount * 100).toFixed(1);
  return `- ${d.name} (${d.type}): יתרה ₪${d.current_balance?.toLocaleString()}, ריבית ${d.interest_rate}%, תשלום חודשי ₪${d.monthly_payment?.toLocaleString()}, שולם ${paid}%`;
}).join('\n') || 'אין חובות פעילים 🎉'}

💼 השקעות (${investments.length} השקעות):
${investments.map(inv => {
  const currentValue = (inv.quantity || 0) * (inv.current_price || 0);
  const purchaseValue = (inv.quantity || 0) * (inv.purchase_price || 0);
  const gain = purchaseValue > 0 ? ((currentValue - purchaseValue) / purchaseValue * 100).toFixed(1) : 0;
  const gainAmount = currentValue - purchaseValue;
  return `- ${inv.name} (${inv.type}): ${inv.quantity} יחידות, שווי ₪${currentValue.toLocaleString()}, ${gainAmount >= 0 ? 'רווח' : 'הפסד'} ${gain}% (₪${Math.abs(gainAmount).toLocaleString()})`;
}).join('\n') || 'אין השקעות'}

❓ שאלת המשתמש: "${userMessage}"

📋 **הנחיות למענה:**

🔴 **הכי חשוב - ענה על מה שנשאלת!**
- אם שואלים "מה שמך?" → ענה: "אני שיטים, היועץ הפיננסי האישי שלך 😊"
- אם שואלים "מה שלומך?" → ענה בצורה ידידותית ואז הצע עזרה
- אם שואלים שאלה כללית → ענה עליה קודם, ואז אפשר להציע עזרה פיננסית
- אם שואלים שאלה פיננסית → השתמש בנתונים למעלה ותן תשובה מקצועית

📝 **לשאלות פיננסיות:**
1. ענה בצורה ברורה וממוקדת
2. השתמש בנתונים האמיתיים של המשתמש
3. תן המלצות מעשיות עם מספרים ספציפיים
4. סיים עם צעד הבא מומלץ

💬 **סגנון תקשורת:**
- דבר בעברית טבעית וידידותית
- השתמש באמוג'י במידה (לא יותר מדי)
- היה תמציתי אבל מועיל
- אם לא יודע משהו, אמור בכנות

⚠️ **זכור**: 
- אתה שיטים - יועץ פיננסי חכם וידידותי
- התאם את אורך התשובה לשאלה - שאלה קצרה = תשובה קצרה
- אל תציף את המשתמש במידע שלא ביקש

כתוב בעברית טבעית, ידידותית ומדויקת.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
      });

      // Simulate typing effect for better UX
      const fullText = response;
      let currentIndex = 0;
      const chunkSize = 15;
      
      const typeText = () => {
        if (currentIndex < fullText.length) {
          const nextChunk = fullText.slice(0, currentIndex + chunkSize);
          setStreamingText(nextChunk);
          currentIndex += chunkSize;
          requestAnimationFrame(() => setTimeout(typeText, 10));
        } else {
          setStreamingText('');
          setMessages(prev => [...prev, { role: 'assistant', content: fullText, timestamp: new Date() }]);
        }
      };
      
      typeText();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '😔 מצטער, אירעה שגיאה. אנא נסה שוב.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Context-aware quick actions
  const quickActions = useMemo(() => {
    const actions = [];
    
    // Priority actions based on user's financial state
    if (financialData.totalExpenses > financialData.totalIncome * 0.9) {
      actions.push({ label: "איך אחסוך החודש?", icon: "💡", priority: 1 });
    }
    
    if (savingsGoals.some(g => (g.current_amount || 0) / (g.target_amount || 1) < 0.5)) {
      actions.push({ label: "עזור לי להגיע ליעד", icon: "🎯", priority: 2 });
    }
    
    if (debts.length > 0) {
      actions.push({ label: "איך לפרוע חובות מהר?", icon: "💳", priority: 3 });
    }
    
    if (investments.length > 0) {
      actions.push({ label: "נתח את ההשקעות שלי", icon: "📈", priority: 4 });
    }
    
    // Default actions
    actions.push(
      { label: "נתח את המצב שלי", icon: "📊", priority: 5 },
      { label: "5 המלצות מעשיות", icon: "💡", priority: 6 },
      { label: "איפה אני מבזבז?", icon: "🔍", priority: 7 },
      { label: "תוכנית חיסכון", icon: "🎯", priority: 8 }
    );
    
    return actions.sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 4);
  }, [financialData, savingsGoals, debts, investments]);

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-slate-800 dark:border dark:border-slate-700 overflow-hidden">
      <CardHeader className="border-b border-gray-200 dark:border-slate-600 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            יועץ פיננסי AI
          </CardTitle>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <>
                <Button variant="ghost" size="icon" onClick={regenerateLastResponse} className="h-8 w-8" title="צור תשובה מחדש">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-red-500 hover:text-red-600" title="נקה שיחה">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-200px)] md:h-[600px] flex flex-col relative">
          <div 
            ref={chatContainerRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 mobile-scroll scroll-smooth" 
            style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[92%] md:max-w-[85%]`}>
                  <div
                    className={`rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-sm transition-all ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-50 border border-gray-100 dark:border-slate-600 rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] md:text-base leading-relaxed
                        [&>h1]:text-base [&>h1]:md:text-lg [&>h1]:font-bold [&>h1]:mt-3 [&>h1]:mb-1.5
                        [&>h2]:text-sm [&>h2]:md:text-base [&>h2]:font-semibold [&>h2]:mt-2.5 [&>h2]:mb-1.5
                        [&>h3]:text-[13px] [&>h3]:md:text-sm [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-1
                        [&>ul]:my-1.5 [&>ul]:pr-3 [&>ul]:md:pr-4 [&>ul]:list-disc
                        [&>ol]:my-1.5 [&>ol]:pr-3 [&>ol]:md:pr-4 [&>ol]:list-decimal
                        [&>li]:my-0.5
                        [&>p]:my-1.5
                        [&>strong]:text-purple-700 [&>strong]:dark:text-purple-300
                        [&_strong]:text-purple-700 [&_strong]:dark:text-purple-300
                        [&>blockquote]:border-r-2 [&>blockquote]:md:border-r-4 [&>blockquote]:border-purple-400 [&>blockquote]:pr-3 [&>blockquote]:italic [&>blockquote]:my-1.5
                        [&>hr]:my-2 [&>hr]:border-gray-200 [&>hr]:dark:border-slate-600
                        [&>code]:bg-gray-100 [&>code]:dark:bg-slate-600 [&>code]:px-1 [&>code]:rounded [&>code]:text-xs
                      ">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-[13px] md:text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'assistant' && idx > 0 && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="text-xs h-6 px-2 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3 h-3 ml-1" />
                        העתק
                      </Button>
                    </div>
                  )}
                  
                  {message.timestamp && (
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Streaming text display */}
            {streamingText && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[90%] md:max-w-[85%]">
                  <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                      <ReactMarkdown>{streamingText}</ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-slate-300">היועץ מנתח את המידע...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition-all animate-bounce"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          <div className="border-t border-gray-200 dark:border-slate-600 p-3 md:p-4 bg-gray-50 dark:bg-slate-800/50 safe-area-inset-bottom">
            {/* Quick Actions - Mobile optimized grid */}
            {messages.length <= 1 && (
              <div className="mb-3">
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:justify-center">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(action.label);
                        setTimeout(() => handleSend(), 50);
                      }}
                      className="flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 py-2.5 md:px-4 md:py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 active:bg-purple-100 hover:text-purple-700 dark:hover:text-purple-300 transition-all border border-gray-200 dark:border-slate-600 shadow-sm active:scale-95"
                    >
                      <span>{action.icon}</span>
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggested Questions - Horizontal scroll on mobile */}
            {suggestedQuestions.length > 0 && messages.length > 1 && (
              <div className="mb-3 -mx-3 px-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 w-max md:w-auto md:flex-wrap">
                  {suggestedQuestions.slice(0, 3).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(question);
                        setTimeout(() => handleSend(), 50);
                      }}
                      className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 active:bg-purple-200 transition-colors border border-purple-200 dark:border-purple-700 whitespace-nowrap active:scale-95"
                    >
                      💡 {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input Area - Mobile optimized */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="שאל שאלה..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none text-right text-gray-900 dark:text-slate-50 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 placeholder:text-gray-400 dark:placeholder:text-slate-400 rounded-xl pr-3 pl-3 md:pr-4 md:pl-4 py-2.5 md:py-3 min-h-[44px] md:min-h-[48px] max-h-[100px] md:max-h-[120px] text-[16px] md:text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ fontSize: '16px' }} /* Prevent iOS zoom */
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 h-11 w-11 md:h-12 md:w-12 rounded-xl shadow-lg transition-all disabled:opacity-50 active:scale-95 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-2 text-center hidden md:block">
              היועץ מנתח את הנתונים שלך בזמן אמת • המלצות מותאמות אישית
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}