import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function HelpButton() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowFeedback(true)}
        className="h-10 w-10"
        title="משוב"
      >
        <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </Button>
      
      <FeedbackModal open={showFeedback} onOpenChange={setShowFeedback} />
    </>
  );
}