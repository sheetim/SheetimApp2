import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, Target, TrendingUp, CreditCard, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const onboardingSteps = [
  {
    type: "welcome",
    icon: Wallet,
    title: "👋 ברוכים הבאים ל-Sheetim!",
    subtitle: "בואו נעשה סדר בכסף שלך – פשוט ומהיר",
    gradient: "from-purple-500 to-blue-500"
  },
  {
    type: "goals",
    title: "מה המטרה העיקרית שלך?",
    subtitle: "בחר מה הכי חשוב לך עכשיו",
    gradient: "from-blue-500 to-cyan-500",
    options: [
      { id: "stop_minus", icon: CreditCard, label: "להפסיק את המינוס", desc: "לדעת לאן הכסף נעלם" },
      { id: "start_investing", icon: TrendingUp, label: "להתחיל להשקיע", desc: "לגרום לכסף לעבוד בשבילי" },
      { id: "close_debts", icon: Target, label: "לסגור חובות", desc: "לסיים הלוואות וחובות" },
      { id: "build_savings", icon: Wallet, label: "לבנות חיסכון", desc: "להגיע ליעדים פיננסיים" }
    ]
  },
  {
    type: "import",
    title: "איך תרצה להזין נתונים?",
    subtitle: "בחר את הדרך הנוחה לך",
    gradient: "from-cyan-500 to-teal-500",
    singleSelect: true,
    options: [
      { id: "manual", icon: Wallet, label: "ידנית", desc: "אזין עסקאות בעצמי" },
      { id: "file", icon: Target, label: "קובץ", desc: "אעלה קובץ בנק/אשראי" },
      { id: "auto", icon: TrendingUp, label: "אוטומטי", desc: "חיבור לבנק (בקרוב)", disabled: true }
    ]
  },
  {
    type: "awareness",
    title: "כמה אתה מכיר את המצב הפיננסי שלך?",
    subtitle: "זה יעזור לנו להתאים את החוויה",
    gradient: "from-teal-500 to-green-500",
    singleSelect: true,
    options: [
      { id: "no_idea", icon: Sparkles, label: "אין לי מושג", desc: "לא יודע לאן הכסף הולך" },
      { id: "roughly", icon: Target, label: "בערך", desc: "יודע בגדול אבל לא עוקב" },
      { id: "tracking", icon: TrendingUp, label: "עוקב כבר", desc: "רוצה לשדרג את המערכת" }
    ]
  },
  {
    type: "ready",
    icon: Sparkles,
    title: "🚀 מעולה! הכל מוכן",
    subtitle: "עכשיו אפשר להתחיל! תוכל להוסיף עסקאות, להגדיר תקציבים ולעקוב אחרי ההתקדמות שלך.",
    gradient: "from-green-500 to-emerald-500"
  }
];

export default function WelcomeOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedImport, setSelectedImport] = useState(null);
  const [selectedAwareness, setSelectedAwareness] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await base44.auth.me();
        // בדיקה אם המשתמש כבר השלים את האונבורדינג (שמור בפרופיל המשתמש)
        if (user.onboarding_completed) {
          setHasSeenOnboarding(true);
        } else {
          setHasSeenOnboarding(false);
        }
      } catch (error) {
        // אם יש שגיאה, נראה את האונבורדינג
        setHasSeenOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goalId) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSelectOption = (optionId, stepType) => {
    if (stepType === 'import') {
      setSelectedImport(optionId);
    } else if (stepType === 'awareness') {
      setSelectedAwareness(optionId);
    }
  };

  const handleComplete = async () => {
    try {
      // שמירת השלמת האונבורדינג בפרופיל המשתמש (לא ב-localStorage)
      await base44.auth.updateMe({ 
        onboarding_completed: true,
        onboarding_date: new Date().toISOString(),
        user_goals: selectedGoals,
        import_preference: selectedImport,
        awareness_level: selectedAwareness,
        financial_goal: selectedGoals.length > 0 ? 
          ({'stop_minus': 'פירעון_חובות', 'start_investing': 'השקעות', 'close_debts': 'פירעון_חובות', 'build_savings': 'קרן_חירום'}[selectedGoals[0]] || 'אחר') : null
      });

      // לא יוצרים תקציבים או יעדים אוטומטית - המשתמש יוסיף אותם בעצמו
      
      setHasSeenOnboarding(true);
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // גם אם יש שגיאה, נמשיך
      setHasSeenOnboarding(true);
      onComplete?.();
    }
  };

  if (hasSeenOnboarding) return null;

  const step = onboardingSteps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isGoalsStep = step.type === "goals";
  const isSingleSelectStep = step.singleSelect;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* Icon - only for non-goals steps */}
            {StepIcon && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl`}
              >
                <StepIcon className="w-10 h-10 text-white" />
              </motion.div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {step.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base text-gray-300 mb-8 max-w-sm mx-auto leading-relaxed">
              {step.subtitle}
            </p>

            {/* Goals Selection (multi-select) */}
            {isGoalsStep && step.options && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {step.options.map((option) => {
                  const OptionIcon = option.icon;
                  const isSelected = selectedGoals.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleGoal(option.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-right ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <OptionIcon className={`w-6 h-6 mb-2 ${isSelected ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Single Select Options (import, awareness) */}
            {isSingleSelectStep && step.options && (
              <div className={`grid ${step.options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} gap-3 mb-8`}>
                {step.options.map((option) => {
                  const OptionIcon = option.icon;
                  const currentSelection = step.type === 'import' ? selectedImport : selectedAwareness;
                  const isSelected = currentSelection === option.id;
                  const isDisabled = option.disabled;
                  return (
                    <button
                      key={option.id}
                      onClick={() => !isDisabled && handleSelectOption(option.id, step.type)}
                      disabled={isDisabled}
                      className={`relative p-4 rounded-xl border-2 transition-all text-right ${
                        isDisabled
                          ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-teal-500 bg-teal-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {isDisabled && (
                        <div className="absolute top-2 left-2 text-[10px] bg-gray-600 text-white px-2 py-0.5 rounded-full">
                          בקרוב
                        </div>
                      )}
                      <OptionIcon className={`w-6 h-6 mb-2 ${isSelected ? 'text-teal-400' : 'text-gray-400'}`} />
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      {option.desc && <div className="text-xs text-gray-400 mt-1">{option.desc}</div>}
                    </button>
                  );
                })}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {onboardingSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentStep 
                  ? 'w-8 h-3 bg-white' 
                  : idx < currentStep
                  ? 'w-3 h-3 bg-green-400'
                  : 'w-3 h-3 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="border-white/20 text-white hover:bg-white/10 px-6 min-h-[48px]"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              הקודם
            </Button>
          )}

          {isLastStep ? (
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-green-500/30 min-h-[56px]"
            >
              <Sparkles className="w-5 h-5 ml-2" />
              בואו נתחיל!
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold min-h-[56px]"
            >
              המשך
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>

        {/* Skip Button */}
        {!isLastStep && (
          <Button
            variant="ghost"
            onClick={handleComplete}
            className="w-full mt-6 text-white/60 hover:text-white hover:bg-white/5"
          >
            דלג והתחל
          </Button>
        )}
      </div>
    </div>
  );
}