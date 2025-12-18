import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, TrendingUp, Shield, Target } from "lucide-react";
import { toast } from "sonner";

export default function AIRecommendations({ goals, investments }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const generateRecommendations = async () => {
    if (!goals || goals.length === 0) {
      toast.error("יש להגדיר לפחות יעד השקעה אחד");
      return;
    }

    setLoading(true);
    try {
      const goalsData = goals.map(g => ({
        name: g.name,
        type: g.goal_type,
        target: g.target_amount,
        current: g.current_amount,
        deadline: g.target_date,
        risk: g.risk_profile,
        monthly: g.monthly_contribution
      }));

      const portfolioData = investments?.map(inv => ({
        name: inv.name,
        type: inv.type,
        value: inv.quantity * inv.current_price,
        return: ((inv.current_price - inv.purchase_price) / inv.purchase_price * 100).toFixed(2)
      })) || [];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה יועץ השקעות מומחה. נתח את הנתונים הבאים והמלץ על אסטרטגיית השקעה מותאמת אישית.

יעדי השקעה:
${JSON.stringify(goalsData, null, 2)}

תיק השקעות נוכחי:
${JSON.stringify(portfolioData, null, 2)}

בבקשה ספק:
1. ניתוח הפורטפוליו הנוכחי והתאמתו ליעדים
2. המלצות ספציפיות לפי פרופיל הסיכון של כל יעד
3. אסטרטגיית הקצאת נכסים (מניות, אג"ח, קרנות נאמנות וכו')
4. המלצות להפקדות חודשיות
5. התאמות לתנאי שוק ישראלי

תן המלצות מעשיות, ספציפיות ומתאימות למשקיע ישראלי.`,
        response_json_schema: {
          type: "object",
          properties: {
            portfolio_analysis: { type: "string" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  strategy: { type: "string" },
                  allocation: { type: "string" },
                  monthly_action: { type: "string" }
                }
              }
            },
            risk_assessment: { type: "string" },
            market_insights: { type: "string" }
          }
        }
      });

      setRecommendations(result);
      toast.success("המלצות נוצרו בהצלחה");
    } catch (error) {
      console.error(error);
      toast.error("שגיאה ביצירת המלצות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="md-card md-elevation-2 border-0 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Sparkles className="w-5 h-5 text-purple-600" />
          המלצות השקעה מבוססות AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <AlertDescription className="text-sm dark:text-gray-300">
            💡 קבל המלצות מותאמות אישית בהתאם ליעדי ההשקעה ופרופיל הסיכון שלך
          </AlertDescription>
        </Alert>

        <Button 
          onClick={generateRecommendations} 
          disabled={loading}
          className="w-full md-ripple bg-gradient-to-r from-purple-600 to-blue-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              מייצר המלצות...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 ml-2" />
              קבל המלצות AI
            </>
          )}
        </Button>

        {recommendations && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold flex items-center gap-2 mb-2 dark:text-white">
                <TrendingUp className="w-4 h-4" />
                ניתוח פורטפוליו
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {recommendations.portfolio_analysis}
              </p>
            </div>

            {recommendations.recommendations?.map((rec, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold flex items-center gap-2 mb-2 dark:text-white">
                  <Target className="w-4 h-4 text-purple-600" />
                  {rec.goal}
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">אסטרטגיה:</span>
                    <p className="text-gray-600 dark:text-gray-400">{rec.strategy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">הקצאת נכסים:</span>
                    <p className="text-gray-600 dark:text-gray-400">{rec.allocation}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">פעולה חודשית:</span>
                    <p className="text-gray-600 dark:text-gray-400">{rec.monthly_action}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold flex items-center gap-2 mb-2 dark:text-white">
                <Shield className="w-4 h-4" />
                הערכת סיכון
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {recommendations.risk_assessment}
              </p>
            </div>

            {recommendations.market_insights && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2 dark:text-white">תובנות שוק</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {recommendations.market_insights}
                </p>
              </div>
            )}

            <Alert className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <AlertDescription className="text-xs dark:text-gray-300">
                ⚠️ ההמלצות הן לצורך אינפורמטיבי בלבד ואינן מהוות ייעוץ פיננסי. יש להתייעץ עם יועץ השקעות מורשה.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}