import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackModal({ open, onOpenChange }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("נא להזין הודעה");
      return;
    }
    
    setIsSending(true);
    
    try {
      // Open email client with the message pre-filled
      const subject = encodeURIComponent("משוב מאפליקציית Sheetim");
      const body = encodeURIComponent(message);
      window.location.href = `mailto:sheetimsz@gmail.com?subject=${subject}&body=${body}`;
      
      setSent(true);
      toast.success("נפתח חלון מייל לשליחה 📧");
      
      setTimeout(() => {
        setMessage("");
        setSent(false);
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      toast.error("שגיאה בשליחה, נסה שוב");
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:sheetimsz@gmail.com?subject=משוב מאפליקציית Sheetim";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            משוב
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">תודה!</p>
              <p className="text-sm text-gray-500">נפתח חלון מייל לשליחה</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                נתקעת? יש לך רעיון לשיפור? ספר לנו ונחזור אליך בהקדם.
              </p>
              
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="כתוב כאן את ההודעה שלך..."
                className="min-h-[120px] resize-none"
                dir="rtl"
              />
              
              <Button 
                onClick={handleSubmit} 
                disabled={isSending || !message.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isSending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                שלח משוב
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">או צור קשר ישירות</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleEmailClick}
                className="w-full h-11"
              >
                <Mail className="w-4 h-4 ml-2" />
                sheetimsz@gmail.com
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}