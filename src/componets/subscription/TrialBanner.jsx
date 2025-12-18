import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export default function TrialBanner({ user, isPremium }) {
  const queryClient = useQueryClient();

  const trialStatus = useMemo(() => {
    if (!user) return 'unknown';
    if (user.trial_used) {
      if (user.trial_end_date && new Date(user.trial_end_date) > new Date()) {
        return 'active';
      }
      return 'expired';
    }
    return 'eligible';
  }, [user]);

  const trialDaysRemaining = useMemo(() => {
    if (user?.trial_end_date) {
      return Math.max(0, differenceInDays(new Date(user.trial_end_date), new Date()));
    }
    return 0;
  }, [user]);

  const startTrial = async () => {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      await base44.auth.updateMe({
        subscription_plan: 'pro',
        trial_used: true,
        trial_start_date: new Date().toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        is_trial: true,
        auto_renew: false
      });
      
      queryClient.invalidateQueries(['currentUser']);
      toast.success('🎉 תקופת הניסיון שלך התחילה! יש לך 7 ימים לחוות את Pro');
    } catch (error) {
      toast.error('שגיאה בהתחלת תקופת הניסיון');
    }
  };

  // Eligible for trial
  if (trialStatus === 'eligible' && !isPremium) {
    return (
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                🎁 נסה Pro בחינם למשך 7 ימים!
              </h3>
              <p className="text-white/80 text-sm">גישה מלאה לכל התכונות, ללא כרטיס אשראי</p>
            </div>
            <Button 
              onClick={startTrial}
              className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-6 flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 ml-2" />
              התחל ניסיון
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active trial
  if (trialStatus === 'active') {
    return (
      <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <Clock className="w-4 h-4 text-purple-600" />
        <AlertDescription className="text-purple-800 dark:text-purple-300">
          ⏰ <strong>תקופת ניסיון פעילה:</strong> נותרו לך <strong>{trialDaysRemaining} ימים</strong>. 
          שדרג עכשיו כדי לא לאבד את הגישה לתכונות Pro!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}