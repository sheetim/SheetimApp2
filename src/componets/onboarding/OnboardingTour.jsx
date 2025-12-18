import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";

const tourSteps = [
  {
    title: "ברוכים הבאים ל-Sheetim! 🎉",
    description: "זה המקום בו תנהלו את כל הפיננסים שלכם בצורה חכמה ופשוטה. בואו נסייר יחד!",
    position: "center"
  },
  {
    title: "הדשבורד המרכזי 📊",
    description: "כאן תראו סקירה מהירה של המצב הפיננסי שלכם - הכנסות, הוצאות, חיסכון והשקעות.",
    position: "center"
  },
  {
    title: "התפריט הצדדי 📱",
    description: "גישה מהירה לכל הכלים: עסקאות, תקציבים, יעדי חיסכון, חובות, השקעות ועוד.",
    position: "right"
  },
  {
    title: "יועץ פיננסי AI 🤖",
    description: "קבלו המלצות מותאמות אישית ושאלו שאלות על המצב הפיננסי שלכם.",
    position: "center"
  },
  {
    title: "התראות חכמות 🔔",
    description: "קבלו התראות על חריגות מתקציב, יעדים שהושגו ועוד.",
    position: "center"
  },
  {
    title: "מוכנים להתחיל! ✨",
    description: "כל המידע נשמר באופן מאובטח. התחילו להזין נתונים ו-Sheetim תעזור לכם לנהל את הכספים בצורה חכמה.",
    position: "center"
  }
];

export default function OnboardingTour() {
  // Disabled - no longer showing onboarding tour
  return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={handleSkip} />
      
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md shadow-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-8 bg-purple-600' 
                    : idx < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
                הקודם
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 ${isLastStep ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 ml-1" />
                  בואו נתחיל!
                </>
              ) : (
                <>
                  הבא
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </>
              )}
            </Button>
          </div>

          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full mt-2 text-sm"
            >
              דלג על הסיור
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}