import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Bot, User, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AIChatSupport({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation with agent
  useEffect(() => {
    const initConversation = async () => {
      try {
        const conversation = await base44.agents.createConversation({
          agent_name: "support",
          metadata: {
            name: "שיחת תמיכה",
            description: "שיחת תמיכה עם סוכן AI"
          }
        });
        setConversationId(conversation.id);
        setMessages([{
          role: 'assistant',
          content: 'שלום! 👋 אני הרובוט של Sheetim. איך אוכל לעזור לך היום?\n\nאני יכול לענות על שאלות בנושאים כמו:\n• ניהול עסקאות ותקציבים\n• השקעות ודיבידנדים\n• מנויים ותשלומים\n• אבטחה ופרטיות'
        }]);
      } catch (e) {
        console.error('Failed to create conversation:', e);
        setMessages([{
          role: 'assistant',
          content: 'שלום! 👋 אני הרובוט של Sheetim. איך אוכל לעזור לך היום?'
        }]);
      }
    };
    initConversation();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      if (data.messages) {
        setMessages(data.messages);
        setIsTyping(false);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: input
      });
    } catch (e) {
      console.error('Failed to send message:', e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'מצטער, יש תקלה זמנית. אנא שלח מייל ל-sheetimsz@gmail.com ונחזור אליך בהקדם! 📧'
      }]);
      setIsTyping(false);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 shadow-2xl border-0 dark:bg-gray-800 max-h-[70vh] flex flex-col">
      <CardHeader className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <CardTitle className="text-base">תמיכה - רובוט AI</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'bg-purple-100 dark:bg-purple-900'
            }`}>
              {msg.role === 'user' 
                ? <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                : <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              }
            </div>
            <div className={`p-3 rounded-2xl max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-none">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="הקלד שאלה..."
            className="flex-1 text-base"
            disabled={isTyping}
          />
          <Button type="submit" disabled={!input.trim() || isTyping} className="bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}