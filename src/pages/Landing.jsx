import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  TrendingUp, 
  PieChart, 
  Sparkles, 
  ArrowLeft, 
  Check,
  Wallet,
  Target,
  CreditCard,
  BarChart3,
  Bell,
  Zap,
  Lock,
  Globe,
  Star,
  ChevronDown
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      if (auth) {
        // Check if onboarding completed
        const onboardingCompleted = localStorage.getItem('sheetim_onboarding_completed');
        if (onboardingCompleted) {
          window.location.href = createPageUrl("Dashboard");
        } else {
          // Authenticated but not onboarded - go to dashboard which shows onboarding
          window.location.href = createPageUrl("Dashboard");
        }
      } else {
        setIsAuthenticated(false);
      }
    });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Wallet,
      title: "מעקב הכנסות והוצאות",
      description: "קטגוריזציה אוטומטית, גרפים ברורים, ושליטה מלאה על לאן הכסף הולך",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: TrendingUp,
      title: "תיק השקעות",
      description: "מניות, קרנות, קריפטו ודיבידנדים - הכל במקום אחד עם מעקב תשואה",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Target,
      title: "יעדי חיסכון",
      description: "הגדר יעדים, עקוב אחרי ההתקדמות וקבל המלצות להשגתם מהר יותר",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: CreditCard,
      title: "ניהול חובות",
      description: "משכנתא, הלוואות וכרטיסי אשראי - תכנון פירעון וחיסכון בריבית",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: BarChart3,
      title: "דוחות ותחזיות",
      description: "דוחות חודשיים, השוואות שנתיות ותחזית תזרים לחודשים הבאים",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: Sparkles,
      title: "יועץ AI אישי",
      description: "תובנות מותאמות אישית, איתור חריגות והמלצות לשיפור המצב הפיננסי",
      color: "from-amber-500 to-yellow-600"
    }
  ];

  const benefits = [
    { icon: Zap, text: "התחלה מהירה תוך 30 שניות" },
    { icon: Lock, text: "אבטחה ברמה בנקאית" },
    { icon: Globe, text: "תמיכה מלאה בעברית" },
    { icon: Bell, text: "התראות חכמות בזמן אמת" }
  ];



  const stats = [
    { value: "₪1,850", label: "חיסכון ממוצע בחודש" },
    { value: "99%", label: "מהמשתמשים חוסכים יותר" },
    { value: "4.9", label: "דירוג" },
    { value: "60 שניות", label: "להתחלה" }
  ];

  const pricing = [
    {
      name: "חינם",
      price: "₪0",
      period: "לתמיד",
      description: "מושלם להתחלה ולהיכרות",
      whyChoose: "להתחיל לעקוב אחרי ההוצאות בלי מחויבות",
      features: [
        "עד 50 עסקאות בחודש",
        "מעקב הוצאות והכנסות",
        "3 תקציבים",
        "יעד חיסכון אחד",
        "דוחות חודשיים בסיסיים"
      ],
      cta: "התחל בחינם",
      popular: false
    },
    {
      name: "Pro",
      price: "₪29",
      period: "לחודש",
      yearlyPrice: "₪249/שנה (חיסכון 17%)",
      description: "לניהול פיננסי מלא",
      whyChoose: "הכי פופולרי - מתאים לרוב המשתמשים",
      features: [
        "עסקאות ללא הגבלה",
        "יועץ AI אישי + תובנות",
        "מעקב השקעות ודיבידנדים",
        "יעדים ותקציבים ללא הגבלה",
        "דוחות מתקדמים + ייצוא",
        "תמיכה במייל תוך 24 שעות"
      ],
      cta: "נסה 7 ימים חינם",
      popular: true
    },
    {
      name: "Pro Plus",
      price: "₪49",
      period: "לחודש",
      yearlyPrice: "₪399/שנה (חיסכון 17%)",
      description: "לחוויה המלאה והאוטומטית",
      whyChoose: "מי שרוצה אוטומציה מלאה ותמיכה עדיפה",
      features: [
        "כל מה שב-Pro, ובנוסף:",
        "חיבור לבנק (Open Banking)",
        "סנכרון אוטומטי של עסקאות",
        "התראות חכמות AI",
        "היסטוריה ללא הגבלה",
        "תמיכה עדיפה בצ'אט"
      ],
      cta: "נסה 7 ימים חינם",
      popular: false
    }
  ];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl overflow-hidden shadow-lg shadow-purple-500/25">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691aee03ec54fd77e85b0439/85c5d7980_2025-05-31170104.png" 
                alt="Sheetim"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Sheetim
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors text-sm">
              תכונות
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-white transition-colors text-sm">
              תמחור
            </button>

          </nav>

          <Button 
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-white text-slate-900 hover:bg-gray-100 font-semibold text-sm px-4 md:px-6 h-9 md:h-10 shadow-lg"
          >
            <span className="hidden sm:inline">כניסה לחשבון</span>
            <span className="sm:hidden">כניסה</span>
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-6 md:mb-8">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-200">לקוחות חוסכים בממוצע ₪1,850 בחודש</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                שליטה מלאה
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                על הכסף שלך
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              הוצאות, הכנסות, השקעות, דיבידנדים וחובות – הכל במקום אחד.
              <br className="hidden sm:block" />
              <strong className="text-white">תדע בדיוק לאן הכסף הולך ואיך לחסוך יותר.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 px-4">
              <Button 
                size="lg" 
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-lg h-14 px-8 shadow-xl shadow-purple-500/25 border-0"
              >
                התחל בחינם
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => scrollToSection('features')}
                className="text-lg h-14 px-8 bg-white/5 border-white/20 hover:bg-white/10 text-white"
              >
                גלה עוד
                <ChevronDown className="w-5 h-5 mr-2" />
              </Button>
            </div>

            <p className="text-sm text-gray-500 mb-12">
              ✓ ללא כרטיס אשראי &nbsp;&nbsp; ✓ התקנה מיידית &nbsp;&nbsp; ✓ ביטול בכל עת
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 md:mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl md:rounded-3xl border border-white/10 p-2 md:p-4 shadow-2xl shadow-purple-500/10 max-w-5xl mx-auto">
              <div className="bg-slate-900 rounded-xl md:rounded-2xl p-4 md:p-8">
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                  {[
                    { label: "שווי תיק", value: "₪847,230", color: "text-emerald-400", change: "+12.4%" },
                    { label: "הוצאות החודש", value: "₪8,450", color: "text-rose-400", change: "-3.2%" },
                    { label: "חיסכון", value: "₪125,000", color: "text-blue-400", change: "+8.7%" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg md:rounded-xl p-3 md:p-4 border border-white/5">
                      <div className="text-[10px] md:text-xs text-gray-500 mb-1">{item.label}</div>
                      <div className={`text-sm md:text-xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-[10px] md:text-xs text-gray-500 mt-1">{item.change}</div>
                    </div>
                  ))}
                </div>
                <div className="h-24 md:h-48 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg md:rounded-xl flex items-center justify-center border border-white/5">
                  <div className="flex items-end gap-1 md:gap-2 h-16 md:h-32">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-3 md:w-6 bg-gradient-to-t from-purple-500 to-blue-400 rounded-t-sm md:rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="py-8 md:py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2 md:gap-3 text-gray-400">
                <benefit.icon className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                <span className="text-xs md:text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - RiseUp Style */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                איך זה עובד?
              </span>
            </h2>
            <p className="text-gray-400">שלושה צעדים פשוטים לשליטה בכסף</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { step: "1", title: "מתחברים", desc: "נרשמים בחינם ומתחילים להזין עסקאות או מחברים חשבון בנק", icon: "🔗" },
              { step: "2", title: "רואים הכל", desc: "כל ההוצאות, ההכנסות וההשקעות במקום אחד עם תובנות חכמות", icon: "👁️" },
              { step: "3", title: "חוסכים", desc: "מקבלים המלצות מותאמות ומתחילים לחסוך יותר כל חודש", icon: "💰" }
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl md:text-4xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-purple-400 text-sm font-semibold mb-2">שלב {item.step}</div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                הכל במקום אחד
              </span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
              כלים פשוטים ויעילים לניהול הכסף שלך - בדיוק כמו שצריך
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="bg-slate-900/50 border-white/5 hover:border-white/20 transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-5 md:p-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 md:mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg md:text-xl text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                תמחור פשוט ושקוף
              </span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg">
              בחר את התוכנית שמתאימה לך. שדרוג או ביטול בכל עת.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {pricing.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative overflow-hidden ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/50 ring-2 ring-purple-500/50' 
                    : 'bg-slate-900/50 border-white/5'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                    ⭐ הכי פופולרי
                  </div>
                )}
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-1">{plan.description}</p>
                  <p className="text-xs text-purple-300 mb-4">{plan.whyChoose}</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 mr-2">/{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="text-xs text-green-400 mb-6">💡 {plan.yearlyPrice}</p>
                  )}
                  {!plan.yearlyPrice && <div className="mb-6" />}
                  
                  <ul className="space-y-3 mb-6 md:mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                    className={`w-full h-12 md:h-14 text-base md:text-lg font-semibold ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25' 
                        : 'bg-white text-slate-900 hover:bg-gray-100'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Trust elements under pricing */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              ✓ ביטול בכל עת ללא שאלות &nbsp;&nbsp; ✓ ללא התחייבות
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-200 mb-2 text-sm md:text-base">גילוי נאות</h3>
                <p className="text-amber-200/70 text-xs md:text-sm leading-relaxed">
                  Sheetim אינה יועץ השקעות, מס או פנסיה מורשה. המידע באפליקציה הוא למטרות מידע כללי בלבד. 
                  מומלץ להתייעץ עם יועץ מקצועי מורשה לפני קבלת החלטות פיננסיות.
                </p>
                <button 
                  onClick={() => setShowTerms(true)}
                  className="text-amber-400 hover:text-amber-300 text-xs md:text-sm mt-2 inline-block"
                >
                  קרא את תנאי השימוש המלאים ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security - FamilyBiz Style */}
      <section className="py-12 md:py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">המידע שלך בטוח ומוגן</h2>
            <p className="text-gray-400 text-sm">אנחנו משתמשים בטכנולוגיות האבטחה המתקדמות ביותר</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "הצפנת 256-bit", desc: "תקן בנקאי" },
              { icon: Lock, title: "אבטחת SSL", desc: "תעבורה מוצפנת" },
              { icon: Globe, title: "תאימות GDPR", desc: "הגנת פרטיות" },
              { icon: Star, title: "ללא פרטי גישה", desc: "אנחנו לא שומרים סיסמאות" }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <item.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl md:rounded-3xl p-8 md:p-12 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-50" style={{backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px"}} />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">מוכנים להתחיל לחסוך?</h2>
              <p className="text-base md:text-lg text-white/80 mb-6 max-w-xl mx-auto">
                הצטרפו לאלפי ישראלים שכבר שולטים בכסף שלהם
              </p>
              <Button 
                size="lg"
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-white text-purple-600 hover:bg-gray-100 text-lg h-14 px-10 shadow-xl font-semibold"
              >
                התחל 7 ימים ניסיון חינם
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
              <p className="text-white/60 text-sm mt-4">✓ ללא כרטיס אשראי &nbsp; ✓ ביטול בכל עת &nbsp; ✓ תמיכה בעברית</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691aee03ec54fd77e85b0439/85c5d7980_2025-05-31170104.png" 
                  alt="Sheetim"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-white">Sheetim</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              <button onClick={() => setShowTerms(true)} className="text-sm text-gray-400 hover:text-white transition-colors">
                תנאי שימוש
              </button>
              <button onClick={() => setShowPrivacy(true)} className="text-sm text-gray-400 hover:text-white transition-colors">
                מדיניות פרטיות
              </button>
              <span className="text-sm text-gray-500">
                © 2025 Sheetim
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-white/10 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">תנאי שימוש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">1. קבלת התנאים</h3>
              <p>בשימוש באפליקציה "Sheetim" הנך מסכים לתנאי שימוש אלו במלואם. אם אינך מסכים לתנאים אלו, אנא הימנע משימוש באפליקציה.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2. תיאור השירות</h3>
              <p>האפליקציה מספקת כלים לניהול פיננסי אישי, כולל מעקב הוצאות והכנסות, תקציבים, השקעות, חובות ויעדי חיסכון. השירות מיועד לשימוש אישי בלבד.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">3. כתב ויתור חשוב</h3>
              <p className="text-amber-300">⚠️ Sheetim אינה יועץ השקעות, מס או פנסיה מורשה. המידע באפליקציה הוא למטרות מידע כללי בלבד ואינו מהווה ייעוץ פיננסי מקצועי. כל החלטה פיננסית היא באחריותך הבלעדית.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">4. אחריות המשתמש</h3>
              <ul className="list-disc pr-5 space-y-1">
                <li>הנך אחראי לשמירה על סודיות פרטי ההתחברות שלך</li>
                <li>הנך אחראי לדיוק המידע שאתה מזין לאפליקציה</li>
                <li>הנך מתחייב לא להשתמש באפליקציה לכל מטרה בלתי חוקית</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">5. הגבלת אחריות</h3>
              <p>בשום מקרה לא נהיה אחראים לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע משימוש באפליקציה. תשואות עבר אינן מעידות על תוצאות עתידיות.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">6. שינויים בשירות</h3>
              <p>אנו שומרים לעצמנו את הזכות לשנות, להשעות או להפסיק את השירות בכל עת וללא הודעה מוקדמת.</p>
            </div>
            <p className="text-xs text-gray-500 pt-4">עודכן לאחרונה: נובמבר 2025</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-white/10 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">מדיניות פרטיות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">1. איסוף מידע</h3>
              <p>אנו אוספים מידע שאתה מספק לנו באופן ישיר:</p>
              <ul className="list-disc pr-5 space-y-1 mt-2">
                <li>פרטי הרשמה (שם, אימייל)</li>
                <li>נתונים פיננסיים שאתה מזין (הכנסות, הוצאות, השקעות)</li>
                <li>העדפות שימוש</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2. שימוש במידע</h3>
              <p>המידע משמש למטרות הבאות:</p>
              <ul className="list-disc pr-5 space-y-1 mt-2">
                <li>אספקת השירות והתאמתו לצרכיך</li>
                <li>שיפור חווית המשתמש</li>
                <li>תקשורת עמך בנוגע לשירות</li>
                <li>ניתוח סטטיסטי אנונימי</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">3. אבטחת מידע</h3>
              <p>🔒 אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך, כולל הצפנת 256-bit ואחסון מאובטח בשרתים מוגנים.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">4. שיתוף מידע</h3>
              <p>איננו מוכרים, משכירים או משתפים את המידע האישי שלך עם צדדים שלישיים, למעט ספקי שירות הנדרשים להפעלת האפליקציה או כנדרש על פי חוק.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">5. זכויותיך</h3>
              <p>בהתאם לחוק הגנת הפרטיות, הנך זכאי:</p>
              <ul className="list-disc pr-5 space-y-1 mt-2">
                <li>לעיין במידע השמור עליך</li>
                <li>לבקש תיקון מידע שגוי</li>
                <li>לבקש מחיקת המידע שלך</li>
                <li>לייצא את הנתונים שלך</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">6. עוגיות (Cookies)</h3>
              <p>האפליקציה משתמשת בעוגיות לצורך תפעול תקין ושיפור חווית המשתמש.</p>
            </div>
            <p className="text-xs text-gray-500 pt-4">עודכן לאחרונה: נובמבר 2025</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}